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

  const { dryRun } = req.body as { dryRun: boolean };

  try {
    const client = await clientPromise;
    const db = client.db('sukito');
    const games = await db.collection('games').find({ 'items.type': 'gif' }).toArray();

    // 후보 수집
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
      return res.status(503).json({ message: `EC2サーバーに接続できません: ${e?.message || String(e)}` });
    }

    // level > 4.1 (level > 41) 인 파일만 필터링
    const checkResults = await Promise.all(
      candidates.map(async (c) => {
        try {
          const res = await axios.post(`${EC2_SERVER_URL}/check-mp4`, { mp4Url: c.mp4Url }, { timeout: 20000 });
          return { candidate: c, needsReencode: res.data?.data?.needsReencode === true, level: res.data?.data?.level };
        } catch {
          return { candidate: c, needsReencode: false, level: null };
        }
      })
    );
    const targets = checkResults.filter(r => r.needsReencode).map(r => r.candidate);

    if (dryRun) {
      return res.status(200).json({
        dryRun: true,
        total: candidates.length,
        count: targets.length,
        targets: targets.map((t) => ({ gameTitle: t.gameTitle, itemName: t.itemName, mp4Url: t.mp4Url })),
        message: `[DryRun] 全体 ${candidates.length}件 中 再エンコード必要 ${targets.length}件`,
      });
    }

    const tmpDir = os.tmpdir();
    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    for (const target of targets) {
      const s3Key = extractS3Key(target.mp4Url);
      if (!s3Key) {
        failCount++;
        errors.push(`${target.gameTitle} / ${target.itemName}: CloudFrontURLではありません`);
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
      } catch (e: any) {
        failCount++;
        const msg = e?.response?.data?.message || e?.message || e?.code || String(e);
        console.error(`[reencodeMp4] 失敗: ${target.gameTitle} / ${target.itemName}`, e);
        errors.push(`${target.gameTitle} / ${target.itemName}: ${msg}`);
      } finally {
        try {
          if (mp4Path && fs.existsSync(mp4Path)) fs.unlinkSync(mp4Path);
          if (thumbPath && fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
        } catch {}
      }
    }

    return res.status(200).json({
      dryRun: false,
      total: targets.length,
      successCount,
      failCount,
      errors,
      message: `${successCount}件成功 / ${failCount}件失敗`,
    });
  } catch (error: any) {
    console.error('reencodeMp4 失敗:', error);
    return res.status(500).json({ message: error?.message || 'Internal Server Error' });
  }
}
