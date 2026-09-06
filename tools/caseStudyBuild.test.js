// @vitest-environment node
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { caseStudyPublicationRecords } from '../src/data/caseStudies.js';

const temporaryDirectories = [];
afterEach(() => temporaryDirectories.splice(0).forEach((directory) => rmSync(directory, { recursive: true, force: true })));

function fixture(records) {
  const directory = mkdtempSync(path.join(tmpdir(), 'gate2-build-fixture-'));
  temporaryDirectories.push(directory);
  for (const file of [
    'src/data/caseStudyPublishing.js', 'src/lib/seoConfig.js',
    'tools/generate-sitemap.js', 'tools/generate-static-route-html.js',
    'docs/claims/gate-1-claim-ledger.json', 'public/.htaccess',
  ]) {
    mkdirSync(path.dirname(path.join(directory, file)), { recursive: true });
    copyFileSync(file, path.join(directory, file));
  }
  mkdirSync(path.join(directory, 'dist'), { recursive: true });
  copyFileSync('index.html', path.join(directory, 'dist/index.html'));
  writeFileSync(path.join(directory, 'package.json'), '{"type":"module"}');
  writeFileSync(path.join(directory, 'src/data/caseStudies.js'), `
    import { publishCaseStudies } from './caseStudyPublishing.js';
    export const caseStudyPublicationRecords = ${JSON.stringify(records)};
    export const caseStudies = publishCaseStudies(caseStudyPublicationRecords);
    export const caseStudySlugs = caseStudies.map(study => study.slug);
  `);
  return directory;
}

const run = (directory, script) => execFileSync(process.execPath, [`tools/${script}.js`], {
  cwd: directory, encoding: 'utf8', stdio: 'pipe', env: { ...process.env, SITEMAP_LASTMOD: '2026-09-06' },
});

describe('real publication build consumers', () => {
  it('removes a withdrawn story from SEO HTML, sitemap and Apache routes, including stale output', () => {
    const records = structuredClone(caseStudyPublicationRecords);
    const withdrawn = records[0].portfolioSafeContent.slug;
    records[0] = { id: withdrawn, publishingStatus: 'draft', publicationApproved: false };
    const directory = fixture(records);
    const stale = path.join(directory, 'dist/project', withdrawn);
    mkdirSync(stale, { recursive: true });
    writeFileSync(path.join(stale, 'index.html'), 'WITHDRAWN_CONTENT_SENTINEL');
    run(directory, 'generate-sitemap');
    run(directory, 'generate-static-route-html');
    expect(existsSync(stale)).toBe(false);
    for (const file of ['public/sitemap.xml', 'public/.htaccess']) {
      expect(readFileSync(path.join(directory, file), 'utf8')).not.toContain(withdrawn);
    }
    const retained = records[1].portfolioSafeContent;
    const html = readFileSync(path.join(directory, 'dist/project', retained.slug, 'index.html'), 'utf8');
    expect(html).toContain(retained.title);
    expect(html).not.toContain('WITHDRAWN_CONTENT_SENTINEL');
    expect(readFileSync(path.join(directory, 'dist/404.html'), 'utf8')).toContain('noindex, nofollow');
  });

  it('supports zero published stories and repeated generation without opening a project route', () => {
    const directory = fixture(caseStudyPublicationRecords.map(({ id }) => ({ id, publishingStatus: 'draft', publicationApproved: false })));
    run(directory, 'generate-sitemap');
    run(directory, 'generate-sitemap');
    run(directory, 'generate-static-route-html');
    expect(readFileSync(path.join(directory, 'public/sitemap.xml'), 'utf8')).not.toContain('/project/');
    expect(readFileSync(path.join(directory, 'public/.htaccess'), 'utf8')).toContain('^project/(?!)/?$');
    expect(existsSync(path.join(directory, 'dist/project'))).toBe(false);
  });

  it('fails the real build entry before generating routes for a withheld claim', () => {
    const records = structuredClone(caseStudyPublicationRecords);
    records[0].portfolioSafeContent.claims[0].id = 'rate-eur-80';
    const directory = fixture(records);
    expect(() => run(directory, 'generate-sitemap')).toThrow(/non-public claim/);
    expect(existsSync(path.join(directory, 'public/sitemap.xml'))).toBe(false);
  });
});
