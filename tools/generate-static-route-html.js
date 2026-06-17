import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { absoluteUrl, routeSeo, SITE_NAME } from '../src/lib/seoConfig.js';

const distDir = path.join(process.cwd(), 'dist');
const indexPath = path.join(distDir, 'index.html');
const indexHtml = readFileSync(indexPath, 'utf8');
const staticRoutes = Object.keys(routeSeo).filter((route) => route !== '/');
const notFoundSeo = {
  title: 'Page Not Found | Vivek Patel',
  description: 'The requested page could not be found.',
  path: '/404',
  type: 'website',
  image: '/og-image.png',
};

const escapeAttr = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const escapeText = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

function replaceOrInsert(html, pattern, tag) {
  if (pattern.test(html)) {
    return html.replace(pattern, tag);
  }
  return html.replace('</head>', `  ${tag}\n</head>`);
}

function applySeo(html, seo) {
  const url = absoluteUrl(seo.path);
  const imageUrl = absoluteUrl(seo.image);
  const replacements = [
    [/<title>[\s\S]*?<\/title>/i, `<title>${escapeText(seo.title)}</title>`],
    [
      /<meta[^>]+name=["']description["'][^>]*>/i,
      `<meta data-react-helmet="true" name="description" content="${escapeAttr(seo.description)}" />`,
    ],
    [
      /<link[^>]+rel=["']canonical["'][^>]*>/i,
      `<link data-react-helmet="true" rel="canonical" href="${escapeAttr(url)}" />`,
    ],
    [
      /<meta[^>]+property=["']og:site_name["'][^>]*>/i,
      `<meta data-react-helmet="true" property="og:site_name" content="${escapeAttr(SITE_NAME)}" />`,
    ],
    [
      /<meta[^>]+property=["']og:type["'][^>]*>/i,
      `<meta data-react-helmet="true" property="og:type" content="${escapeAttr(seo.type)}" />`,
    ],
    [
      /<meta[^>]+property=["']og:url["'][^>]*>/i,
      `<meta data-react-helmet="true" property="og:url" content="${escapeAttr(url)}" />`,
    ],
    [
      /<meta[^>]+property=["']og:title["'][^>]*>/i,
      `<meta data-react-helmet="true" property="og:title" content="${escapeAttr(seo.title)}" />`,
    ],
    [
      /<meta[^>]+property=["']og:description["'][^>]*>/i,
      `<meta data-react-helmet="true" property="og:description" content="${escapeAttr(seo.description)}" />`,
    ],
    [
      /<meta[^>]+property=["']og:image["'][^>]*>/i,
      `<meta data-react-helmet="true" property="og:image" content="${escapeAttr(imageUrl)}" />`,
    ],
    [
      /<link[^>]+rel=["']image_src["'][^>]*>/i,
      `<link data-react-helmet="true" rel="image_src" href="${escapeAttr(imageUrl)}" />`,
    ],
    [
      /<meta[^>]+name=["']twitter:url["'][^>]*>/i,
      `<meta data-react-helmet="true" name="twitter:url" content="${escapeAttr(url)}" />`,
    ],
    [
      /<meta[^>]+name=["']twitter:title["'][^>]*>/i,
      `<meta data-react-helmet="true" name="twitter:title" content="${escapeAttr(seo.title)}" />`,
    ],
    [
      /<meta[^>]+name=["']twitter:description["'][^>]*>/i,
      `<meta data-react-helmet="true" name="twitter:description" content="${escapeAttr(seo.description)}" />`,
    ],
    [
      /<meta[^>]+name=["']twitter:image["'][^>]*>/i,
      `<meta data-react-helmet="true" name="twitter:image" content="${escapeAttr(imageUrl)}" />`,
    ],
  ];

  let nextHtml = html;
  for (const [pattern, tag] of replacements) {
    nextHtml = replaceOrInsert(nextHtml, pattern, tag);
  }

  if (seo.keywords) {
    nextHtml = replaceOrInsert(
      nextHtml,
      /<meta[^>]+name=["']keywords["'][^>]*>/i,
      `<meta data-react-helmet="true" name="keywords" content="${escapeAttr(seo.keywords)}" />`,
    );
  }

  nextHtml = nextHtml.replace(/<link\b(?=[^>]*\brel=["']alternate["'])[^>]*>/gi, (tag) => {
    const hreflang = tag.match(/\bhreflang=["']([^"']+)["']/i)?.[1];
    if (!hreflang) {
      return tag;
    }

    return `<link data-react-helmet="true" rel="alternate" hreflang="${escapeAttr(hreflang)}" href="${escapeAttr(url)}" />`;
  });

  return nextHtml;
}

function applyNoIndex(html) {
  return replaceOrInsert(
    html,
    /<meta[^>]+name=["']robots["'][^>]*>/i,
    '<meta data-react-helmet="true" name="robots" content="noindex, nofollow" />',
  );
}

const rootHtml = applySeo(indexHtml, routeSeo['/']);
writeFileSync(indexPath, rootHtml);

for (const route of staticRoutes) {
  const routeDir = path.join(distDir, route);
  mkdirSync(routeDir, { recursive: true });
  writeFileSync(path.join(routeDir, 'index.html'), applySeo(rootHtml, routeSeo[route]));
}

writeFileSync(path.join(distDir, '404.html'), applyNoIndex(applySeo(rootHtml, notFoundSeo)));

console.log(`Generated static HTML for ${staticRoutes.length + 2} routes, including 404.html.`);
