// pages/admin/api/users.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { requireAdmin } from '@/utils/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (requireAdmin(req, res)) return;
  if (req.method !== 'GET') {
    return res.status(405).json({ message: '허용되지 않은 메서드입니다.' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('sukito');
    const users = db.collection('users');

    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '20', 10);
    const search = (req.query.search as string) || '';
    const role = (req.query.role as string) || '';

    const filter: any = {};
    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: 'i' } },
        { nickname: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) {
      filter.role = role;
    }

    const total = await users.countDocuments(filter);
    const result = await users
      .find(filter, { projection: { password: 0 } })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    const usersList = result.map(user => ({
      userId: user._id.toString(),
      email: user.email,
      nickname: user.nickname,
      role: user.role,
      createdAt: user.createdAt,
    }));

    return res.status(200).json({ users: usersList, total });
  } catch (err) {
          console.error('会員リスト照会エラー:', err);
    return res.status(500).json({ message: '서버 오류' });
  }
}