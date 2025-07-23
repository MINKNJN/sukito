// /api/admin/updateComment.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { requireAdmin } from '@/utils/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (requireAdmin(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ message: '허용되지 않는 메서드' });

  const { commentId, newContent, newReportCount, newCreatedAt } = req.body; 

  if (!commentId || (!newContent && newReportCount === undefined && newCreatedAt === undefined)) {
    return res.status(400).json({ message: 'commentIdと修正するデータが必要です。' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('sukito');

    const updateData: any = {};
    if (newContent !== undefined) updateData.content = newContent;
    if (newReportCount !== undefined) updateData.reportCount = newReportCount; 
    if (newCreatedAt !== undefined) updateData.createdAt = newCreatedAt; 

    const result = await db.collection('comments').updateOne(
      { _id: new ObjectId(commentId) },
      { $set: updateData }
    );

    if (result.matchedCount === 1) {
      return res.status(200).json({ message: 'コメント修正成功' });
    } else {
      return res.status(404).json({ message: 'コメントが見つかりません。' });
    }
  } catch (err) {
    console.error('コメント修正エラー:', err);
    return res.status(500).json({ message: '서버 오류' });
  }
}
