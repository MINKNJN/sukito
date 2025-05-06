// api/games/[id].tsx

import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: '間違ったリクエストです(idなし)。' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('sukito');
    const collection = db.collection('games');

    if (req.method === 'PATCH') {
      const updateData = req.body;

      if (!updateData || typeof updateData !== 'object') {
        return res.status(400).json({ message: '修正するデータがありません。' });
      }

      const { title, desc, visibility, password, type, items } = updateData;

      if (!title || !desc || !visibility || !type || !Array.isArray(items)) {
        return res.status(400).json({ message: '必須項目が抜けています。' });
      }

      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: {
            title,
            desc,
            visibility,
            password: visibility === 'password' ? password : '',
            type,
            items,
            updatedAt: new Date().toISOString(),
          }
        }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ message: 'そのゲームが見つかりません。' });
      }

      return res.status(200).json({ message: '修正完了' });
    }

    return res.status(405).json({ message: '許可されていないメソッドです。' });
  } catch (err) {
    console.error('API エラー:', err);
    return res.status(500).json({ message: 'エラー' });
  }
}

