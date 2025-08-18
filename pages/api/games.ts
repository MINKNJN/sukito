// pages/api/games.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { deleteFromS3 } from '@/lib/aws-s3';

function mergeItemsHistory(original: any[], updates: any[]) {
  const key = (item: any) => `${item.url}-${item.type}`;
  const map = new Map<string, any>();
  original.forEach(item => map.set(key(item), item));
  updates.forEach(item => map.set(key(item), item));
  return Array.from(map.values());
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const client = await clientPromise;
    const db = client.db('sukito');
    const collection = db.collection('games');

    const { id } = req.query;

    if (req.method === 'GET') {
      if (id && typeof id === 'string') {
        try {
          const game = await collection.findOne({ _id: new ObjectId(id) });
          if (!game) {
            return res.status(404).json({ 
              message: 'ゲームが見つかりません。',
              error: 'GAME_NOT_FOUND'
            });
          }
          return res.status(200).json(game);
        } catch (error) {
          // ObjectId 형식이 잘못된 경우
          return res.status(400).json({ 
            message: '無効なゲームIDです。',
            error: 'INVALID_ID_FORMAT'
          });
        }
      }
      
      // 게임 목록 조회 시 더 나은 에러 처리
      const games = await collection.find(
        {},
        {
          projection: {
            title: 1,
            desc: 1,
            thumbnails: 1,
            createdAt: 1,
            createdBy: 1,
          },
        }
      )
      .sort({ createdAt: -1 })
      // .limit(24) ← 제거: 모든 게임을 표시하도록 수정
      .toArray();

      // 각 게임별 playCount(플레이 수) 집계
      try {
        const client2 = await clientPromise;
        const db2 = client2.db('sukito');
        const recordsCollection = db2.collection('records');
        const gamesWithPlayCount = await Promise.all(games.map(async (game) => {
          try {
            const playCount = await recordsCollection.countDocuments({ gameId: game._id.toString() });
            return { ...game, playCount };
          } catch (error) {
            console.warn(`게임 ${game._id} 플레이 수 집계 실패:`, error);
            return { ...game, playCount: 0 };
          }
        }));

        return res.status(200).json(gamesWithPlayCount);
      } catch (error) {
        console.warn('플레이 수 집계 실패, 기본 데이터만 반환:', error);
        return res.status(200).json(games);
      }
    }

    if (req.method === 'POST') {
      const gameData = req.body;

      // items가 비어 있어도 임시 생성 허용 (최종 저장은 PATCH에서 체크)
      if (Array.isArray(gameData.items) && gameData.items.length > 0) {
        const invalidItem = gameData.items.find((item: any) => !item.name || !item.url || !item.type);
        if (invalidItem) {
          return res.status(400).json({ message: '各itemは、name、url、typeをすべて含める必要があります。' });
        }
      }

      if (!gameData.createdAt) {
        gameData.createdAt = new Date().toISOString();
      }

      gameData.itemsHistory = [...gameData.items];

      const result = await collection.insertOne(gameData);
      return res.status(201).json({ message: '保存完了', id: result.insertedId });
    }

    if (req.method === 'PATCH') {
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ message: '修正IDなし' });
      }

      try {
        const updateData = req.body;
        if (!updateData || typeof updateData !== 'object') {
          return res.status(400).json({ message: '修正するデータがありません。' });
        }

        const game = await collection.findOne({ _id: new ObjectId(id) });
        if (!game) {
          return res.status(404).json({ message: 'そのゲームが見つかりません。' });
        }

        const existingHistory = Array.isArray(game.itemsHistory) ? game.itemsHistory : [];
        const newItems = Array.isArray(updateData.items) ? updateData.items : [];

        // S3削除: 既存にあったが、修正後にはないファイル削除
        try {
          const oldUrls = new Set(existingHistory.map((item: any) => item.url));
          const newUrls = new Set(newItems.map((item: any) => item.url));
          const deletedUrls = [...oldUrls].filter(url => !newUrls.has(url));
          await Promise.all(deletedUrls.map(url => deleteFromS3(url)));
        } catch (error) {
          console.warn('S3 파일 삭제 실패:', error);
          // S3 삭제 실패해도 게임 업데이트는 계속 진행
        }

        const updatedHistory = mergeItemsHistory(existingHistory, newItems);
        updateData.itemsHistory = updatedHistory;

        const result = await collection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { ...updateData } }
        );

        if (result.matchedCount === 0) {
          return res.status(404).json({ message: 'そのゲームが見つかりません。' });
        }

        return res.status(200).json({ message: '修正完了' });
      } catch (error) {
        if (error instanceof Error && error.message.includes('ObjectId')) {
          return res.status(400).json({ message: '無効なゲームIDです。' });
        }
        throw error;
      }
    }

    if (req.method === 'DELETE') {
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ message: '削除するIDが必要です。' });
      }

      try {
        const game = await collection.findOne({ _id: new ObjectId(id) });
        if (!game) {
          return res.status(404).json({ message: 'そのゲームが見つかりません。' });
        }

        const history = Array.isArray(game.itemsHistory) ? game.itemsHistory : game.items || [];
        
        // S3 파일 삭제 시 에러 처리
        try {
          await Promise.all(history.map((item: any) => item.url && deleteFromS3(item.url)));
        } catch (error) {
          console.warn('S3 파일 삭제 실패:', error);
          // S3 삭제 실패해도 게임 삭제는 계속 진행
        }

        const result = await collection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
          return res.status(404).json({ message: 'そのゲームが見つかりません。' });
        }

        // 댓글도 함께 삭제
        try {
          const commentsCollection = db.collection('comments');
          await commentsCollection.deleteMany({ gameId: id });
        } catch (error) {
          console.warn('댓글 삭제 실패:', error);
        }

        return res.status(200).json({ message: '削除完了' });
      } catch (error) {
        if (error instanceof Error && error.message.includes('ObjectId')) {
          return res.status(400).json({ message: '無効なゲームIDです。' });
        }
        throw error;
      }
    }

    return res.status(405).json({ message: '許可されていないメソッドです。' });
  } catch (err) {
    console.error('API エラー:', err);
    return res.status(500).json({ 
      message: 'サーバーエラーが発生しました。',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
}

