import {
    writeFileSync
} from 'fs';

const BASE_URL = 'https://your-domain.com';
const today = new Date().toISOString().split('T')[0];

const projectSlugs = [
    'social-media-app',
    'fintech-dashboard',
    'digital-marketing-agency-site',
];

const staticPages = [{
    loc: BASE_URL,
    lastmod: today,
    priority: '1.00'
}, {
    loc: `${BASE_URL}/contact`,
    lastmod: today,
    priority: '0.80'
}, ];

const projectPages = projectSlugs.map(slug => ({
    loc: `${BASE_URL}/project/${slug}`,
    lastmod: today,
    priority: '0.90',
}));

const allPages = [...staticPages, ...projectPages];

const sitemap = `
  <?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${allPages
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