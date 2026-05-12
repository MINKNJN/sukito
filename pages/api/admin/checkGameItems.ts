// /api/admin/checkGameItems.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { requireAdmin } from '@/utils/adminAuth';

// 동시 요청 수 제한 (20개)
function makeLimiter(concurrency: number) {
  let active = 0;
  const queue: (() => void)[] = [];
  const next = () => {
    if (queue.length > 0 && active < concurrency) {
      active++;
      queue.shift()!();
    }
  };
  return function limit<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const run = () => fn().then(resolve).catch(reject).finally(() => { active--; next(); });
      if (active < concurrency) { active++; run(); }
      else queue.push(run);
    });
  };
}

async function checkItem(item: { url: string; type: string }): Promise<{ ok: boolean; status: number }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    if (item.type === 'youtube') {
      const match = item.url.match(/embed\/([a-zA-Z0-9_-]{11})/);
      const videoId = match?.[1];
      if (!videoId) return { ok: false, status: 0 };
      const res = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`,
        { signal: controller.signal }
      );
      return { ok: res.ok, status: res.status };
    } else {
      // HEAD 대신 Range GET 사용 — CloudFront에서 HEAD가 거부되는 경우 대응
      const res = await fetch(item.url, {
        method: 'GET',
        headers: { Range: 'bytes=0-0' },
        signal: controller.signal,
      });
      // 200 OK 또는 206 Partial Content 모두 정상
      return { ok: res.ok, status: res.status };
    }
  } catch (e: any) {
    console.error('[checkItem] fetch 실패:', item.url, e?.message);
    return { ok: false, status: -1 };
  } finally {
    clearTimeout(timeout);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (requireAdmin(req, res)) return;
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('sukito');

    const games = await db.collection('games')
      .find(
        { $or: [{ status: 'approved' }, { status: 'pending' }, { status: { $exists: false } }] },
        { projection: { title: 1, items: 1, status: 1 } }
      )
      .limit(200)
      .toArray();

    const results: any[] = [];
    const limit = makeLimiter(20);

    // 모든 게임의 항목을 한 번에 모아 동시 20개씩 처리
    const allTasks = games.flatMap((game) => {
      if (!Array.isArray(game.items) || game.items.length === 0) return [];
      return game.items.map((item: any) =>
        limit(() => checkItem(item).then((result) => ({ game, item, result })))
      );
    });

    const allResults = await Promise.all(allTasks);

    // 게임별로 결과 집계
    const gameMap = new Map<string, { game: any; checks: any[] }>();
    for (const { game, item, result } of allResults) {
      const key = game._id.toString();
      if (!gameMap.has(key)) gameMap.set(key, { game, checks: [] });
      gameMap.get(key)!.checks.push({ name: item.name, type: item.type, ...result });
    }

    for (const { game, checks } of gameMap.values()) {
      const broken = checks.filter((c) => !c.ok);
      if (broken.length > 0) {
        results.push({
          _id: game._id.toString(),
          title: game.title || '',
          status: game.status || 'approved',
          brokenCount: broken.length,
          totalCount: checks.length,
          brokenItems: broken.map((c) => ({ name: c.name, type: c.type, status: c.status })),
        });
      }
    }

    return res.status(200).json({
      checkedCount: games.length,
      brokenGamesCount: results.length,
      games: results,
    });
  } catch (error) {
    console.error('checkGameItems 실패:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
