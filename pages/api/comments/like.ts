// pages/api/comments/like.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '許可されていないメソッドです。' });
  }

  try {
    const { commentId, action, userId, sessionId } = req.body;

    if (!commentId || !action || (!userId && !sessionId)) {
      return res.status(400).json({ message: 'コメントID、アクション、認証情報が必要です。' });
    }

    if (!['like', 'dislike', 'unlike', 'undislike'].includes(action)) {
      return res.status(400).json({ message: '無効なアクションです。' });
    }

    const client = await clientPromise;
    const db = client.db('sukito');
    const collection = db.collection('comments');

    // コメント探す
    const comment = await collection.findOne({ _id: new ObjectId(commentId) });
    if (!comment) {
      return res.status(404).json({ message: 'コメントが見つかりません。' });
    }

    const userIdentifier = userId || sessionId;
    const likeUsers = comment.likeUsers || [];
    const dislikeUsers = comment.dislikeUsers || [];

    let updateData: any = {};

    if (action === 'like') {
      // いいね追加
      if (!likeUsers.includes(userIdentifier)) {
        updateData = {
          likes: (comment.likes || 0) + 1,
          likeUsers: [...likeUsers, userIdentifier]
        };
        // 既によくないねを押していたら削除
        if (dislikeUsers.includes(userIdentifier)) {
          updateData.dislikes = (comment.dislikes || 0) - 1;
          updateData.dislikeUsers = dislikeUsers.filter((id: string) => id !== userIdentifier);
        }
      }
    } else if (action === 'dislike') {
      // よくないね追加
      if (!dislikeUsers.includes(userIdentifier)) {
        updateData = {
          dislikes: (comment.dislikes || 0) + 1,
          dislikeUsers: [...dislikeUsers, userIdentifier]
        };
        // 既にいいねを押していたら削除
        if (likeUsers.includes(userIdentifier)) {
          updateData.likes = (comment.likes || 0) - 1;
          updateData.likeUsers = likeUsers.filter((id: string) => id !== userIdentifier);
        }
      }
    } else if (action === 'unlike') {
      // いいね削除
      if (likeUsers.includes(userIdentifier)) {
        updateData = {
          likes: (comment.likes || 0) - 1,
          likeUsers: likeUsers.filter((id: string) => id !== userIdentifier)
        };
      }
    } else if (action === 'undislike') {
      // よくないね削除
      if (dislikeUsers.includes(userIdentifier)) {
        updateData = {
          dislikes: (comment.dislikes || 0) - 1,
          dislikeUsers: dislikeUsers.filter((id: string) => id !== userIdentifier)
        };
      }
    }

    if (Object.keys(updateData).length > 0) {
      const result = await collection.updateOne(
        { _id: new ObjectId(commentId) },
        { $set: updateData }
      );

      if (result.matchedCount === 1) {
        return res.status(200).json({ message: 'アクション完了' });
      }
    }

    return res.status(200).json({ message: 'アクション完了' });
  } catch (err) {
    console.error('いいねエラー:', err);
    return res.status(500).json({ message: 'エラー' });
  }
} 