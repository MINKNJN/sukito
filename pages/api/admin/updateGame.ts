// /api/admin/updateGame.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { gameId, newTitle, newDesc } = req.body;

  if (!gameId || !newTitle || !newDesc) {
    return res.status(400).json({ message: 'gameId, newTitle, newDesc가 모두 필요합니다.' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('sukito');

    const result = await db.collection('games').updateOne(
      { _id: new ObjectId(gameId) },
      { $set: { title: newTitle, desc: newDesc } }
    );

    if (result.matchedCount === 1) {
      return res.status(200).json({ message: 'ゲーム修正成功' });
    } else {
      return res.status(404).json({ message: '게임을 찾을 수 없습니다.' });
    }
  } catch (error) {
    console.error('ゲーム修正失敗:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
