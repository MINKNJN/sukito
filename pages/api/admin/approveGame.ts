// /api/admin/approveGame.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { requireAdmin } from '@/utils/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (requireAdmin(req, res)) return;
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { gameId, action, rejectionReason } = req.body as {
    gameId: string;
    action: 'approve' | 'reject';
    rejectionReason?: 'items' | 'title' | null;
  };

  if (!gameId || !action) {
    return res.status(400).json({ message: 'gameId と action が必要です。' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('sukito');
    const collection = db.collection('games');

    const update =
      action === 'approve'
        ? { status: 'approved', rejectionReason: null }
        : { status: 'rejected', rejectionReason: rejectionReason ?? null };

    const result = await collection.updateOne(
      { _id: new ObjectId(gameId) },
      { $set: update }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'ゲームが見つかりません。' });
    }

    return res.status(200).json({ message: '状態を変更しました。' });
  } catch (error) {
    console.error('approveGame 실패:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
