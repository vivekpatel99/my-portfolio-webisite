import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { alternatePaths, localeFromPath, translatedRoutePairs } from '../src/lib/localizedRoutes.js';
import { absoluteUrl, routeSeo, SITE_NAME } from '../src/lib/seoConfig.js';
import { getCaseStudyBySlug } from '../src/data/caseStudies.js';
import CaseStudyArticle from '../src/components/CaseStudyArticle.js';
import {
  assertCaseStudyRouteSources,
  assertStaticCaseStudyRoutes,
  assertSafeStaticOutput,
  removeStaleProjectHtml,
} from './case-study-route-integrity.js';
import { assertLocalizedRouteSources, assertPublicLinksRouted, assertServiceRouteSources } from './public-route-integrity.js';
import { renderStaticPages } from './render-static-home.js';

const distDir = path.join(process.cwd(), 'dist');
const deploymentHtaccess = readFileSync(path.join(process.cwd(), 'dist/.htaccess'), 'utf8');
assertCaseStudyRouteSources({ htaccess: deploymentHtaccess });
assertServiceRouteSources({ htaccess: deploymentHtaccess });
assertLocalizedRouteSources();
const staticRoutes = Object.keys(routeSeo).filter((route) => route !== '/');
assertSafeStaticOutput(distDir, staticRoutes);
const removedStaleProjectHtml = removeStaleProjectHtml(distDir);
const indexPath = path.join(distDir, 'index.html');
// On repeat runs, recover the empty shell before generating any other route.
// Only replace markup owned by this generator; unexpected shells still fail.
const indexHtml = readFileSync(indexPath, 'utf8').replace(
  /<div id="root"><!--static-home-->[\s\S]*?<!--\/static-home--><\/div>/,
  '<div id="root"></div>',
);
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
    return html.replace(pattern, () => tag);
  }
  return html.replace('</head>', () => `  ${tag}\n</head>`);
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

  let nextHtml = html.replace(/(<html\b[^>]*\blang=)"[^"]*"/i, `$1"${localeFromPath(seo.path)}"`);
  for (const [pattern, tag] of replacements) {
    nextHtml = replaceOrInsert(nextHtml, pattern, tag);
  }

  const keywordsTag = /<meta[^>]+name=["']keywords["'][^>]*>/i;
  if (seo.keywords) {
    nextHtml = replaceOrInsert(
      nextHtml,
      keywordsTag,
      `<meta data-react-helmet="true" name="keywords" content="${escapeAttr(seo.keywords)}" />`,
    );
  } else {
    nextHtml = nextHtml.replace(/^[ \t]*<meta[^>]+name=["']keywords["'][^>]*>[ \t]*\r?\n/gmi, '');
  }

  const alternates = Object.entries(alternatePaths(seo.path)).map(([lang, route]) =>
    `  <link data-react-helmet="true" rel="alternate" hreflang="${lang}" href="${escapeAttr(absoluteUrl(route))}" />\n`,
  ).join('');
  return nextHtml
    .replace(/^[ \t]*<link\b(?=[^>]*\brel=["']alternate["'])(?=[^>]*\bhreflang=)[^>]*>[ \t]*\r?\n/gmi, '')
    .replace('</head>', () => `${alternates}</head>`);
}

function applyNoIndex(html) {
  return replaceOrInsert(
    html,
    /<meta[^>]+name=["']robots["'][^>]*>/i,
    '<meta data-react-helmet="true" name="robots" content="noindex, nofollow" />',
  );
}

const rootMarker = '<div id="root"></div>';
if (indexHtml.split(rootMarker).length !== 2) throw new Error('Static route shell must contain exactly one empty root element');
const pairedPages = await renderStaticPages(translatedRoutePairs.flatMap(({ en, de }) => [en, de]));
const withContent = (html, content) => html.replace(rootMarker, () => `<div id="root">${content}</div>`);
const rootHtml = applySeo(indexHtml, routeSeo['/']);
writeFileSync(indexPath, withContent(rootHtml, `<!--static-home-->${pairedPages.get('/')}<!--/static-home-->`));

const renderStaticRoute = (route) => {
  const html = applySeo(indexHtml, routeSeo[route]);
  if (pairedPages.has(route)) return withContent(html, pairedPages.get(route));
  if (!route.startsWith('/project/')) return html;
  const slug = route.slice('/project/'.length);
  const story = getCaseStudyBySlug(slug);
  if (!story) throw new Error(`Static case-study route has no public story: ${route}`);
  const backHref = story.projectStatus === 'ongoing' ? '/case-studies/#in-progress' : '/case-studies/';
  const article = renderToStaticMarkup(React.createElement(CaseStudyArticle, { story, backHref }));
  return withContent(html, article);
};

const stripHeroPreload = (html) =>
  html.replace(/<link\b(?=[^>]*\brel=["']preload["'])(?=[^>]*\bas=["']image["'])[^>]*>\s*/i, '');

for (const route of staticRoutes) {
  const routeDir = path.join(distDir, route);
  mkdirSync(routeDir, { recursive: true });
  const html = renderStaticRoute(route);
  writeFileSync(path.join(routeDir, 'index.html'), route === '/de' ? html : stripHeroPreload(html));
}

writeFileSync(path.join(distDir, '404.html'), stripHeroPreload(applyNoIndex(applySeo(indexHtml, notFoundSeo))));

assertStaticCaseStudyRoutes(distDir);
const checkedLinkCount = assertPublicLinksRouted(distDir);
console.log(`Checked ${checkedLinkCount} public links against static output.`);
console.log(`Generated static HTML for ${staticRoutes.length + 2} routes, including 404.html.${removedStaleProjectHtml.length > 0 ? ` Removed stale project HTML for: ${removedStaleProjectHtml.join(', ')}.` : ''}`);
