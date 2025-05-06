// pages/api/comments/report.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '許可されていないメソッドです。' });
  }

  try {
    const { commentId } = req.body;

    if (!commentId) {
      return res.status(400).json({ message: 'コメントIDが必要です。' });
    }

    const client = await clientPromise;
    const db = client.db('sukito');
    const collection = db.collection('comments');

    
    await collection.updateOne(
      { _id: new ObjectId(commentId) },
      { $inc: { reportCount: 1 } }
    );

    return res.status(200).json({ message: '通報が受理されました。' });
  } catch (err) {
    console.error('コメント通報エラー:', err);
    return res.status(500).json({ message: 'エラー' });
  }
}
