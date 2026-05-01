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
          _id: { name: '$winnerName', url: '$winnerUrl' },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]).toArray();

    const battlesCol = db.collection('battles');
    const [totalBattles, battleAgg] = await Promise.all([
      battlesCol.countDocuments({ gameId: id }),
      battlesCol.aggregate([
        { $match: { gameId: id } },
        { $group: {
            _id: { name: '$winnerName', url: '$winnerUrl' },
            battleWins: { $sum: 1 }
          }
        }
      ]).toArray(),
    ]);

    const battleMap = new Map<string, number>();
    battleAgg.forEach(item => {
      battleMap.set(`${item._id.name}||${item._id.url}`, item.battleWins);
    });

    const ranking = aggregation.map(item => {
      const battleWins = battleMap.get(`${item._id.name}||${item._id.url}`) ?? 0;
      const battleRate = totalBattles > 0 ? Math.round(battleWins / totalBattles * 1000) / 10 : 0;
      return {
        name: item._id.name,
        url: item._id.url,
        count: item.count,
        battleWins,
        battleRate,
      };
    });

    return res.status(200).json({ totalPlays, totalBattles, ranking });
  } catch (err) {
    console.error('ranking API エラー:', err);
    return res.status(500).json({ message: 'エラー' });
  }
}
