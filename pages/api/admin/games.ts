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

    const filter: any = {};
    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    const total = await gamesCol.countDocuments(filter);
    const games = await gamesCol
      .find(filter)
      .project({ title: 1, desc: 1, items: 1 })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    const formattedGames = games.map((game: any) => ({
      _id: game._id.toString(),
      title: game.title || '',
      desc: game.desc || '',
      itemsCount: Array.isArray(game.items) ? game.items.length : 0,
    }));

    return res.status(200).json({ games: formattedGames, total });
  } catch (error) {
    console.error('게임 목록 불러오기 실패:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
