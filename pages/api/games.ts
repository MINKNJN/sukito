// pages/api/games.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

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
      const games = await collection.find({}).sort({ createdAt: -1 }).toArray();
      return res.status(200).json(games);
    }

    if (req.method === 'POST') {
      const gameData = req.body;

      if (!Array.isArray(gameData.items) || gameData.items.length === 0) {
        return res.status(400).json({ message: 'items配列が必要です。' });
      }

      const invalidItem = gameData.items.find((item: any) => !item.name || !item.url || !item.type);
      if (invalidItem) {
        return res.status(400).json({ message: '各itemは、name、url、typeをすべて含める必要があります。' });
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
      for (const item of history) {
        if (item.type === 'image' || item.type === 'gif') {
          const match = item.url.match(/\/upload\/v\d+\/([^/.]+)\.(jpg|jpeg|png|gif)/i);
          if (match && match[1]) {
            const publicId = match[1];
            try {
              await cloudinary.uploader.destroy(publicId, {
                resource_type: 'image'
              });
            } catch (err) {
              console.warn('Cloudinary 削除 エラー:', publicId, err);
            }
          }
        }
      }

      
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

