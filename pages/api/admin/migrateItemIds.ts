// /pages/api/admin/migrateItemIds.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { requireAdmin } from '@/utils/adminAuth';
import crypto from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (requireAdmin(req, res)) return;
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { step, dryRun } = req.body as { step: 1 | 2; dryRun: boolean };

  try {
    const client = await clientPromise;
    const db = client.db('sukito');

    if (step === 1) {
      // Step 1: games.items に itemId がない項目に UUID を付与
      const games = await db.collection('games').find({}).toArray();
      let targetGames = 0;
      let targetItems = 0;

      for (const game of games) {
        const items: any[] = Array.isArray(game.items) ? game.items : [];
        const itemsHistory: any[] = Array.isArray(game.itemsHistory) ? game.itemsHistory : [];
        const needsUpdate = items.some((i: any) => !i.itemId) || itemsHistory.some((i: any) => !i.itemId);
        if (!needsUpdate) continue;

        targetGames++;
        const newItems = items.map((item: any) => {
          if (!item.itemId) {
            targetItems++;
            return { ...item, itemId: crypto.randomUUID() };
          }
          return item;
        });

        // itemsHistory でも同 url の item に同じ itemId を引き継ぐ
        const urlToItemId = new Map<string, string>();
        newItems.forEach((item: any) => {
          if (item.itemId && item.url) urlToItemId.set(item.url, item.itemId);
        });

        const newHistory = itemsHistory.map((item: any) => {
          if (item.itemId) return item;
          const existingId = urlToItemId.get(item.url);
          return { ...item, itemId: existingId || crypto.randomUUID() };
        });

        if (!dryRun) {
          await db.collection('games').updateOne(
            { _id: game._id },
            { $set: { items: newItems, itemsHistory: newHistory } }
          );
        }
      }

      return res.status(200).json({
        dryRun,
        step: 1,
        targetGames,
        targetItems,
        message: dryRun
          ? `[DryRun] ${targetGames}ゲーム・${targetItems}項目にitemIdが付与されます`
          : `${targetGames}ゲーム・${targetItems}項目にitemIdを付与しました`,
      });
    }

    if (step === 2) {
      // Step 2: battles/records に itemId がない記録へ、games から name+url→itemId を照合して付与
      const games = await db.collection('games').find({}).toArray();

      // gameId → (url → itemId) マップ
      const gameItemMap = new Map<string, Map<string, string>>();
      for (const game of games) {
        const urlMap = new Map<string, string>();
        const allItems = [
          ...(Array.isArray(game.items) ? game.items : []),
          ...(Array.isArray(game.itemsHistory) ? game.itemsHistory : []),
        ];
        for (const item of allItems) {
          if (item.itemId && item.url && !urlMap.has(item.url)) {
            urlMap.set(item.url, item.itemId);
          }
        }
        gameItemMap.set(game._id.toString(), urlMap);
      }

      // battles — bulkWrite で一括処理
      const battles = await db.collection('battles').find({ winnerItemId: { $exists: false } }).toArray();
      let battleUpdated = 0;
      const battleOps: any[] = [];
      for (const battle of battles) {
        const urlMap = gameItemMap.get(battle.gameId);
        if (!urlMap) continue;
        const winnerItemId = urlMap.get(battle.winnerUrl);
        const loserItemId = urlMap.get(battle.loserUrl);
        if (!winnerItemId && !loserItemId) continue;
        battleUpdated++;
        const setFields: any = {};
        if (winnerItemId) setFields.winnerItemId = winnerItemId;
        if (loserItemId) setFields.loserItemId = loserItemId;
        battleOps.push({ updateOne: { filter: { _id: battle._id }, update: { $set: setFields } } });
      }
      if (!dryRun && battleOps.length > 0) {
        await db.collection('battles').bulkWrite(battleOps, { ordered: false });
      }

      // records — bulkWrite で一括処理
      const records = await db.collection('records').find({ winnerItemId: { $exists: false } }).toArray();
      let recordUpdated = 0;
      const recordOps: any[] = [];
      for (const record of records) {
        const urlMap = gameItemMap.get(record.gameId);
        if (!urlMap) continue;
        const winnerItemId = urlMap.get(record.winnerUrl);
        if (!winnerItemId) continue;
        recordUpdated++;
        recordOps.push({ updateOne: { filter: { _id: record._id }, update: { $set: { winnerItemId } } } });
      }
      if (!dryRun && recordOps.length > 0) {
        await db.collection('records').bulkWrite(recordOps, { ordered: false });
      }

      return res.status(200).json({
        dryRun,
        step: 2,
        battleUpdated,
        recordUpdated,
        message: dryRun
          ? `[DryRun] battles ${battleUpdated}件・records ${recordUpdated}件にitemIdが付与されます`
          : `battles ${battleUpdated}件・records ${recordUpdated}件にitemIdを付与しました`,
      });
    }

    return res.status(400).json({ message: 'step は 1 または 2 を指定してください' });
  } catch (error) {
    console.error('migrateItemIds 失敗:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
