import { lstatSync, readdirSync, rmSync, rmdirSync } from 'node:fs';
import path from 'node:path';
import { caseStudySlugs } from '../src/data/caseStudies.js';
import { routeSeo, SITE_URL } from '../src/lib/seoConfig.js';

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
    if (!routeMatch || location !== `${SITE_URL}/project/${routeMatch[1]}/`) {
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

const projectOutputDirectories = (projectDirectory) => {
  const entries = readdirSync(projectDirectory, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isSymbolicLink()) {
      throw new Error(`Static project output must not contain symlinks: ${entry.name}`);
    }
    if (entry.isDirectory()) {
      const index = readdirSync(path.join(projectDirectory, entry.name), { withFileTypes: true })
        .find((child) => child.name === 'index.html');
      if (index && !index.isFile()) {
        throw new Error(`Static project index must be a regular file: ${entry.name}`);
      }
    }
  }
  return entries.filter((entry) => entry.isDirectory());
};

export const removeStaleProjectHtml = (distDir, slugs = caseStudySlugs) => {
  assertUniqueSlugs(slugs, 'Case-study source');
  assertSafeSlugs(slugs);
  if (!assertRealProjectDirectory(distDir)) return [];
  const projectDirectory = path.join(distDir, 'project');
  if (!assertRealProjectDirectory(projectDirectory)) return [];

  const staleSlugs = projectOutputDirectories(projectDirectory)
    .filter((entry) => !slugs.includes(entry.name))
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

// Check every existing output component before the generator writes any files.
export const assertSafeStaticOutput = (distDir, routes) => {
  if (!assertRealProjectDirectory(distDir)) {
    throw new Error('Static output directory does not exist');
  }
  const outputs = ['index.html', '404.html', ...routes.map((route) => `${route.replace(/^\//, '')}/index.html`)];
  for (const output of outputs) {
    const parts = output.split('/');
    let current = distDir;
    for (let index = 0; index < parts.length; index += 1) {
      current = path.join(current, parts[index]);
      let info;
      try {
        info = lstatSync(current);
      } catch (error) {
        if (error.code === 'ENOENT') break;
        throw error;
      }
      const valid = index === parts.length - 1 ? info.isFile() : info.isDirectory();
      if (!valid) throw new Error(`Static output must not follow symlinks or special files: ${current}`);
    }
  }
};

export const assertStaticCaseStudyRoutes = (distDir, slugs = caseStudySlugs) => {
  const projectDirectory = path.join(distDir, 'project');
  const staticSlugs = assertRealProjectDirectory(projectDirectory)
    ? projectOutputDirectories(projectDirectory)
      .filter((entry) => readdirSync(path.join(projectDirectory, entry.name), { withFileTypes: true })
          .some((child) => child.name === 'index.html' && child.isFile()))
      .map((entry) => entry.name)
    : [];
  assertSameCaseStudySlugs(slugs, staticSlugs, 'Static HTML');
};
