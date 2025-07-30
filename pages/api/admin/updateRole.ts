// pages/admin/api/updateRole.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { requireAdmin } from '@/utils/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (requireAdmin(req, res)) return;
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '허용되지 않은 메서드입니다.' });
  }

  try {
    const { userId, newRole } = req.body;

    if (!userId || !newRole) {
      return res.status(400).json({ message: '사용자 ID와 새로운 역할이 필요합니다.' });
    }

    if (newRole !== 'user' && newRole !== 'admin') {
      return res.status(400).json({ message: '새로운 역할은 user 또는 admin이어야 합니다.' });
    }

    const client = await clientPromise;
    const db = client.db('sukito');
    const users = db.collection('users');

    const result = await users.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { role: newRole } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

          return res.status(200).json({ message: '권한이 성공적으로 변경되었습니다.' });
  } catch (err) {
    console.error('회원 권한 변경 API 오류:', err);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}
