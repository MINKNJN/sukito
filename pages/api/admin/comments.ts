// /pages/api/admin/comments.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { requireAdmin } from '@/utils/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (requireAdmin(req, res)) return;
  if (req.method !== 'GET') {
    return res.status(405).json({ message: '허용되지 않는 메서드입니다.' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('sukito');
    const commentsCol = db.collection('comments');

    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '20', 10);
    const search = (req.query.search as string) || '';

    const filter: any = {};
    if (search) {
      filter.content = { $regex: search, $options: 'i' };
    }

    const total = await commentsCol.countDocuments(filter);
    const comments = await commentsCol
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    const formattedComments = comments.map((comment) => ({
      _id: comment._id.toString(),
      gameId: comment.gameId?.toString() || '',
      gameTitle: comment.gameTitle || '',
      nickname: comment.nickname || '알 수 없음',
      content: comment.content || '',
      createdAt: comment.createdAt || '',
      reportCount: comment.reportCount || '',
    }));

    return res.status(200).json({ comments: formattedComments, total });
  } catch (error) {
    console.error('댓글 목록 불러오기 실패:', error);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}
