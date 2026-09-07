import { lstatSync, readdirSync, rmSync, rmdirSync } from 'node:fs';
import path from 'node:path';
import { caseStudySlugs } from '../src/data/caseStudies.js';
import { routeSeo } from '../src/lib/seoConfig.js';

const projectRoutePrefix = '/project/';

const assertUniqueSlugs = (slugs, consumer) => {
  const duplicateSlugs = slugs.filter((slug, index) => slugs.indexOf(slug) !== index);
  if (duplicateSlugs.length > 0) {
    throw new Error(`${consumer} contains duplicate case-study slugs: ${[...new Set(duplicateSlugs)].join(', ')}`);
  }
};

const assertSafeSlugs = (slugs) => {
  const unsafeSlugs = slugs.filter((slug) => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug));
  if (unsafeSlugs.length > 0) {
    throw new Error(`Case-study source contains unsafe route slugs: ${unsafeSlugs.join(', ')}`);
  }
};

export const projectRouteForSlug = (slug) => `${projectRoutePrefix}${slug}`;

export const projectSlugsFromSeo = (seo = routeSeo) =>
  Object.keys(seo)
    .filter((route) => route.startsWith(projectRoutePrefix))
    .map((route) => route.slice(projectRoutePrefix.length));

export const projectSlugsFromDeploymentConfig = (htaccess) => {
  const projectRules = [...htaccess.matchAll(/^\s*RewriteRule\s+\^project\/.*$/gm)];
  if (projectRules.length !== 1) {
    throw new Error('Deployment routing must contain exactly one case-study allowlist rule');
  }

  const match = projectRules[0][0].match(/^\s*RewriteRule\s+\^project\/\(([^)]+)\)\/\?\$\s+index\.html\s+\[L\]\s*$/);
  if (!match) {
    throw new Error('Deployment routing must contain one explicit case-study allowlist');
  }

  return match[1].split('|');
};

export const projectSlugsFromSitemap = (sitemap) =>
  [...sitemap.matchAll(/<loc>([^<]*\/project\/[^<]*)<\/loc>/g)].map((match) => {
    const location = match[1];
    let pathname;
    try {
      pathname = new URL(location).pathname;
    } catch {
      throw new Error(`Sitemap contains an invalid case-study location: ${location}`);
    }

    const routeMatch = pathname.match(/^\/project\/([a-z0-9]+(?:-[a-z0-9]+)*)\/$/);
    if (!routeMatch) {
      throw new Error(`Sitemap case-study location must be a canonical project route: ${location}`);
    }
    return routeMatch[1];
  });

const assertRealProjectDirectory = (projectDirectory) => {
  let projectDirectoryInfo;
  try {
    projectDirectoryInfo = lstatSync(projectDirectory);
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
  if (!projectDirectoryInfo.isDirectory()) {
    throw new Error(`Static project output must be a real directory: ${projectDirectory}`);
  }
  return true;
};

export const assertSameCaseStudySlugs = (expected, actual, consumer) => {
  assertUniqueSlugs(expected, 'Case-study source');
  assertSafeSlugs(expected);
  assertUniqueSlugs(actual, consumer);

  const missing = expected.filter((slug) => !actual.includes(slug));
  const stale = actual.filter((slug) => !expected.includes(slug));
  if (missing.length > 0 || stale.length > 0) {
    const problems = [
      missing.length > 0 && `missing: ${missing.join(', ')}`,
      stale.length > 0 && `stale: ${stale.join(', ')}`,
    ].filter(Boolean);
    throw new Error(`${consumer} case-study routes do not match the source (${problems.join('; ')})`);
  }
};

export const assertCaseStudyRouteSources = ({
  slugs = caseStudySlugs,
  seo = routeSeo,
  htaccess,
} = {}) => {
  if (!htaccess) {
    throw new Error('Deployment routing contents are required for case-study route validation');
  }

  const seoProjectSlugs = projectSlugsFromSeo(seo);
  assertSameCaseStudySlugs(slugs, seoProjectSlugs, 'SEO');
  for (const slug of slugs) {
    const route = projectRouteForSlug(slug);
    if (seo[route]?.path !== route) {
      throw new Error(`SEO route ${route} must use ${route} as its canonical path`);
    }
  }
  assertSameCaseStudySlugs(slugs, projectSlugsFromDeploymentConfig(htaccess), 'Deployment routing');
};

export const assertSitemapCaseStudyRoutes = (sitemap, slugs = caseStudySlugs) =>
  assertSameCaseStudySlugs(slugs, projectSlugsFromSitemap(sitemap), 'Sitemap');

export const removeStaleProjectHtml = (distDir, slugs = caseStudySlugs) => {
  assertUniqueSlugs(slugs, 'Case-study source');
  assertSafeSlugs(slugs);
  const projectDirectory = path.join(distDir, 'project');
  if (!assertRealProjectDirectory(projectDirectory)) return [];

  const staleSlugs = readdirSync(projectDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !slugs.includes(entry.name))
    .flatMap((entry) => {
      const routeDirectory = path.join(projectDirectory, entry.name);
      const generatedIndex = path.join(routeDirectory, 'index.html');
      const generatedIndexEntry = readdirSync(routeDirectory, { withFileTypes: true })
        .find((child) => child.name === 'index.html');
      if (!generatedIndexEntry?.isFile()) return [];

      rmSync(generatedIndex);
      if (readdirSync(routeDirectory).length === 0) {
        rmdirSync(routeDirectory);
      }
      return [entry.name];
    });

  return staleSlugs;
};

export const assertStaticCaseStudyRoutes = (distDir, slugs = caseStudySlugs) => {
  const projectDirectory = path.join(distDir, 'project');
  const staticSlugs = assertRealProjectDirectory(projectDirectory)
    ? readdirSync(projectDirectory, { withFileTypes: true })
      .filter((entry) => entry.isDirectory()
        && readdirSync(path.join(projectDirectory, entry.name), { withFileTypes: true })
          .some((child) => child.name === 'index.html' && child.isFile()))
      .map((entry) => entry.name)
    : [];
  assertSameCaseStudySlugs(slugs, staticSlugs, 'Static HTML');
};
