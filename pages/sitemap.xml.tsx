// pages/sitemap.xml.tsx
import { GetServerSideProps } from 'next';
import clientPromise from '@/lib/mongodb';

function Sitemap() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  try {
    const client = await clientPromise;
    const db = client.db('sukito');

    const games = await db.collection('games').find(
      {},
      { projection: { _id: 1, createdAt: 1, updatedAt: 1 } }
    ).toArray();

    const today = new Date().toISOString().split('T')[0];

    const staticPages = [
      { url: 'https://sukito.net/', lastmod: today, changefreq: 'daily', priority: '1.0' },
{ url: 'https://sukito.net/make', lastmod: today, changefreq: 'weekly', priority: '0.9' },
      { url: 'https://sukito.net/about', lastmod: today, changefreq: 'monthly', priority: '0.8' },
      { url: 'https://sukito.net/guide', lastmod: today, changefreq: 'monthly', priority: '0.8' },
      { url: 'https://sukito.net/mygames', lastmod: today, changefreq: 'weekly', priority: '0.7' },
      { url: 'https://sukito.net/terms', lastmod: today, changefreq: 'yearly', priority: '0.5' },
      { url: 'https://sukito.net/privacy', lastmod: today, changefreq: 'yearly', priority: '0.5' },
    ];

    const gamePages = games.map((game) => {
      const lastmod = game.updatedAt
        ? new Date(game.updatedAt).toISOString().split('T')[0]
        : game.createdAt
        ? new Date(game.createdAt).toISOString().split('T')[0]
        : today;
      return {
        url: `https://sukito.net/play/${game._id}`,
        lastmod,
        changefreq: 'weekly',
        priority: '0.7',
      };
    });

    const allPages = [...staticPages, ...gamePages];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map(
    (page) => `  <url>
    <loc>${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

    res.setHeader('Content-Type', 'text/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate');
    res.write(sitemap);
    res.end();
  } catch {
    res.statusCode = 500;
    res.end();
  }

  return { props: {} };
};

export default Sitemap;
