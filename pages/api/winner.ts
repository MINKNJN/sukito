// pages/api/winner.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: '許可されていないメソッドです。' });
  }

  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ message: 'ゲームIDが必要です。' });

    const client = await clientPromise;
    const db = client.db('sukito');
    const collection = db.collection('records');

    const latestRecord = await collection.find({ gameId: id }).sort({ playedAt: -1 }).limit(1).toArray();

    if (!latestRecord.length) {
      return res.status(404).json({ message: '記録がありません。' });
    }

    const winner = {
      name: latestRecord[0].winnerName,
      url: latestRecord[0].winnerUrl
    };

    return res.status(200).json({ winner });
  } catch (err) {
    console.error('winner API エラー:', err);
    return res.status(500).json({ message: 'エラー' });
  }
}
