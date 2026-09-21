import { execFileSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { caseStudies } from '../../publication/public-case-studies.js';
import { defaultSeo, routeSeo } from '../../src/lib/seoConfig.js';
import { resolveLoopbackRedirectUrl, resolveQaTargets } from './qa-local-only.js';

const PREVIEW = process.env.QA_PREVIEW_URL ?? 'http://127.0.0.1:3000';
const PROD = process.env.QA_PROD_URL ?? 'https://www.vivekapatel.com';
const localOnly = process.env.QA_LOCAL_ONLY === '1';

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
  ...caseStudies.map((story) => ({
    route: `project-${story.slug}`,
    path: `/project/${story.slug}`,
    canonical: `https://www.vivekapatel.com/project/${story.slug}/`,
    title: new RegExp(story.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
  })),
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

function fetchLocalHead(url) {
  try {
    let currentURL = url;
    for (let redirectCount = 0; redirectCount < 10; redirectCount += 1) {
      const headers = execFileSync('curl', [
        '--silent', '--show-error', '--dump-header', '-', '--output', '/dev/null', '--max-redirs', '0', currentURL,
      ], { encoding: 'utf8', timeout: 15000 });
      const status = Number(headers.match(/^HTTP\/\S+\s+(\d{3})\b/m)?.[1]);
      const location = headers.match(/^location:\s*(.+)\s*$/im)?.[1];

      if (status >= 300 && status < 400 && location) {
        currentURL = resolveLoopbackRedirectUrl(currentURL, location);
        continue;
      }

      const html = execFileSync('curl', ['--fail', '--silent', '--show-error', currentURL], {
        encoding: 'utf8',
        timeout: 15000,
      });
      return html.match(/<head[^>]*>([\s\S]*?)<\/head>/i)?.[1] || '';
    }
  } catch (e) {
    if (e instanceof Error && e.message.startsWith('QA_LOCAL_ONLY requires')) {
      throw e;
    }
    return '';
  }

  return '';
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

for (const [env, base] of resolveQaTargets({ localOnly, previewURL: PREVIEW, prodURL: PROD })) {
  for (const routeConfig of expectedRoutes) {
    const { route, path: pathSuffix, canonical: expectedCanonical, title: expectedTitle } = routeConfig;
    const url = `${base}${previewPath(pathSuffix)}`;
    const head = localOnly ? fetchLocalHead(url) : fetchHead(url);
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
    } else if (env !== 'prod' && route === 'home') {
      if (!description.includes('Linz') || !description.includes('Austria') || /based\s+in\s+europe/i.test(description)) {
        findings.push({
          env,
          route,
          issue: `Home description missing Linz, Austria: ${description}`,
          severity: 'P1',
        });
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

const draftDescription = getMeta(indexHtml, 'description');
const draftTwitter = getMeta(indexHtml, 'twitter:description');
if (!draftDescription?.includes('€45/hour')) {
  findings.push({
    issue: `index.html meta description missing €45/hour: ${draftDescription}`,
    severity: 'P1',
    ref: 'index.html',
  });
}
if (!draftTwitter?.includes('€45/hour')) {
  findings.push({
    issue: `index.html twitter:description missing €45/hour: ${draftTwitter}`,
    severity: 'P1',
    ref: 'index.html',
  });
}
const priceRange = indexHtml.match(/"priceRange":\s*"([^"]+)"/)?.[1] ?? '';
if (priceRange !== '€45/hour') {
  findings.push({
    issue: `ProfessionalService priceRange is not €45/hour: ${priceRange}`,
    severity: 'P1',
    ref: 'index.html',
  });
}

const seoConfig = readFileSync(path.join(process.cwd(), 'src/lib/seoConfig.js'), 'utf8');
if (!seoConfig.includes('€45/hour')) {
  findings.push({
    issue: 'seoConfig.js missing €45/hour',
    severity: 'P1',
    ref: 'src/lib/seoConfig.js',
  });
}

const hero = readFileSync(path.join(process.cwd(), 'src/components/Hero.jsx'), 'utf8');
if (!hero.includes('Starting at €45/hour')) {
  findings.push({
    issue: 'Hero.jsx missing Starting at €45/hour',
    severity: 'P1',
    ref: 'src/components/Hero.jsx',
  });
}

const leftoverRate = /€80|\$45\/hour/;
const leftoverBase = /based\s*-?\s*in\s+europe/i;
const inventedCity =
  /Vienna|Wien|Berlin|Munich|München|Zurich|Graz|Salzburg|Innsbruck|Wels|Leonding|Prague|Praha|Budapest|Linz an der Donau|Oberösterreich|Upper Austria/;
const keywordTokens = (keywords) => keywords.split(',').map((token) => token.trim());
const pin = (issue, ref, ok) => {
  if (!ok) findings.push({ issue, severity: 'P1', ref });
};

for (const [ref, source] of [['index.html', indexHtml], ['src/lib/seoConfig.js', seoConfig], ['src/components/Hero.jsx', hero]]) {
  if (leftoverRate.test(source)) {
    findings.push({
      issue: `${ref} still contains retired rate copy`,
      severity: 'P1',
      ref,
    });
  }
  if (!source.includes('Linz') || !source.includes('Austria')) {
    findings.push({
      issue: `${ref} missing Linz, Austria`,
      severity: 'P1',
      ref,
    });
  }
  if (leftoverBase.test(source) || source.includes('Engineer in Europe') || source.includes('Freelance AI Engineer in Europe')) {
    findings.push({
      issue: `${ref} still contains Europe-only base copy`,
      severity: 'P1',
      ref,
    });
  }
}

pin('Hero.jsx missing Based in Linz, Austria', 'src/components/Hero.jsx', hero.includes('Based in Linz, Austria'));
pin(
  'defaultSeo.description is not the locked Linz sentence',
  'src/lib/seoConfig.js',
  defaultSeo.description ===
    'Hire Vivek Patel - Freelance AI & Computer Vision Engineer based in Linz, Austria, serving clients across Europe. Expert in web scraping, n8n automation, YOLO, PyTorch, and LangChain. 94% performance improvements. €45/hour.',
);
pin(
  'contact SEO description is not the locked Linz sentence',
  'src/lib/seoConfig.js',
  routeSeo['/contact'].description ===
    'Hire Vivek Patel for your AI project. Freelance Computer Vision, Web Scraping & n8n Automation expert based in Linz, Austria, serving Europe. Get a quote within 24 hours. €45/hour.',
);

const homeTokens = keywordTokens(defaultSeo.keywords);
const contactTokens = keywordTokens(routeSeo['/contact'].keywords);
pin('home keywords missing AI Engineer Linz Austria', 'src/lib/seoConfig.js', homeTokens.includes('AI Engineer Linz Austria'));
pin('home keywords missing Python Developer Europe', 'src/lib/seoConfig.js', homeTokens.includes('Python Developer Europe'));
pin('home keywords still contain AI Engineer Europe', 'src/lib/seoConfig.js', !homeTokens.includes('AI Engineer Europe'));
pin(
  'contact keywords missing Hire AI Engineer Linz Austria',
  'src/lib/seoConfig.js',
  contactTokens.includes('Hire AI Engineer Linz Austria'),
);
pin(
  'contact keywords still contain Hire AI Engineer Europe',
  'src/lib/seoConfig.js',
  !contactTokens.includes('Hire AI Engineer Europe'),
);

let jsonLd = [];
try {
  jsonLd = [...indexHtml.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map((match) =>
    JSON.parse(match[1]),
  );
} catch (error) {
  findings.push({
    issue: `index.html JSON-LD failed to parse: ${error instanceof Error ? error.message : error}`,
    severity: 'P1',
    ref: 'index.html',
  });
}

const person = jsonLd.find((node) => node['@type'] === 'Person');
const service = jsonLd.find((node) => node['@type'] === 'ProfessionalService');
const workLocation = person?.workLocation;
const areaServed = service?.areaServed;
pin('Person workLocation.name is not Linz, Austria', 'index.html', workLocation?.name === 'Linz, Austria');
pin(
  'ProfessionalService areaServed.name is not Linz, Austria and Europe',
  'index.html',
  areaServed?.name === 'Linz, Austria and Europe',
);
pin('workLocation and areaServed must stay different Place names', 'index.html', workLocation?.name !== areaServed?.name);
pin('areaServed must be a Place object, not an array', 'index.html', Boolean(areaServed) && !Array.isArray(areaServed));
pin('Person name must stay Vivek Patel', 'index.html', person?.name === 'Vivek Patel');
pin('parsed ProfessionalService priceRange is not €45/hour', 'index.html', service?.priceRange === '€45/hour');
pin('JSON-LD Place name must not be Europe-only', 'index.html', workLocation?.name !== 'Europe' && areaServed?.name !== 'Europe');

if (/streetAddress|PostalAddress|postalCode|addressLocality|addressCountry|postOfficeBoxNumber|"geo"|latitude|longitude|"address"\s*:/.test(indexHtml)) {
  findings.push({
    issue: 'index.html JSON-LD must not include streetAddress, PostalAddress, or address',
    severity: 'P1',
    ref: 'index.html',
  });
}

const legal = readFileSync(path.join(process.cwd(), 'src/pages/Legal.jsx'), 'utf8');
const footer = readFileSync(path.join(process.cwd(), 'src/components/Footer.jsx'), 'utf8');
const contact = readFileSync(path.join(process.cwd(), 'src/pages/Contact.jsx'), 'utf8');
const dataPolicy = readFileSync(path.join(process.cwd(), 'src/pages/DataPolicy.jsx'), 'utf8');
pin(
  'Legal.jsx missing EEA GDPR sentences',
  'src/pages/Legal.jsx',
  legal.includes('European Economic Area (EEA)') && legal.includes('General Data Protection Regulation (GDPR)'),
);
pin('Legal.jsx must not name Linz or Austria', 'src/pages/Legal.jsx', !/Linz|Austria|Based in/.test(legal));
pin(
  'Footer.jsx must not invent an office location',
  'src/components/Footer.jsx',
  !/Linz|Austria|Europe|Headquarters|Based in|Hauptplatz|PostalAddress/.test(footer),
);
pin(
  'Contact.jsx body must not name a city',
  'src/pages/Contact.jsx',
  !/Linz|Austria|Europe|Based in/.test(contact) && contact.includes('within 24 hours'),
);
pin('DataPolicy.jsx must stay city-free', 'src/pages/DataPolicy.jsx', !/Linz|Austria|Europe/.test(dataPolicy));

for (const [ref, source] of [
  ['src/components/Hero.jsx', hero],
  ['src/lib/seoConfig.js', seoConfig],
  ['index.html', indexHtml],
  ['src/components/Footer.jsx', footer],
  ['src/pages/Contact.jsx', contact],
]) {
  if (inventedCity.test(source)) {
    findings.push({
      issue: `${ref} invents a second city`,
      severity: 'P1',
      ref,
    });
  }
}

const distHomePath = path.join(process.cwd(), 'dist/index.html');
if (existsSync(distHomePath)) {
  const distHome = readFileSync(distHomePath, 'utf8');
  const distContact = readFileSync(path.join(process.cwd(), 'dist/contact/index.html'), 'utf8');
  const distLegal = readFileSync(path.join(process.cwd(), 'dist/legal/index.html'), 'utf8');
  pin(
    'dist home description missing Linz serving Europe',
    'dist/index.html',
    getMeta(distHome, 'description')?.includes('based in Linz, Austria, serving clients across Europe'),
  );
  pin(
    'dist contact description missing Linz serving Europe',
    'dist/contact/index.html',
    getMeta(distContact, 'description')?.includes('based in Linz, Austria, serving Europe')
      && !leftoverBase.test(getMeta(distContact, 'description') ?? ''),
  );
  pin('dist legal description must stay GDPR-only', 'dist/legal/index.html', !getMeta(distLegal, 'description')?.includes('Linz'));
}

console.log(JSON.stringify(findings, null, 2));

const failures = findings.filter((finding) => finding.severity !== 'OK');
if (failures.length > 0) {
  process.exit(1);
}
