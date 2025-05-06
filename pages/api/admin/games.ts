// /pages/api/admin/games.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('sukito');

    const games = await db.collection('games')
      .find({})
      .project({ title: 1, desc: 1, items: 1 })
      .toArray();

    const formattedGames = games.map((game: any) => ({
      _id: game._id.toString(),
      title: game.title || '',
      desc: game.desc || '',
      itemsCount: Array.isArray(game.items) ? game.items.length : 0,
    }));

    return res.status(200).json({ games: formattedGames });
  } catch (error) {
    console.error('게임 목록 불러오기 실패:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
