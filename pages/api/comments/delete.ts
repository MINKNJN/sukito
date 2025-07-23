// pages/api/comments/delete.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '許可されていないメソッドです。' });
  }

  try {
    const { commentId, userId, sessionId } = req.body;

    if (!commentId || (!userId && !sessionId)) {
      return res.status(400).json({ message: 'コメントIDと認証情報が必要です。' });
    }

    const client = await clientPromise;
    const db = client.db('sukito');
    const collection = db.collection('comments');

    // コメントを探して投稿者が正しいか確認
    const comment = await collection.findOne({ _id: new ObjectId(commentId) });
    
    if (!comment) {
      return res.status(404).json({ message: 'コメントが見つかりません。' });
    }

    // 投稿者確認
    let isAuthor = false;
    
    if (userId && comment.authorType === 'user') {
      // ログインユーザー: userIdで確認
      isAuthor = comment.authorId === userId;
    } else if (sessionId && comment.authorType === 'guest') {
      // 非ログインユーザー: sessionIdで確認
      isAuthor = comment.authorId === sessionId;
    }

    if (!isAuthor) {
      return res.status(403).json({ message: '自分のコメントのみ削除できます。' });
    }

    // コメント削除
    const result = await collection.deleteOne({ _id: new ObjectId(commentId) });

    if (result.deletedCount === 1) {
      return res.status(200).json({ message: 'コメント削除完了' });
    } else {
      return res.status(404).json({ message: 'コメントが見つかりません。' });
    }
  } catch (err) {
    console.error('コメント削除エラー:', err);
    return res.status(500).json({ message: 'エラー' });
  }
} 