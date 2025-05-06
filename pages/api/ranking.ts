// pages/api/ranking.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: '許可されていないメソッドです。' });
  }

  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ message: 'ゲームIDが必要です。' });

    const client = await clientPromise;
    const db = client.db('sukito');
    const collection = db.collection('records');

    
    const totalPlays = await collection.countDocuments({ gameId: id });

    const aggregation = await collection.aggregate([
      { $match: { gameId: id } },
      { $group: {
          _id: { name: "$winnerName", url: "$winnerUrl" },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]).toArray();

    const ranking = aggregation.map(item => ({
      name: item._id.name,
      url: item._id.url,
      count: item.count
    }));

    return res.status(200).json({ totalPlays, ranking });
  } catch (err) {
    console.error('ranking API エラー:', err);
    return res.status(500).json({ message: 'エラー' });
  }
}
