// pages/admin/api/users.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: '허용되지 않은 메서드입니다.' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('sukito');
    const users = db.collection('users');

    const result = await users.find({}, { projection: { password: 0 } }).sort({ createdAt: -1 }).toArray();

    const usersList = result.map(user => ({
      userId: user._id.toString(),
      email: user.email,
      nickname: user.nickname,
      role: user.role,
      createdAt: user.createdAt,
    }));

    return res.status(200).json({ users: usersList });
  } catch (err) {
    console.error('회원 목록 조회 오류:', err);
    return res.status(500).json({ message: '서버 오류' });
  }
}