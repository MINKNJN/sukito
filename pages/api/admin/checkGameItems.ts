// /api/admin/checkGameItems.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { requireAdmin } from '@/utils/adminAuth';

async function checkItem(item: { url: string; type: string }): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    if (item.type === 'youtube') {
      const match = item.url.match(/embed\/([a-zA-Z0-9_-]{11})/);
      const videoId = match?.[1];
      if (!videoId) return false;
      const res = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
        { signal: controller.signal }
      );
      return res.ok;
    } else {
      const res = await fetch(item.url, { method: 'HEAD', signal: controller.signal });
      return res.ok;
    }
  } catch {
    return false;
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

    await Promise.all(
      games.map(async (game) => {
        if (!Array.isArray(game.items) || game.items.length === 0) return;
        const checks = await Promise.all(
          game.items.map(async (item: any) => ({
            name: item.name,
            url: item.url,
            type: item.type,
            ok: await checkItem(item),
          }))
        );
        const broken = checks.filter((c) => !c.ok);
        if (broken.length > 0) {
          results.push({
            _id: game._id.toString(),
            title: game.title || '',
            status: game.status || 'approved',
            brokenCount: broken.length,
            totalCount: game.items.length,
            brokenItems: broken.map((c) => ({ name: c.name, type: c.type })),
          });
        }
      })
    );

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
