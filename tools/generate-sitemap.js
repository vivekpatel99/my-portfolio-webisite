import { execFileSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { absoluteUrl, routeSeo } from '../src/lib/seoConfig.js';

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const isoDateFromSourceDateEpoch = () => {
    const rawEpoch = process.env.SOURCE_DATE_EPOCH;
    if (!rawEpoch) return null;

    const epochSeconds = Number(rawEpoch);
    if (!Number.isFinite(epochSeconds)) return null;

    return new Date(epochSeconds * 1000).toISOString().split('T')[0];
};

const explicitLastmod = () => {
    const rawLastmod = process.env.SITEMAP_LASTMOD;
    return rawLastmod && datePattern.test(rawLastmod) ? rawLastmod : null;
};

const gitLastmod = () => {
    try {
        const output = execFileSync(
            'git',
            ['log', '-1', '--format=%cs', '--', 'src/lib/seoConfig.js', 'src/lib/seo.js', 'src/pages', 'src/components'],
            { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
        ).trim();

        return datePattern.test(output) ? output : null;
    } catch {
        return null;
    }
};

const existingSitemapLastmod = () => {
    if (!existsSync('public/sitemap.xml')) return null;

    const existingSitemap = readFileSync('public/sitemap.xml', 'utf8');
    const match = existingSitemap.match(/<lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>/);
    return match?.[1] ?? null;
};

const lastmod = explicitLastmod() ?? isoDateFromSourceDateEpoch() ?? gitLastmod() ?? existingSitemapLastmod() ?? new Date().toISOString().split('T')[0];

const priorityForRoute = (route) => {
    if (route === '/') return '1.00';
    if (route === '/contact') return '0.95';
    if (route.startsWith('/project/')) return '0.90';
    return '0.50';
};

const allPages = Object.keys(routeSeo).map((route) => ({
    loc: absoluteUrl(routeSeo[route].path ?? route),
    lastmod,
    priority: priorityForRoute(route),
}));

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
    .map(
        (page) => `  <url>
    <loc>${page.loc}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <priority>${page.priority}</priority>
  </url>`
    )
    .join('\n')}
</urlset>
`;

try {
    writeFileSync('public/sitemap.xml', sitemap);
    console.log('✅ sitemap.xml generated successfully!');
} catch (error) {
    console.error('❌ Error generating sitemap.xml:', error);
    process.exit(1);
}
