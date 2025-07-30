// /api/admin/deleteGame.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { deleteFromS3 } from '@/lib/aws-s3';
import { requireAdmin } from '@/utils/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (requireAdmin(req, res)) return;
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { gameId } = req.body;

  if (!gameId) {
    return res.status(400).json({ message: '게임 ID가 필요합니다.' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('sukito');
    const collection = db.collection('games');

    // 🔍 削除対象ゲーム取得
    const game = await collection.findOne({ _id: new ObjectId(gameId) });

    if (!game) {
      return res.status(404).json({ message: '게임을 찾을 수 없습니다.' });
    }

    // ✅ itemsHistoryベースS3ファイル削除
    const itemsToDelete = Array.isArray(game.itemsHistory) ? game.itemsHistory : game.items || [];

    const deletionPromises = itemsToDelete
      .filter((item: any) => item.url && (item.type === 'image' || item.type === 'gif'))
      .map((item: any) => deleteFromS3(item.url));

    await Promise.all(deletionPromises);

    // 📦 MongoDBからゲーム文書削除
    const result = await collection.deleteOne({ _id: new ObjectId(gameId) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: '게임을 찾을 수 없습니다.' });
    }

    // 🧹 関連コメントも一緒に削除 (🔧 追加された部分)
    const commentsCollection = db.collection('comments');
    await commentsCollection.deleteMany({ gameId });

          return res.status(200).json({ message: 'ゲーム削除成功' });
  } catch (error) {
          console.error('ゲーム削除失敗:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
