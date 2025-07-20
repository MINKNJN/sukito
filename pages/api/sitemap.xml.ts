import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';

const BASE_URL = 'https://sukito.net';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Content-Type', 'application/xml');

  const staticUrls = [
    '',
    'about',
    'terms',
    'privacy',
  ];

  let dynamicUrls: string[] = [];
  try {
    const client = await clientPromise;
    const db = client.db('sukito');
    const games = await db.collection('games').find({}, { projection: { _id: 1 } }).toArray();
    dynamicUrls = games.map((game: any) => `result/${game._id.toString()}`);
  } catch (e) {
    // DB 오류 시 동적 URL은 생략
    dynamicUrls = [];
  }

  const urls = [
    ...staticUrls.map((path) => `<url><loc>${BASE_URL}/${path}</loc></url>`),
    ...dynamicUrls.map((path) => `<url><loc>${BASE_URL}/${path}</loc></url>`),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  res.status(200).send(xml);
} 