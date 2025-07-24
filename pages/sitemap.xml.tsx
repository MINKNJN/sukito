// pages/sitemap.xml.tsx
import { GetServerSideProps } from 'next';

const SITE_URL = 'https://sukito.net';

function generateSiteMap() {
  return `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <url>
        <loc>${SITE_URL}</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
      </url>
      <url>
        <loc>${SITE_URL}/about</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
      </url>
      <url>
        <loc>${SITE_URL}/guide</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
      </url>
      <url>
        <loc>${SITE_URL}/make</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.9</priority>
      </url>
      <url>
        <loc>${SITE_URL}/login</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.6</priority>
      </url>
      <url>
        <loc>${SITE_URL}/signup</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.6</priority>
      </url>
      <url>
        <loc>${SITE_URL}/terms</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>yearly</changefreq>
        <priority>0.3</priority>
      </url>
      <url>
        <loc>${SITE_URL}/privacy</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>yearly</changefreq>
        <priority>0.3</priority>
      </url>
    </urlset>`;
}

function SiteMap() {
  // getServerSideProps will handle the XML generation
  return null;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const sitemap = generateSiteMap();

  res.setHeader('Content-Type', 'text/xml');
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate');
  res.write(sitemap);
  res.end();

  return {
    props: {},
  };
};

export default SiteMap; 