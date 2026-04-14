// pages/api/admin/regenerate-thumbnails.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { uploadToS3 } from '@/lib/aws-s3';
import { requireAdmin } from '@/utils/adminAuth';
import { ObjectId } from 'mongodb';
import fs from 'fs';
import path from 'path';

const EC2_SERVER_URL = process.env.NODE_ENV === 'production'
  ? 'http://localhost:3001'
  : (process.env.EC2_SERVER_URL || 'http://localhost:3001');

const tmpDir = path.join(process.cwd(), 'tmp');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (requireAdmin(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ message: '허용되지 않는 메서드입니다.' });

  try {
    const client = await clientPromise;
    const db = client.db('sukito');
    const gamesCol = db.collection('games');
    const axios = require('axios');

    // thumbUrl 없는 gif 타입 게임 조회
    const games = await gamesCol.find({
      type: 'gif',
      $or: [
        { 'items.thumbUrl': { $exists: false } },
        { 'items.thumbUrl': '' },
        { 'items.thumbUrl': null },
      ]
    }).toArray();

    let processed = 0;
    let failed = 0;
    let skipped = 0;

    for (const game of games) {
      const updatedItems = [...game.items];
      const updatedThumbnails = [...(game.thumbnails || [])];
      let gameUpdated = false;

      for (let i = 0; i < updatedItems.length; i++) {
        const item = updatedItems[i];
        if (item.thumbUrl) { skipped++; continue; }
        if (!item.url || !item.url.includes('.mp4')) { skipped++; continue; }

        try {
          const safeFilename = `regen_${game._id}_${i}`;

          // Express 서버에 썸네일 추출 요청
          const extractRes = await axios.post(`${EC2_SERVER_URL}/extract-thumbnail-from-url`, {
            mp4Url: item.url,
            filename: safeFilename,
          }, { timeout: 60000 });

          if (!extractRes.data.success) { failed++; continue; }

          // 썸네일 다운로드
          const thumbDownloadUrl = `${EC2_SERVER_URL}${extractRes.data.data.thumbnailDownloadUrl}`;
          const thumbResponse = await axios.get(thumbDownloadUrl, { responseType: 'arraybuffer', timeout: 30000 });

          const thumbLocalPath = path.join(tmpDir, `${safeFilename}_thumb.jpg`);
          fs.writeFileSync(thumbLocalPath, Buffer.from(thumbResponse.data));

          // S3 업로드
          const folder = String(game._id);
          const thumbUrl = await uploadToS3(thumbLocalPath, `${safeFilename}_thumb.jpg`, 'image/jpeg', folder);
          fs.unlinkSync(thumbLocalPath);

          // 아이템 업데이트
          updatedItems[i] = { ...item, thumbUrl };

          // thumbnails 배열도 같은 url이면 thumbUrl 추가
          const thumbIdx = updatedThumbnails.findIndex((t: any) => t.url === item.url);
          if (thumbIdx !== -1) {
            updatedThumbnails[thumbIdx] = { ...updatedThumbnails[thumbIdx], thumbUrl };
          }

          gameUpdated = true;
          processed++;
        } catch {
          failed++;
        }
      }

      if (gameUpdated) {
        await gamesCol.updateOne(
          { _id: new ObjectId(game._id) },
          { $set: { items: updatedItems, thumbnails: updatedThumbnails } }
        );
      }
    }

    return res.status(200).json({
      message: '완료',
      processed,
      failed,
      skipped,
      total: games.length,
    });
  } catch (error) {
    console.error('regenerate-thumbnails error:', error);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}
