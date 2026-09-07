import { execFileSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

const PREVIEW = process.env.QA_PREVIEW_URL ?? 'http://127.0.0.1:3000';
const PROD = process.env.QA_PROD_URL ?? 'https://www.vivekapatel.com';

const findings = [];
const expectedRoutes = [
  {
    route: 'home',
    path: '/',
    canonical: 'https://www.vivekapatel.com/',
    title: /Vivek Patel/i,
  },
  {
    route: 'contact',
    path: '/contact',
    canonical: 'https://www.vivekapatel.com/contact/',
    title: /Contact/i,
  },
  {
    route: 'legal',
    path: '/legal',
    canonical: 'https://www.vivekapatel.com/legal/',
    title: /Privacy Policy/i,
  },
  {
    route: 'data-policy',
    path: '/data-policy',
    canonical: 'https://www.vivekapatel.com/data-policy/',
    title: /Cookie Policy/i,
  },
  {
    route: 'project-n8n',
    path: '/project/n8n-openai-data-extraction',
    canonical: 'https://www.vivekapatel.com/project/n8n-openai-data-extraction/',
    title: /n8n \+ OpenAI Data Extraction/i,
  },
  {
    route: 'project-invoice-ocr',
    path: '/project/invoice-ocr-extraction',
    canonical: 'https://www.vivekapatel.com/project/invoice-ocr-extraction/',
    title: /Invoice OCR Client-Field Extraction/i,
  },
  {
    route: 'project-yolo',
    path: '/project/yolo-computer-vision-optimization',
    canonical: 'https://www.vivekapatel.com/project/yolo-computer-vision-optimization/',
    title: /YOLO Pose Estimation on Still Images/i,
  },
];

const previewPath = (pathSuffix) => pathSuffix === '/' ? '/' : `${pathSuffix}/`;

function fetchHead(url) {
  try {
    const html = execFileSync('curl', ['-sL', url], { encoding: 'utf8', timeout: 15000 });
    return html.match(/<head[^>]*>([\s\S]*?)<\/head>/i)?.[1] || '';
  } catch (e) {
    return '';
  }
}

function getMeta(head, name) {
  const patterns = [
    new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)`, 'i'),
    new RegExp(`<meta[^>]+property=["']${name}["'][^>]+content=["']([^"']+)`, 'i'),
  ];
  for (const p of patterns) {
    const m = head.match(p);
    if (m) return m[1];
  }
  return null;
}

function getCanonical(head) {
  return head.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)/i)?.[1] ?? null;
}

function getTitle(head) {
  return head.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? null;
}

function getJsonLd(head) {
  return [...head.matchAll(/<script\s+type=["']application\/ld\+json["'][^>]*>\s*([\s\S]*?)\s*<\/script>/gi)]
    .map(([, payload]) => {
      try {
        return JSON.parse(payload);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function getAlternateLinks(head) {
  const alternates = [];
  for (const match of head.matchAll(/<link\b[^>]*>/gi)) {
    const tag = match[0];
    if (!/\brel=["']alternate["']/i.test(tag)) {
      continue;
    }

    const hreflang = tag.match(/\bhreflang=["']([^"']+)["']/i)?.[1];
    const href = tag.match(/\bhref=["']([^"']+)["']/i)?.[1];
    if (hreflang && href) {
      alternates.push({ hreflang, href });
    }
  }

  return alternates;
}

for (const [env, base] of [
  ['preview', PREVIEW],
  ['prod', PROD],
]) {
  for (const routeConfig of expectedRoutes) {
    const { route, path: pathSuffix, canonical: expectedCanonical, title: expectedTitle } = routeConfig;
    const url = `${base}${previewPath(pathSuffix)}`;
    const head = fetchHead(url);
    if (!head) {
      findings.push({ env, route, issue: 'Failed to fetch page', severity: 'P0' });
      continue;
    }
    const canonical = getCanonical(head);
    const title = getTitle(head);
    const ogTitle = getMeta(head, 'og:title');
    const ogImage = getMeta(head, 'og:image');
    const ogUrl = getMeta(head, 'og:url');
    const description = getMeta(head, 'description');
    const alternates = getAlternateLinks(head);

    if (!title || !expectedTitle.test(title)) {
      findings.push({ env, route, issue: `Unexpected title: ${title}`, severity: 'P1' });
    }

    if (!ogTitle || !expectedTitle.test(ogTitle)) {
      findings.push({ env, route, issue: `Unexpected og:title: ${ogTitle}`, severity: 'P1' });
    }

    if (route === 'contact' && !ogImage?.includes('og-image')) {
      findings.push({ env, route, issue: `Contact OG image unexpected: ${ogImage}`, severity: 'P2' });
    }

    if (canonical !== expectedCanonical) {
      findings.push({ env, route, issue: `Bad canonical: ${canonical}`, severity: 'P1' });
    }

    if (ogUrl !== expectedCanonical) {
      findings.push({ env, route, issue: `Bad og:url: ${ogUrl}`, severity: 'P1' });
    }

    for (const hreflang of ['en', 'x-default']) {
      const alternate = alternates.find((link) => link.hreflang === hreflang);
      if (!alternate || alternate.href !== expectedCanonical) {
        findings.push({
          env,
          route,
          issue: `Bad ${hreflang} alternate href: ${alternate?.href ?? 'missing'}`,
          severity: 'P1',
        });
      }
    }

    if (!description) {
      findings.push({ env, route, issue: 'Missing meta description', severity: 'P1' });
    }

    if (route === 'home') {
      const jsonLd = getJsonLd(head);
      const professionalService = jsonLd.find((item) => item['@type'] === 'ProfessionalService');
      const person = jsonLd.find((item) => item['@type'] === 'Person');
      if (professionalService?.areaServed) {
        findings.push({ env, route, issue: 'ProfessionalService must not claim an unapproved areaServed', severity: 'P1' });
      }
      if (person?.workLocation?.name !== 'Europe') {
        findings.push({ env, route, issue: 'Person workLocation must retain the approved Europe location metadata', severity: 'P1' });
      }
    }
  }
}

const sitemapPath = [
  path.join(process.cwd(), 'dist/sitemap.xml'),
  path.join(process.cwd(), 'public/sitemap.xml'),
].find((candidate) => existsSync(candidate));

if (sitemapPath) {
  const sitemap = readFileSync(sitemapPath, 'utf8');
  for (const { canonical } of expectedRoutes) {
    if (!sitemap.includes(`<loc>${canonical}</loc>`)) {
      findings.push({
        issue: `Sitemap missing ${canonical}`,
        severity: 'P3',
        ref: sitemapPath,
      });
    }
  }
} else {
  findings.push({ issue: 'Missing sitemap.xml in dist/ or public/', severity: 'P3', ref: 'tools/generate-sitemap.js' });
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

for (const assetPath of [
  path.join(process.cwd(), 'public/assets/case-studies/invoice-ocr.webp'),
  path.join(process.cwd(), 'dist/assets/case-studies/invoice-ocr.webp'),
]) {
  if (existsSync(assetPath)) {
    findings.push({ issue: `Removed invoice asset is present: ${assetPath}`, severity: 'P0' });
  }
}

console.log(JSON.stringify(findings, null, 2));

const failures = findings.filter((finding) => finding.severity !== 'OK');
if (failures.length > 0) {
  process.exit(1);
}
