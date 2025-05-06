// /pages/api/admin/deleteComment.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
      return res.status(200).json({ message: '댓글 삭제 성공' });
    } else {
      return res.status(404).json({ message: '댓글을 찾을 수 없습니다.' });
    }
  } catch (error) {
    console.error('댓글 삭제 오류:', error);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}
