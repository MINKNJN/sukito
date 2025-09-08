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

      // 좋아요 상위 3개 고정 댓글 (좋아요순 정렬)
      const pinnedComments = await collection
        .find({ gameId: id, likes: { $gte: 1 } }) // 최소 1개 이상 좋아요
        .sort({ likes: -1, createdAt: -1 }) // 좋아요순, 동일시 최신순
        .limit(3) // 상위 3개만
        .toArray();

      // 일반 댓글 (날짜순 정렬, 고정 댓글 제외)
      const pinnedIds = pinnedComments.map(c => c._id);
      const regularComments = await collection
        .find({ 
          gameId: id,
          _id: { $nin: pinnedIds } // 고정 댓글 제외
        })
        .sort({ createdAt: -1 }) // 최신순
        .skip(skip)
        .limit(limitNum)
        .toArray();

      // 첫 페이지에만 고정 댓글 포함
      const comments = pageNum === 1 
        ? [...pinnedComments, ...regularComments]
        : regularComments;

      return res.status(200).json({ comments, pinnedCount: pinnedComments.length });
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
