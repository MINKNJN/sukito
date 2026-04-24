// /pages/api/admin/games.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { requireAdmin } from '@/utils/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (requireAdmin(req, res)) return;
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('sukito');
    const gamesCol = db.collection('games');

    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '20', 10);
    const search = (req.query.search as string) || '';
    const statusFilter = (req.query.status as string) || '';

    const filter: any = {};
    if (search) filter.title = { $regex: search, $options: 'i' };
    if (statusFilter === 'approved') {
      filter.$or = [{ status: 'approved' }, { status: { $exists: false } }];
    } else if (statusFilter) {
      filter.status = statusFilter;
    }

    const [total, games, pendingCount, approvedCount, rejectedCount] = await Promise.all([
      gamesCol.countDocuments(filter),
      gamesCol
        .find(filter)
        .project({ title: 1, items: 1, type: 1, status: 1, rejectionReason: 1, createdAt: 1 })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      gamesCol.countDocuments({ status: 'pending' }),
      gamesCol.countDocuments({ $or: [{ status: 'approved' }, { status: { $exists: false } }] }),
      gamesCol.countDocuments({ status: 'rejected' }),
    ]);

    const formattedGames = games.map((game: any) => ({
      _id: game._id.toString(),
      title: game.title || '',
      itemsCount: Array.isArray(game.items) ? game.items.length : 0,
      type: game.type || (Array.isArray(game.items) && game.items[0]?.type) || 'image',
      status: game.status || 'approved',
      rejectionReason: game.rejectionReason ?? null,
      createdAt: game.createdAt || null,
    }));

    return res.status(200).json({
      games: formattedGames,
      total,
      statusCounts: { pending: pendingCount, approved: approvedCount, rejected: rejectedCount },
    });
  } catch (error) {
    console.error('게임 목록 불러오기 실패:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
