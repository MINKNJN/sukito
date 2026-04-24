// /pages/api/admin/migrateStatus.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { requireAdmin } from '@/utils/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (requireAdmin(req, res)) return;
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('sukito');
    const gamesCol = db.collection('games');

    const result = await gamesCol.updateMany(
      { status: { $exists: false } },
      { $set: { status: 'approved' } }
    );

    return res.status(200).json({
      modifiedCount: result.modifiedCount,
      message: `${result.modifiedCount}개 게임에 status: approved 설정 완료`,
    });
  } catch (error) {
    console.error('migrateStatus 실패:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
