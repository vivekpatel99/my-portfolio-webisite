import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

const PREVIEW = 'http://127.0.0.1:4173';
const PROD = 'https://www.vivekapatel.com';

const findings = [];

function fetchHead(url) {
  try {
    const html = execSync(`curl -sL "${url}"`, { encoding: 'utf8', timeout: 15000 });
    return html.match(/<head[^>]*>([\s\S]*?)<\/head>/i)?.[1] || '';
  } catch (e) {
    return '';
  }
}

function getMeta(head, name) {
  const patterns = [
    new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)`, 'i'),
    new RegExp(`<meta[^>]+property=["']${name}["'][^>]+content=["']([^"']+)`, 'i'),
    new RegExp(`<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)`, 'i'),
  ];
  for (const p of patterns) {
    const m = head.match(p);
    if (m) return m[1];
  }
  return null;
}

for (const [env, base] of [
  ['preview', PREVIEW],
  ['prod', PROD],
]) {
  for (const [route, pathSuffix] of [
    ['home', '/'],
    ['contact', '/contact'],
    ['legal', '/legal'],
  ]) {
    const url = `${base}${pathSuffix}`;
    const head = fetchHead(url);
    if (!head) {
      findings.push({ env, route, issue: 'Failed to fetch page', severity: 'P0' });
      continue;
    }
    const canonical = getMeta(head, 'canonical') || head.match(/rel=["']canonical["'][^>]+href=["']([^"']+)/i)?.[1];
    const ogTitle = getMeta(head, 'og:title');
    const ogImage = getMeta(head, 'og:image');
    const description = getMeta(head, 'description');

    if (route === 'home' && !ogTitle) {
      findings.push({ env, route, issue: 'Home page missing og:title', severity: 'P2', ref: 'Home.jsx' });
    }
    if (route === 'contact' && !ogImage?.includes('og-image')) {
      findings.push({ env, route, issue: `Contact OG image unexpected: ${ogImage}`, severity: 'P2' });
    }
    if (canonical && env === 'prod' && !canonical.includes('vivekapatel.com')) {
      findings.push({ env, route, issue: `Bad canonical: ${canonical}`, severity: 'P1' });
    }
    if (!description) {
      findings.push({ env, route, issue: 'Missing meta description', severity: 'P1' });
    }
  }
}

const sitemapPath = path.join(process.cwd(), 'public/sitemap.xml');
if (existsSync(sitemapPath)) {
  const sitemap = readFileSync(sitemapPath, 'utf8');
  if (!sitemap.includes('/project/')) {
    findings.push({ issue: 'Sitemap missing /project/* URLs', severity: 'P3', ref: 'tools/generate-sitemap.js' });
  }
}

const indexHtml = readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
const ogInIndex = indexHtml.match(/og:image[^>]+content=["']([^"']+)/i)?.[1];
if (ogInIndex?.includes('github')) {
  findings.push({
    issue: `index.html OG image uses GitHub URL: ${ogInIndex}`,
    severity: 'P2',
    ref: 'index.html',
  });
}
if (indexHtml.includes('application/ld+json')) {
  findings.push({ issue: 'JSON-LD present in index.html', severity: 'OK', type: 'pass' });
}

console.log(JSON.stringify(findings, null, 2));
