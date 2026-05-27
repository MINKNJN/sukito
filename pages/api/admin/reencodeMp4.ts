import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { requireAdmin } from '@/utils/adminAuth';
import { uploadToS3WithKey } from '@/lib/aws-s3';
import fs from 'fs';
import os from 'os';
import path from 'path';
import axios from 'axios';

const EC2_SERVER_URL = process.env.NODE_ENV === 'production'
  ? 'http://localhost:3001'
  : (process.env.EC2_SERVER_URL || 'http://localhost:3001');

const CLOUDFRONT_HOST = 'd2ojyvx5ines08.cloudfront.net';

function extractS3Key(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === CLOUDFRONT_HOST) return u.pathname.replace(/^\//, '');
  } catch {}
  return null;
}

async function reencodeViaEC2(
  mp4Url: string,
  tmpDir: string
): Promise<{ mp4Path: string; thumbPath: string | null }> {
  const filename = `reenc_${Date.now()}`;

  const reencodeRes = await axios.post(
    `${EC2_SERVER_URL}/reencode`,
    { mp4Url, filename },
    { timeout: 180000 }
  );

  const result = reencodeRes.data;
  if (!result.success) throw new Error(result.message || '再エンコード失敗');

  const mp4Res = await axios.get(`${EC2_SERVER_URL}${result.data.downloadUrl}`, {
    responseType: 'arraybuffer',
    timeout: 60000,
  });
  const mp4Path = path.join(tmpDir, `${filename}_out.mp4`);
  fs.writeFileSync(mp4Path, Buffer.from(mp4Res.data));

  let thumbPath: string | null = null;
  if (result.data.thumbnailDownloadUrl) {
    try {
      const thumbRes = await axios.get(`${EC2_SERVER_URL}${result.data.thumbnailDownloadUrl}`, {
        responseType: 'arraybuffer',
        timeout: 30000,
      });
      thumbPath = path.join(tmpDir, `${filename}_thumb.jpg`);
      fs.writeFileSync(thumbPath, Buffer.from(thumbRes.data));
    } catch {}
  }

  return { mp4Path, thumbPath };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (requireAdmin(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  // SSE 헤더 설정
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (data: object) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const { dryRun, preCheckedTargets } = req.body as {
    dryRun: boolean;
    preCheckedTargets?: { gameId: string; gameTitle: string; itemName: string; mp4Url: string; thumbUrl?: string }[];
  };

  try {
    const client = await clientPromise;
    const db = client.db('sukito');
    const games = await db.collection('games').find({ 'items.type': 'gif' }).toArray();

    const candidates: { gameId: string; gameTitle: string; itemName: string; mp4Url: string; thumbUrl?: string }[] = [];
    for (const game of games) {
      const items: any[] = Array.isArray(game.items) ? game.items : [];
      for (const item of items) {
        if (item.type === 'gif' && typeof item.url === 'string' && item.url.endsWith('.mp4')) {
          candidates.push({
            gameId: game._id.toString(),
            gameTitle: game.title || '',
            itemName: item.name || '',
            mp4Url: item.url,
            thumbUrl: item.thumbUrl,
          });
        }
      }
    }

    // EC2 헬스 체크
    try {
      await axios.get(`${EC2_SERVER_URL}/health`, { timeout: 5000 });
    } catch (e: any) {
      send({ type: 'error', message: `EC2サーバーに接続できません: ${e?.message || String(e)}` });
      res.end();
      return;
    }

    // 실행 시 DryRun에서 확인한 targets가 있으면 체크 생략
    let targets: typeof candidates = [];

    if (!dryRun && preCheckedTargets && preCheckedTargets.length > 0) {
      targets = preCheckedTargets;
    } else {
      // Level 초과 파일 필터링 (5개씩 배치, SSE로 진행 상황 전송)
      const BATCH_SIZE = 5;
      send({ type: 'start', phase: 'checking', total: candidates.length });

      for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
        const batch = candidates.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(
          batch.map(async (c) => {
            try {
              const checkRes = await axios.post(
                `${EC2_SERVER_URL}/check-mp4`,
                { mp4Url: c.mp4Url },
                { timeout: 20000 }
              );
              return { candidate: c, needsReencode: checkRes.data?.data?.needsReencode === true };
            } catch {
              return { candidate: c, needsReencode: false };
            }
          })
        );
        for (const r of batchResults) {
          if (r.needsReencode) targets.push(r.candidate);
        }
        send({
          type: 'checking',
          checked: Math.min(i + BATCH_SIZE, candidates.length),
          total: candidates.length,
          found: targets.length,
        });
      }
    }

    if (dryRun) {
      send({
        type: 'done',
        dryRun: true,
        total: candidates.length,
        count: targets.length,
        targets: targets.map((t) => ({ gameTitle: t.gameTitle, itemName: t.itemName, mp4Url: t.mp4Url })),
        message: `[DryRun] 全体 ${candidates.length}件 中 Level超過 ${targets.length}件`,
      });
      res.end();
      return;
    }

    // 실행: Level 초과 파일만 재인코딩
    const tmpDir = os.tmpdir();
    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    send({ type: 'start', phase: 'processing', total: targets.length });

    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      send({
        type: 'progress',
        current: i + 1,
        total: targets.length,
        gameTitle: target.gameTitle,
        itemName: target.itemName,
      });

      const s3Key = extractS3Key(target.mp4Url);
      if (!s3Key) {
        failCount++;
        const errMsg = `${target.gameTitle} / ${target.itemName}: CloudFrontURLではありません`;
        errors.push(errMsg);
        send({ type: 'result', status: 'error', current: i + 1, total: targets.length, error: errMsg });
        continue;
      }

      let mp4Path: string | null = null;
      let thumbPath: string | null = null;
      try {
        const result = await reencodeViaEC2(target.mp4Url, tmpDir);
        mp4Path = result.mp4Path;
        thumbPath = result.thumbPath;

        await uploadToS3WithKey(mp4Path, s3Key, 'video/mp4');

        if (thumbPath && !target.thumbUrl) {
          const thumbKey = s3Key.replace(/\.mp4$/i, '_thumb.jpg');
          const newThumbUrl = await uploadToS3WithKey(thumbPath, thumbKey, 'image/jpeg');
          const { ObjectId } = await import('mongodb');
          await db.collection('games').updateOne(
            { _id: ObjectId.createFromHexString(target.gameId), 'items.url': target.mp4Url },
            { $set: { 'items.$.thumbUrl': newThumbUrl } }
          );
        }

        successCount++;
        send({ type: 'result', status: 'success', current: i + 1, total: targets.length });
      } catch (e: any) {
        failCount++;
        const msg = e?.response?.data?.message || e?.message || e?.code || String(e);
        const errMsg = `${target.gameTitle} / ${target.itemName}: ${msg}`;
        errors.push(errMsg);
        send({ type: 'result', status: 'error', current: i + 1, total: targets.length, error: errMsg });
      } finally {
        // Next.js 측 tmp 파일 즉시 삭제
        try {
          if (mp4Path && fs.existsSync(mp4Path)) fs.unlinkSync(mp4Path);
          if (thumbPath && fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
        } catch {}
      }

      // 파일 처리 후 3초 대기 — EC2 메모리/CPU 회복 시간 확보
      if (i < targets.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    send({
      type: 'done',
      dryRun: false,
      total: targets.length,
      successCount,
      failCount,
      errors,
      message: `${successCount}件成功 / ${failCount}件失敗`,
    });
    res.end();
  } catch (error: any) {
    send({ type: 'error', message: error?.message || 'Internal Server Error' });
    res.end();
  }
}
