// pages/api/games.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { deleteFromS3 } from '@/lib/aws-s3';

function mergeItemsHistory(original: any[], updates: any[]) {
  const key = (item: any) => `${item.url}-${item.type}`;
  const map = new Map<string, any>();
  original.forEach(item => map.set(key(item), item));
  updates.forEach(item => map.set(key(item), item));
  return Array.from(map.values());
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const client = await clientPromise;
    const db = client.db('sukito');
    const collection = db.collection('games');

    const { id } = req.query;

    if (req.method === 'GET') {
      if (id && typeof id === 'string') {
        const game = await collection.findOne({ _id: new ObjectId(id) });
        if (!game) return res.status(404).json({ message: 'ゲームが見つかりません。' });
        return res.status(200).json(game);
      }
      const games = await collection.find(
        {},
        {
          projection: {
            title: 1,
            desc: 1,
            thumbnails: 1,
            createdAt: 1,
            createdBy: 1,
          },
        }
      )
      .sort({ createdAt: -1 })
      .limit(24)
      .toArray();

      // 각 게임별 playCount(플레이 수) 집계
      const client2 = await clientPromise;
      const db2 = client2.db('sukito');
      const recordsCollection = db2.collection('records');
      const gamesWithPlayCount = await Promise.all(games.map(async (game) => {
        const playCount = await recordsCollection.countDocuments({ gameId: game._id.toString() });
        return { ...game, playCount };
      }));

      return res.status(200).json(gamesWithPlayCount);

    }

    if (req.method === 'POST') {
      const gameData = req.body;

      // items가 비어 있어도 임시 생성 허용 (최종 저장은 PATCH에서 체크)
      if (Array.isArray(gameData.items) && gameData.items.length > 0) {
        const invalidItem = gameData.items.find((item: any) => !item.name || !item.url || !item.type);
        if (invalidItem) {
          return res.status(400).json({ message: '各itemは、name、url、typeをすべて含める必要があります。' });
        }
      }

      if (!gameData.createdAt) {
        gameData.createdAt = new Date().toISOString();
      }

      gameData.itemsHistory = [...gameData.items];

      const result = await collection.insertOne(gameData);
      return res.status(201).json({ message: '保存完了', id: result.insertedId });
    }

    if (req.method === 'PATCH') {
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ message: '修正IDなし' });
      }

      const updateData = req.body;
      if (!updateData || typeof updateData !== 'object') {
        return res.status(400).json({ message: '修正するデータがありません。' });
      }

      const game = await collection.findOne({ _id: new ObjectId(id) });
      if (!game) {
        return res.status(404).json({ message: 'そのゲームが見つかりません。' });
      }

      const existingHistory = Array.isArray(game.itemsHistory) ? game.itemsHistory : [];
      const newItems = Array.isArray(updateData.items) ? updateData.items : [];

      // S3削除: 既存にあったが、修正後にはないファイル削除
      const oldUrls = new Set(existingHistory.map((item: any) => item.url));
      const newUrls = new Set(newItems.map((item: any) => item.url));
      const deletedUrls = [...oldUrls].filter(url => !newUrls.has(url));
      await Promise.all(deletedUrls.map(url => deleteFromS3(url)));

      const updatedHistory = mergeItemsHistory(existingHistory, newItems);
      updateData.itemsHistory = updatedHistory;

      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { ...updateData } }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ message: 'そのゲームが見つかりません。' });
      }

      return res.status(200).json({ message: '修正完了' });
    }

    if (req.method === 'DELETE') {
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ message: '削除するIDが必要です。' });
      }

      const game = await collection.findOne({ _id: new ObjectId(id) });
      if (!game) {
        return res.status(404).json({ message: '削除するゲームが必要です。' });
      }

      const history = Array.isArray(game.itemsHistory) ? game.itemsHistory : game.items || [];
      await Promise.all(history.map((item: any) => item.url && deleteFromS3(item.url)));

      const result = await collection.deleteOne({ _id: new ObjectId(id) });

      if (result.deletedCount === 0) {
        return res.status(404).json({ message: '削除するゲームが必要です。' });
      }

      const commentsCollection = db.collection('comments');
      await commentsCollection.deleteMany({ gameId: id });

      return res.status(200).json({ message: '削除完了' });
    }

    return res.status(405).json({ message: '許可されていないメソッドです。' });
  } catch (err) {
    console.error('API エラー:', err);
    return res.status(500).json({ message: 'エラー' });
  }
}

