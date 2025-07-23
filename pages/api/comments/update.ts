// pages/api/comments/update.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '許可されていないメソッドです。' });
  }

  try {
    const { commentId, content, userId, sessionId } = req.body;

    if (!commentId || !content || (!userId && !sessionId)) {
      return res.status(400).json({ message: 'コメントID、内容、認証情報が必要です。' });
    }

    if (content.trim().length === 0) {
      return res.status(400).json({ message: 'コメント内容を入力してください。' });
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
      return res.status(403).json({ message: '自分のコメントのみ編集できます。' });
    }

    // コメント編集
    const result = await collection.updateOne(
      { _id: new ObjectId(commentId) },
      { $set: { content: content.trim(), updatedAt: new Date().toISOString() } }
    );

    if (result.matchedCount === 1) {
      return res.status(200).json({ message: 'コメント編集完了' });
    } else {
      return res.status(404).json({ message: 'コメントが見つかりません。' });
    }
  } catch (err) {
    console.error('コメント編集エラー:', err);
    return res.status(500).json({ message: 'エラー' });
  }
} 