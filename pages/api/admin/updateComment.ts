// /api/admin/updateComment.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { requireAdmin } from '@/utils/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (requireAdmin(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ message: '허용되지 않는 메서드' });

  const { commentId, newContent, newReportCount } = req.body; // ✅ newReportCount 추가

  if (!commentId || (!newContent && newReportCount === undefined)) {
    return res.status(400).json({ message: 'commentId와 수정할 데이터가 필요합니다.' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('sukito');

    const updateData: any = {};
    if (newContent !== undefined) updateData.content = newContent;
    if (newReportCount !== undefined) updateData.reportCount = newReportCount; // ✅ 추가

    const result = await db.collection('comments').updateOne(
      { _id: new ObjectId(commentId) },
      { $set: updateData }
    );

    if (result.matchedCount === 1) {
      return res.status(200).json({ message: '댓글 수정 성공' });
    } else {
      return res.status(404).json({ message: '댓글을 찾을 수 없습니다.' });
    }
  } catch (err) {
    console.error('댓글 수정 오류:', err);
    return res.status(500).json({ message: '서버 오류' });
  }
}
