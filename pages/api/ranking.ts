// pages/api/ranking.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// itemId があれば "id:XXX"、なければ "nu:name||url" をキーとして返す
const groupKey = {
  $cond: [
    { $gt: [{ $ifNull: ['$winnerItemId', null] }, null] },
    { $concat: ['id:', '$winnerItemId'] },
    { $concat: ['nu:', { $ifNull: ['$winnerName', ''] }, '||', { $ifNull: ['$winnerUrl', ''] }] },
  ],
};

const lossGroupKey = {
  $cond: [
    { $gt: [{ $ifNull: ['$loserItemId', null] }, null] },
    { $concat: ['id:', '$loserItemId'] },
    { $concat: ['nu:', { $ifNull: ['$loserName', ''] }, '||', { $ifNull: ['$loserUrl', ''] }] },
  ],
};

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

    // 現在のゲーム項目を取得して itemId → {name, url} マップを作る
    const gameDoc = await db.collection('games').findOne(
      { _id: new ObjectId(id as string) },
      { projection: { items: 1 } }
    );
    const gameItems: any[] = gameDoc?.items || [];
    const itemIdToItem = new Map<string, { name: string; url: string }>();
    gameItems.forEach((item: any) => {
      if (item.itemId) itemIdToItem.set(item.itemId, { name: item.name, url: item.url });
    });

    const totalPlays = await collection.countDocuments({ gameId: id });

    const aggregation = await collection.aggregate([
      { $match: { gameId: id } },
      {
        $group: {
          _id: groupKey,
          count: { $sum: 1 },
          winnerName: { $first: '$winnerName' },
          winnerUrl: { $first: '$winnerUrl' },
          winnerItemId: { $first: '$winnerItemId' },
        },
      },
      { $sort: { count: -1 } },
    ]).toArray();

    const battlesCol = db.collection('battles');
    const [totalBattles, battleAgg, lossAgg] = await Promise.all([
      battlesCol.countDocuments({ gameId: id }),
      battlesCol.aggregate([
        { $match: { gameId: id } },
        {
          $group: {
            _id: groupKey,
            battleWins: { $sum: 1 },
            winnerItemId: { $first: '$winnerItemId' },
          },
        },
      ]).toArray(),
      battlesCol.aggregate([
        { $match: { gameId: id } },
        {
          $group: {
            _id: lossGroupKey,
            battleLosses: { $sum: 1 },
          },
        },
      ]).toArray(),
    ]);

    const battleMap = new Map<string, number>();
    battleAgg.forEach(item => battleMap.set(item._id, item.battleWins));

    const lossMap = new Map<string, number>();
    lossAgg.forEach(item => lossMap.set(item._id, item.battleLosses));

    const ranking = aggregation.map(item => {
      // itemId があれば現在のゲーム項目から name/url を解決
      let name: string;
      let url: string;
      if (item.winnerItemId) {
        const current = itemIdToItem.get(item.winnerItemId);
        name = current?.name ?? item.winnerName;
        url = current?.url ?? item.winnerUrl;
      } else {
        name = item.winnerName;
        url = item.winnerUrl;
      }

      const key = item._id as string;
      const battleWins = battleMap.get(key) ?? 0;
      const battleLosses = lossMap.get(key) ?? 0;
      const participated = battleWins + battleLosses;
      const battleRate = participated > 0 ? Math.round(battleWins / participated * 1000) / 10 : 0;

      return {
        name,
        url,
        count: item.count,
        battleWins,
        battleRate,
        ...(item.winnerItemId ? { itemId: item.winnerItemId } : {}),
      };
    });

    return res.status(200).json({ totalPlays, totalBattles, ranking });
  } catch (err) {
    console.error('ranking API エラー:', err);
    return res.status(500).json({ message: 'エラー' });
  }
}
