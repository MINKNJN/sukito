// /pages/api/admin/deleteComment.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { requireAdmin } from '@/utils/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (requireAdmin(req, res)) return;
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '허용되지 않는 메서드입니다.' });
  }

  const { commentId } = req.body;

  if (!commentId) {
    return res.status(400).json({ message: 'commentId가 필요합니다.' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('sukito');

    const result = await db.collection('comments').deleteOne({ _id: new ObjectId(commentId) });

    if (result.deletedCount === 1) {
      return res.status(200).json({ message: 'コメント削除成功' });
    } else {
              return res.status(404).json({ message: 'コメントが見つかりません。' });
    }
  } catch (error) {
          console.error('コメント削除エラー:', error);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}
