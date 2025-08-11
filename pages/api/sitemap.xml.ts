import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';

const BASE_URL = 'https://sukito.net';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Content-Type', 'application/xml');

  const staticUrls = [
    { path: '', priority: '1.0', changefreq: 'daily' },
    { path: 'about', priority: '0.8', changefreq: 'monthly' },
    { path: 'guide', priority: '0.8', changefreq: 'monthly' },
    { path: 'terms', priority: '0.5', changefreq: 'yearly' },
    { path: 'privacy', priority: '0.5', changefreq: 'yearly' },
    { path: 'make', priority: '0.9', changefreq: 'weekly' },
    { path: 'mygames', priority: '0.8', changefreq: 'weekly' },
    { path: 'ranking', priority: '0.9', changefreq: 'daily' },
  ];

  let dynamicUrls: string[] = [];
  try {
    const client = await clientPromise;
    const db = client.db('sukito');
    const games = await db.collection('games').find({}, { projection: { _id: 1, createdAt: 1 } }).toArray();
    
    // 게임 플레이 페이지와 결과 페이지 모두 포함
    dynamicUrls = games.flatMap((game: any) => [
      `play/${game._id.toString()}`,
      `result/${game._id.toString()}`
    ]);
  } catch (e) {
    console.error('사이트맵 생성 오류:', e);
    dynamicUrls = [];
  }

  const urls = [
    ...staticUrls.map(({ path, priority, changefreq }) => 
      `<url>
        <loc>${BASE_URL}/${path}</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>${changefreq}</changefreq>
        <priority>${priority}</priority>
      </url>`
    ),
    ...dynamicUrls.map((path) => 
      `<url>
        <loc>${BASE_URL}/${path}</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.7</priority>
      </url>`
    ),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  res.status(200).send(xml);
} 