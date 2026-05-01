// pages/api/battles.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '許可されていないメソッドです。' });
  }

  try {
    const { gameId, winnerName, winnerUrl } = req.body;

    if (!gameId || typeof winnerName !== 'string' || !winnerName.trim() ||
        typeof winnerUrl !== 'string' || !winnerUrl.startsWith('http')) {
      return res.status(400).json({ message: '有効なデータではありません。' });
    }

    const client = await clientPromise;
    const db = client.db('sukito');

    await db.collection('battles').insertOne({
      gameId,
      winnerName,
      winnerUrl,
      playedAt: new Date().toISOString(),
    });

    return res.status(201).json({ message: '記録完了' });
  } catch (err) {
    console.error('battles API エラー:', err);
    return res.status(500).json({ message: 'エラー' });
  }
}
