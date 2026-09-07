// @vitest-environment node
import { execFileSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { caseStudySlugs } from '../src/data/caseStudies.js';
import { routeSeo } from '../src/lib/seoConfig.js';
import {
  assertCaseStudyRouteSources,
  assertSameCaseStudySlugs,
  assertSitemapCaseStudyRoutes,
  removeStaleProjectHtml,
} from './case-study-route-integrity.js';

const temporaryDirectories = [];
afterEach(() => temporaryDirectories.splice(0).forEach((directory) => rmSync(directory, { recursive: true, force: true })));

const projectRoute = (slug) => `/project/${slug}`;
const htaccess = () => readFileSync('public/.htaccess', 'utf8');

function fixture() {
  const directory = mkdtempSync(path.join(tmpdir(), 'case-study-route-fixture-'));
  temporaryDirectories.push(directory);

  for (const file of [
    'index.html',
    'public/.htaccess',
    'src/config/links.js',
    'src/data/caseStudies.js',
    'src/lib/seoConfig.js',
    'tools/case-study-route-integrity.js',
    'tools/generate-sitemap.js',
    'tools/generate-static-route-html.js',
  ]) {
    mkdirSync(path.dirname(path.join(directory, file)), { recursive: true });
    copyFileSync(file, path.join(directory, file));
  }
  mkdirSync(path.join(directory, 'dist'), { recursive: true });
  copyFileSync('index.html', path.join(directory, 'dist/index.html'));
  writeFileSync(path.join(directory, 'package.json'), '{"type":"module"}');
  return directory;
}

const run = (directory, script) =>
  execFileSync(process.execPath, [`tools/${script}.js`], {
    cwd: directory,
    encoding: 'utf8',
    stdio: 'pipe',
    env: { ...process.env, SITEMAP_LASTMOD: '2026-09-07' },
  });

describe('case-study route integrity', () => {
  it('rejects duplicate source slugs before a consumer can generate routes', () => {
    expect(() => assertSameCaseStudySlugs(['one', 'one'], ['one'], 'SEO'))
      .toThrow(/duplicate case-study slugs/i);
  });

  it('rejects SEO routes that are missing or have a mismatched canonical path', () => {
    const missingSeo = structuredClone(routeSeo);
    delete missingSeo[projectRoute(caseStudySlugs[0])];
    expect(() => assertCaseStudyRouteSources({ slugs: caseStudySlugs, seo: missingSeo, htaccess: htaccess() }))
      .toThrow(/SEO case-study routes do not match/i);

    const mismatchedSeo = structuredClone(routeSeo);
    mismatchedSeo[projectRoute(caseStudySlugs[0])].path = projectRoute(caseStudySlugs[1]);
    expect(() => assertCaseStudyRouteSources({ slugs: caseStudySlugs, seo: mismatchedSeo, htaccess: htaccess() }))
      .toThrow(/canonical path/i);
  });

  it('rejects a stale or broad deployment project regex', () => {
    const staleRouting = htaccess().replace(caseStudySlugs[0], 'withdrawn-case-study');
    expect(() => assertCaseStudyRouteSources({ htaccess: staleRouting }))
      .toThrow(/Deployment routing case-study routes do not match/i);

    const broadRouting = htaccess().replace(`(${caseStudySlugs.join('|')})`, '([a-z-]+)');
    expect(() => assertCaseStudyRouteSources({ htaccess: broadRouting }))
      .toThrow(/Deployment routing case-study routes do not match/i);

    const projectRule = htaccess().match(/^\s*RewriteRule\s+\^project\/.*$/m)[0];
    expect(() => assertCaseStudyRouteSources({ htaccess: `${htaccess()}\n${projectRule}` }))
      .toThrow(/exactly one case-study allowlist rule/i);
  });

  it('rejects sitemap pages that are missing or stale', () => {
    const sitemap = caseStudySlugs
      .slice(1)
      .map((slug) => `<loc>https://www.vivekapatel.com${projectRoute(slug)}/</loc>`)
      .concat('<loc>https://www.vivekapatel.com/project/withdrawn-case-study/</loc>')
      .join('\n');
    expect(() => assertSitemapCaseStudyRoutes(sitemap)).toThrow(/missing:|stale:/i);

    const noncanonicalExtra = `${sitemap}\n<loc>https://www.vivekapatel.com/project/withdrawn-case-study</loc>`;
    expect(() => assertSitemapCaseStudyRoutes(noncanonicalExtra))
      .toThrow(/canonical project route/i);
  });

  it('runs real generators, preserves tracked deployment routing bytes, and removes only stale generated HTML', () => {
    const directory = fixture();
    const deploymentPath = path.join(directory, 'public/.htaccess');
    const deploymentBefore = readFileSync(deploymentPath, 'utf8');
    const staleDirectory = path.join(directory, 'dist/project/withdrawn-case-study');
    mkdirSync(staleDirectory, { recursive: true });
    writeFileSync(path.join(staleDirectory, 'index.html'), 'STALE_GENERATED_HTML');
    writeFileSync(path.join(staleDirectory, 'operator-note.txt'), 'DO_NOT_REMOVE');

    run(directory, 'generate-sitemap');
    run(directory, 'generate-static-route-html');

    expect(readFileSync(deploymentPath, 'utf8')).toBe(deploymentBefore);
    expect(existsSync(path.join(staleDirectory, 'index.html'))).toBe(false);
    expect(readFileSync(path.join(staleDirectory, 'operator-note.txt'), 'utf8')).toBe('DO_NOT_REMOVE');
    for (const slug of caseStudySlugs) {
      expect(existsSync(path.join(directory, 'dist', projectRoute(slug), 'index.html'))).toBe(true);
      expect(readFileSync(path.join(directory, 'public/sitemap.xml'), 'utf8'))
        .toContain(`https://www.vivekapatel.com${projectRoute(slug)}/`);
    }
  });

  it('fails the real sitemap generator before it writes when deployment routing diverges', () => {
    const directory = fixture();
    const deploymentPath = path.join(directory, 'public/.htaccess');
    writeFileSync(deploymentPath, readFileSync(deploymentPath, 'utf8').replace(caseStudySlugs[0], 'withdrawn-case-study'));

    expect(() => run(directory, 'generate-sitemap')).toThrow(/Deployment routing case-study routes do not match/i);
    expect(existsSync(path.join(directory, 'public/sitemap.xml'))).toBe(false);
  });

  it('refuses to traverse a symlinked static project directory', async () => {
    const directory = fixture();
    const distProjectDirectory = path.join(directory, 'dist/project');
    const targetDirectory = path.join(directory, 'unrelated-output');
    mkdirSync(targetDirectory);
    symlinkSync(targetDirectory, distProjectDirectory);

    const { removeStaleProjectHtml } = await import('./case-study-route-integrity.js');
    expect(() => removeStaleProjectHtml(path.join(directory, 'dist')))
      .toThrow(/must be a real directory/i);
    expect(existsSync(targetDirectory)).toBe(true);
  });
});


describe('adversarial output boundaries', () => {
  it.each([
    (slug) => `https://attacker.invalid/project/${slug}/`,
    (slug) => `https://www.vivekapatel.com/project/${slug}/?extra=1`,
    (slug) => `https://www.vivekapatel.com/project/${slug}/#extra`,
  ])('rejects noncanonical sitemap origins, queries, and fragments', (location) => {
    const sitemap = caseStudySlugs.map((slug) => `<loc>${location(slug)}</loc>`).join('');
    expect(() => assertSitemapCaseStudyRoutes(sitemap)).toThrow(/canonical project route/i);
  });

  it('does not clean through a symlinked dist root', () => {
    const directory = fixture();
    const outside = path.join(directory, 'outside');
    mkdirSync(path.join(outside, 'project/stale'), { recursive: true });
    const sentinel = path.join(outside, 'project/stale/index.html');
    writeFileSync(sentinel, 'PRESERVE');
    rmSync(path.join(directory, 'dist'), { recursive: true });
    symlinkSync(outside, path.join(directory, 'dist'));
    expect(() => removeStaleProjectHtml(path.join(directory, 'dist'))).toThrow(/real directory/i);
    expect(readFileSync(sentinel, 'utf8')).toBe('PRESERVE');
  });

  it.each(['directory', 'index'])('fails before writing through a canonical route %s symlink', (kind) => {
    const directory = fixture();
    const outside = path.join(directory, 'outside');
    mkdirSync(outside);
    const sentinel = path.join(outside, 'index.html');
    writeFileSync(sentinel, 'PRESERVE');
    const route = path.join(directory, 'dist/project', caseStudySlugs[0]);
    mkdirSync(path.dirname(route), { recursive: true });
    if (kind === 'directory') {
      symlinkSync(outside, route);
    } else {
      mkdirSync(route);
      symlinkSync(sentinel, path.join(route, 'index.html'));
    }
    const indexBefore = readFileSync(path.join(directory, 'dist/index.html'), 'utf8');
    expect(() => run(directory, 'generate-static-route-html')).toThrow(/symlinks or special files/i);
    expect(readFileSync(sentinel, 'utf8')).toBe('PRESERVE');
    expect(readFileSync(path.join(directory, 'dist/index.html'), 'utf8')).toBe(indexBefore);
  });
});
