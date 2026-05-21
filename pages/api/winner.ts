// pages/api/winner.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

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

    const groupKey = {
      $cond: [
        { $gt: [{ $ifNull: ['$winnerItemId', null] }, null] },
        { $concat: ['id:', '$winnerItemId'] },
        { $concat: ['nu:', { $ifNull: ['$winnerName', ''] }, '||', { $ifNull: ['$winnerUrl', ''] }] },
      ],
    };

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
      { $limit: 1 },
    ]).toArray();

    if (!aggregation.length) {
      return res.status(404).json({ message: '記録がありません。' });
    }

    const topItem = aggregation[0];
    let winner: { name: string; url: string };
    if (topItem.winnerItemId) {
      const current = itemIdToItem.get(topItem.winnerItemId);
      winner = { name: current?.name ?? topItem.winnerName, url: current?.url ?? topItem.winnerUrl };
    } else {
      winner = { name: topItem.winnerName, url: topItem.winnerUrl };
    }

    return res.status(200).json({ winner });
  } catch (err) {
    console.error('winner API エラー:', err);
    return res.status(500).json({ message: 'エラー' });
  }
}
