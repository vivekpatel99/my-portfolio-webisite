import {
    writeFileSync
} from 'fs';

const BASE_URL = 'https://www.vivekapatel.com';
const LASTMOD = '2026-05-07';

const staticPages = [{
    loc: BASE_URL,
    lastmod: LASTMOD,
    priority: '1.00'
}, {
    loc: `${BASE_URL}/contact`,
    lastmod: LASTMOD,
    priority: '0.95'
}, {
    loc: `${BASE_URL}/legal`,
    lastmod: LASTMOD,
    priority: '0.50'
}, {
    loc: `${BASE_URL}/data-policy`,
    lastmod: LASTMOD,
    priority: '0.50'
}];

const sitemap = `
  <?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${staticPages
      .map(
        (page) => `
      <url>
        <loc>${page.loc}</loc>
        <lastmod>${page.lastmod}</lastmod>
        <priority>${page.priority}</priority>
      </url>
    `
      )
      .join('')}
  </urlset>
`;

try {
    writeFileSync('public/sitemap.xml', sitemap.trim());
    console.log('✅ sitemap.xml generated successfully!');
} catch (error) {
    console.error('❌ Error generating sitemap.xml:', error);
}
