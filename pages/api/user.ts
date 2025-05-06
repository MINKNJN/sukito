// pages/api/user.ts
import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'GETのリクエストのみ許可されます。' });
  }

  const { userId } = req.query;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ message: 'userIDがありません。' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('sukito');

    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return res.status(404).json({ message: 'ユーザーが見つかりません。' });
    }

    return res.status(200).json({
      email: user.email || '',
      nickname: user.nickname || '',
    });
  } catch (error) {
    console.error('user API エラー:', error);
    return res.status(500).json({ message: 'エラー' });
  }
}
