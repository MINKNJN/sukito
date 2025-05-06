// pages/admin/api/delete.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '허용되지 않은 메서드입니다.' });
  }

  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'userId가 필요합니다.' });
    }

    const client = await clientPromise;
    const db = client.db('sukito');
    const users = db.collection('users');

    const result = await users.deleteOne({ _id: new ObjectId(userId) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    return res.status(200).json({ message: '회원 삭제 완료' });
  } catch (err) {
    console.error('회원 삭제 API 오류:', err);
    return res.status(500).json({ message: '서버 오류' });
  }
}
