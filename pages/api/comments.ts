// pages/api/comments.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb'; 

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const client = await clientPromise;
  const db = client.db('sukito');
  const collection = db.collection('comments');

  if (req.method === 'POST') {
    try {
      const { gameId, nickname, content } = req.body;

      if (!gameId || !nickname || !content) {
        return res.status(400).json({ message: 'ゲームID、ニックネーム、コメントの内容が必要です。' });
      }

      const newComment = {
        gameId,
        nickname,
        content,
        createdAt: new Date().toISOString(),
        reportCount: 0 
      };

      await collection.insertOne(newComment);

      return res.status(201).json({ message: 'コメント保存完了' });
    } catch (err) {
      console.error('コメント保存エラー:', err);
      return res.status(500).json({ message: 'エラー' });
    }
  }

  if (req.method === 'GET') {
    try {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ message: 'ゲームIDが必要です。' });
      }

      const comments = await collection
        .find({ gameId: id })
        .sort({ createdAt: -1 })
        .toArray();

      const commentsWithReports = comments.map((c) => ({
        ...c,
        reportCount: typeof c.reportCount === 'number' ? c.reportCount : 0
      }));

      return res.status(200).json({ comments: commentsWithReports });
    } catch (err) {
      console.error('コメントエラー:', err);
      return res.status(500).json({ message: 'エラー' });
    }
  }

  // ✅ 게임 삭제에 따른 댓글 일괄 삭제
  if (req.method === 'DELETE') {
    try {
      const { gameId } = req.body;

      if (!gameId) {
        return res.status(400).json({ message: 'ゲームIDが必要です。' });
      }

      const result = await collection.deleteMany({ gameId });

      return res.status(200).json({
        message: 'コメント削除完了',
        deletedCount: result.deletedCount,
      });
    } catch (err) {
      console.error('コメント削除エラー:', err);
      return res.status(500).json({ message: 'エラー' });
    }
  }

  return res.status(405).json({ message: '許可されていないメソッドです。' });
}
