import { lstatSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { serviceOffers, serviceRouteForId } from '../src/data/serviceOffers.js';
import { routeSeo, SITE_URL } from '../src/lib/seoConfig.js';
import { assertSameCaseStudySlugs } from './case-study-route-integrity.js';

const serviceRoutePrefix = '/services/';

export const serviceIdsFromDeploymentConfig = (htaccess) => {
  const serviceRules = [...htaccess.matchAll(/^\s*RewriteRule\s+\^services\/.*$/gm)];
  if (serviceRules.length !== 1) {
    throw new Error('Deployment routing must contain exactly one service allowlist rule');
  }
  const match = serviceRules[0][0].match(/^\s*RewriteRule\s+\^services\/\(([^)]+)\)\/\?\$\s+index\.html\s+\[L\]\s*$/);
  if (!match) {
    throw new Error('Deployment routing must contain one explicit service allowlist');
  }
  return match[1].split('|');
};

// Service IDs must agree across the offer catalog, SEO config, and Apache allowlist.
export const assertServiceRouteSources = ({ ids = serviceOffers.map((offer) => offer.id), seo = routeSeo, htaccess } = {}) => {
  if (!htaccess) throw new Error('Deployment routing contents are required for service route validation');
  const seoIds = Object.keys(seo)
    .filter((route) => route.startsWith(serviceRoutePrefix))
    .map((route) => route.slice(serviceRoutePrefix.length));
  assertSameCaseStudySlugs(ids, seoIds, 'Service SEO');
  for (const id of ids) {
    const route = serviceRouteForId(id);
    if (seo[route]?.path !== route) throw new Error(`SEO route ${route} must use ${route} as its canonical path`);
  }
  assertSameCaseStudySlugs(ids, serviceIdsFromDeploymentConfig(htaccess), 'Service deployment routing');
};

const isRegularFile = (filePath) => {
  try {
    return lstatSync(filePath).isFile();
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return false;
    throw error;
  }
};

// Require a generated file for each public page, including paths that Apache
// could otherwise rewrite to the home page.
export const staticOutputServesPath = (distDir, pathname) => {
  const relative = decodeURIComponent(pathname).replace(/^\/+/, '');
  if (relative.split('/').includes('..')) return false;
  const target = path.join(distDir, relative);
  return isRegularFile(path.join(target, 'index.html')) || (!relative.endsWith('/') && relative !== '' && isRegularFile(target));
};

const htmlFiles = (directory) => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const entryPath = path.join(directory, entry.name);
  if (entry.isDirectory()) return htmlFiles(entryPath);
  return entry.isFile() && entry.name.endsWith('.html') ? [entryPath] : [];
});

const pagePathFromHref = (href) => {
  if (/^(mailto:|tel:|javascript:|#)/i.test(href)) return null;
  const url = new URL(href.replace(/&amp;/g, '&'), `${SITE_URL}/`);
  if (url.origin !== SITE_URL || /\/[^/]+\.[^/]+$/.test(url.pathname)) return null;
  return url.pathname;
};

// Same-origin page links in generated HTML, as pathnames. The publication
// plugin checks file assets separately.
export const internalLinksFromHtml = (html) =>
  [...html.matchAll(/<a\b[^>]*\shref=(["'])(.*?)\1/gi)]
    .map((match) => pagePathFromHref(match[2]))
    .filter(Boolean);

export const literalPageLinksFromSource = (source) =>
  [...source.matchAll(/\b(?:to|href)\s*[:=]\s*(["'])([^"']*)\1/g)]
    .map((match) => pagePathFromHref(match[2]))
    .filter(Boolean);

const sourceFiles = (directory) => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const entryPath = path.join(directory, entry.name);
  if (entry.isDirectory()) return sourceFiles(entryPath);
  return entry.isFile() && /\.(jsx?|tsx?)$/.test(entry.name) && !/\.(test|spec)\.[jt]sx?$/.test(entry.name)
    ? [entryPath] : [];
});

const sourcePageLinks = () => sourceFiles(path.join(process.cwd(), 'src'))
  .flatMap((file) => literalPageLinksFromSource(readFileSync(file, 'utf8')));

// Check route data, literal component links, and links in generated HTML.
export const assertPublicLinksRouted = (distDir, { sourceLinks = [
  ...Object.keys(routeSeo),
  ...serviceOffers.map((offer) => serviceRouteForId(offer.id)),
  ...sourcePageLinks(),
] } = {}) => {
  const links = new Map(sourceLinks.map((link) => [link, 'source']));
  for (const file of htmlFiles(distDir)) {
    for (const link of internalLinksFromHtml(readFileSync(file, 'utf8'))) {
      if (!links.has(link)) links.set(link, path.relative(distDir, file));
    }
  }
  const unrouted = [...links].filter(([link]) => !staticOutputServesPath(distDir, link));
  if (unrouted.length > 0) {
    throw new Error(`Public links have no static route: ${unrouted.map(([link, from]) => `${link} (from ${from})`).join(', ')}`);
  }
  return links.size;
};
