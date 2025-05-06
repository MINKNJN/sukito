// /pages/api/admin/comments.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: '허용되지 않는 메서드입니다.' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('sukito');

    const comments = await db.collection('comments')
      .find({})
      .sort({ createdAt: -1 }) // 최신순
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

    return res.status(200).json({ comments: formattedComments });
  } catch (error) {
    console.error('댓글 목록 불러오기 실패:', error);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}
