// /pages/api/admin/comments.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { requireAdmin } from '@/utils/adminAuth';
import { ObjectId } from 'mongodb';

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
    const sortBy = (req.query.sortBy as string) || 'createdAt';

    const filter: any = {};
    if (search) {
      filter.content = { $regex: search, $options: 'i' };
    }

    const sortField = sortBy === 'dislikes' ? { dislikes: -1 } : { createdAt: -1 };

    const total = await commentsCol.countDocuments(filter);
    const comments = await commentsCol
      .find(filter)
      .sort(sortField)
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    // 게임 제목 join
    const gameIds = [...new Set(comments.map(c => c.gameId).filter(Boolean))];
    const gameDocs = await db.collection('games')
      .find({ _id: { $in: gameIds.map(id => { try { return new ObjectId(id); } catch { return null; } }).filter(Boolean) as ObjectId[] } })
      .project({ title: 1 })
      .toArray();
    const gameMap: Record<string, string> = Object.fromEntries(gameDocs.map(g => [g._id.toString(), g.title]));

    const formattedComments = comments.map((comment) => ({
      _id: comment._id.toString(),
      gameId: comment.gameId?.toString() || '',
      gameTitle: gameMap[comment.gameId?.toString() || ''] || '',
      nickname: comment.nickname || '',
      content: comment.content || '',
      createdAt: comment.createdAt || '',
      reportCount: comment.reportCount || 0,
      likes: comment.likes || 0,
      dislikes: comment.dislikes || 0,
    }));

    return res.status(200).json({ comments: formattedComments, total });
  } catch (error) {
    console.error('comments fetch error:', error);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}
