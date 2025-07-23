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
      const { gameId, nickname, content, userId, sessionId } = req.body;

      if (!gameId || !nickname || !content) {
        return res.status(400).json({ message: 'ゲームID、ニックネーム、コメントの内容が必要です。' });
      }

      // 로그인 사용자와 비로그인 사용자 구분
      let authorId = null;
      let authorType = 'guest';

      if (userId) {
        // 로그인 사용자
        authorId = userId;
        authorType = 'user';
      } else if (sessionId) {
        // 비로그인 사용자 (세션 기반)
        authorId = sessionId;
        authorType = 'guest';
      } else {
        return res.status(400).json({ message: '認証情報が必要です。' });
      }

      const newComment = {
        gameId,
        nickname,
        content,
        authorId,
        authorType,
        createdAt: new Date().toISOString(),
        likes: 0,
        dislikes: 0,
        likeUsers: [],
        dislikeUsers: []
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
      const { id, page = '1', limit = '20' } = req.query;

      if (!id) {
        return res.status(400).json({ message: 'ゲームIDが必要です。' });
      }

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      const comments = await collection
        .find({ gameId: id })
        .sort({ likes: -1, createdAt: -1 }) // いいね順でソート、同じいいね数なら最新順
        .skip(skip)
        .limit(limitNum)
        .toArray();

      return res.status(200).json({ comments });
    } catch (err) {
      console.error('コメントエラー:', err);
      return res.status(500).json({ message: 'エラー' });
    }
  }

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
