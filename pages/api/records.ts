// pages/api/records.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '許可されていないメソッドです。' });
  }

  try {
    const { gameId, winnerName, winnerUrl } = req.body;

    if (
      !gameId ||
      typeof winnerName !== 'string' ||
      !winnerName.trim() ||
      typeof winnerUrl !== 'string' ||
      !winnerUrl.startsWith('http')
    ) {
      return res.status(400).json({ message: '有効なデータではありません。' });
    }

    if (!gameId || !winnerName || !winnerUrl) {
      return res.status(400).json({ message: '必須データが欠落しています。' });
    }

    const client = await clientPromise;
    const db = client.db('sukito');
    const collection = db.collection('records');

    await collection.insertOne({
      gameId,
      winnerName,
      winnerUrl,
      playedAt: new Date().toISOString()
    });

    return res.status(201).json({ message: '記録保存完了' });
  } catch (err) {
    console.error('記録保存エラー:', err);
    return res.status(500).json({ message: 'エラー' });
  }
}
