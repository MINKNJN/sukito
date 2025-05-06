// pages/api/resume.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const client = await clientPromise;
  const db = client.db('sukito');
  const collection = db.collection('resume_games');

  const { action } = req.query; // ?action=list, save, delete
  const userId = req.body.userId || req.query.userId;

  if (!userId) return res.status(400).json({ message: 'userIDが必要です。' });

  try {
    if (req.method === 'GET' && action === 'list') {
      const rawGames = await collection.find({ userId }).sort({ lastSavedAt: -1 }).toArray();
      
      const games = rawGames.map((g) => ({
        _id: g._id.toString(),
        userId: g.userId,
        gameId: g.gameId,
        gameTitle: g.gameTitle || '',
        gameDesc: g.gameDesc || '',
        updatedAt: g.lastSavedAt || g.updatedAt || new Date().toISOString(),
        resumeData: {
          gameId: g.gameId,
          round: g.currentRound || g.selectedRound || 4,
          items: g.remainingItems || [],
          advancing: g.winnerHistory || [],
          matchIndex: 0,
        }
      }));
    
      return res.status(200).json({ games });
    }
    

    if (req.method === 'POST' && action === 'save') {
      const { gameId, selectedRound, currentRound, remainingItems, winnerHistory } = req.body;
      if (!gameId) return res.status(400).json({ message: 'gameIDが必要です。' });

      await collection.updateOne(
        { userId, gameId },
        {
          $set: {
            selectedRound,
            currentRound,
            remainingItems,
            winnerHistory,
            lastSavedAt: new Date().toISOString(),
          },
        },
        { upsert: true }
      );
      return res.status(200).json({ message: '保存完了' });
    }

    if (req.method === 'DELETE' && action === 'delete') {
      const { gameId } = req.query;
      if (!gameId) return res.status(400).json({ message: 'gameIDが必要です。' });

      await collection.deleteOne({ userId, gameId });
      return res.status(200).json({ message: '削除済み' });
    }

    return res.status(405).json({ message: '許可されていないリクエストです。' });
  } catch (err) {
    console.error('resume API エラー:', err);
    return res.status(500).json({ message: 'エラー' });
  }
}