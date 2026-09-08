// @vitest-environment node
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { caseStudyPublicationManifest } from './case-study-manifest.js';
import { compileCaseStudyPublication } from './compile-case-studies.js';
import { digest } from './case-study-evidence.js';
import { deploymentHtaccess } from '../plugins/vite-plugin-case-study-publication.js';

const outputDirectories = [];
afterEach(() => outputDirectories.splice(0).forEach((directory) => rmSync(directory, { recursive: true, force: true })));

const manifestCopy = () => structuredClone(caseStudyPublicationManifest);
const explicitApproval = (sha256) => ({ kind: 'explicit', sha256, approvedBy: 'Viv', approvedAt: '2026-09-08T00:00:00Z', evidence: 'https://example.invalid/approval/43' });
const outputFiles = (directory) => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const file = path.join(directory, entry.name);
  return entry.isDirectory() ? outputFiles(file) : [file];
});

function buildFixture() {
  const directory = mkdtempSync(path.join(realpathSync(tmpdir()), 'case-study-publication-fixture-'));
  outputDirectories.push(directory);
  for (const source of ['src', 'public', 'publication', 'plugins', 'tools', 'convex']) cpSync(source, path.join(directory, source), { recursive: true });
  for (const source of ['index.html', 'package.json', 'vite.config.js']) cpSync(source, path.join(directory, source));
  symlinkSync(path.join(process.cwd(), 'node_modules'), path.join(directory, 'node_modules'));
  return directory;
}

const runPublicationBuild = (directory) => execFileSync('npm', ['run', 'build'], { cwd: directory, encoding: 'utf8', stdio: 'pipe' });

describe('case-study publication boundary', () => {
  it('rejects draft payloads, changed baseline identity, and moved approved claims', () => {
    const draft = manifestCopy();
    draft.records.push({ id: 'private-sentinel', slug: 'private-sentinel', status: 'draft', content: { secret: 'DO_NOT_PUBLISH' } });
    expect(() => compileCaseStudyPublication({ manifest: draft })).toThrow(/unsupported fields/i);

    const renamed = manifestCopy();
    renamed.records[0].slug = 'new-public-route';
    expect(() => compileCaseStudyPublication({ manifest: renamed })).toThrow(/exact baseline retention/i);

    const moved = manifestCopy();
    moved.claims['n8n-openai-data-extraction.summary'].placement = 'outcome';
    expect(() => compileCaseStudyPublication({ manifest: moved })).toThrow(/exact value/i);
  });

  it('fails closed for duplicate slugs, missing approvals, and unsafe external links', () => {
    const duplicate = manifestCopy();
    duplicate.records[1].slug = duplicate.records[0].slug;
    expect(() => compileCaseStudyPublication({ manifest: duplicate })).toThrow(/duplicate id or slug/i);

    const missingApproval = manifestCopy();
    delete missingApproval.records[0].approval;
    expect(() => compileCaseStudyPublication({ manifest: missingApproval })).toThrow(/requires an approval/i);

    const unsafeLink = manifestCopy();
    unsafeLink.claims['n8n-openai-data-extraction.upwork-project'].value = 'https://user@example.invalid/\\path';
    expect(() => compileCaseStudyPublication({ manifest: unsafeLink })).toThrow(/exact baseline retention|matching approval hash|unsafe URL/i);

    const missingClaimApproval = manifestCopy();
    delete missingClaimApproval.claims['n8n-openai-data-extraction.upwork-project'].approval;
    expect(() => compileCaseStudyPublication({ manifest: missingClaimApproval })).toThrow(/claim .* requires an approval/i);

    const unsafeAssetPath = manifestCopy();
    unsafeAssetPath.records[0].content.image.src = '/assets/case-studies/../escape.webp';
    unsafeAssetPath.records[0].approval = explicitApproval(digest({ id: unsafeAssetPath.records[0].id, slug: unsafeAssetPath.records[0].slug, content: unsafeAssetPath.records[0].content }));
    expect(() => compileCaseStudyPublication({ manifest: unsafeAssetPath })).toThrow(/unsafe case-study asset path/i);

    const invalidIdentity = manifestCopy();
    invalidIdentity.records[0].id = '';
    expect(() => compileCaseStudyPublication({ manifest: invalidIdentity })).toThrow(/safe id and slug/i);

    const invalidLabel = manifestCopy();
    invalidLabel.records[0].content.externalLinks[0].label = { unsupported: true };
    invalidLabel.records[0].approval = explicitApproval(digest({ id: invalidLabel.records[0].id, slug: invalidLabel.records[0].slug, content: invalidLabel.records[0].content }));
    expect(() => compileCaseStudyPublication({ manifest: invalidLabel })).toThrow(/label must be a non-empty string/i);
  });

  it('renders a deny-all deployment rule when every case study is withdrawn', () => {
    const rendered = deploymentHtaccess(readFileSync('public/.htaccess', 'utf8'), []);
    expect(rendered).toContain('RewriteRule ^project/ - [R=404,L]');
  });

  it('builds from a disposable manifest, excludes drafts, and withdraws stale public output', () => {
    const directory = buildFixture();
    const manifestPath = path.join(directory, 'publication/case-study-manifest.js');
    const trackedHtaccess = readFileSync(path.join(directory, 'public/.htaccess'));
    const trackedSitemap = readFileSync(path.join(directory, 'public/sitemap.xml'));
    writeFileSync(path.join(directory, 'public/assets/case-studies/private-sentinel.webp'), 'PRIVATE_SENTINEL_ASSET');
    writeFileSync(manifestPath, `${readFileSync(manifestPath, 'utf8')}\ncaseStudyPublicationManifest.records.push({ id: 'private-sentinel', slug: 'private-sentinel', status: 'draft' });\n`);
    runPublicationBuild(directory);
    const dist = path.join(directory, 'dist');
    const initialFiles = outputFiles(dist);
    const initialEntry = initialFiles.find((file) => /\/assets\/index-.*\.js$/.test(file));
    expect(Buffer.concat(initialFiles.map((file) => readFileSync(file))).includes(Buffer.from('private-sentinel'))).toBe(false);
    expect(existsSync(path.join(dist, 'assets/case-studies/private-sentinel.webp'))).toBe(false);
    expect(existsSync(path.join(dist, 'project/yolo-computer-vision-optimization/index.html'))).toBe(true);

    writeFileSync(manifestPath, `${readFileSync(manifestPath, 'utf8')}\ncaseStudyPublicationManifest.records.splice(2, 1, { id: 'yolo-computer-vision-optimization', slug: 'yolo-computer-vision-optimization', status: 'draft' });\n`);
    runPublicationBuild(directory);
    const withdrawnFiles = outputFiles(dist);
    const outputText = Buffer.concat(withdrawnFiles.map((file) => readFileSync(file))).toString('latin1');
    expect(outputText).not.toContain('yolo-computer-vision-optimization');
    expect(existsSync(path.join(dist, 'project/yolo-computer-vision-optimization'))).toBe(false);
    expect(existsSync(path.join(dist, 'assets/case-studies/yoga-pose.webp'))).toBe(false);
    expect(existsSync(path.join(dist, 'assets/case-studies/football-tracking.mp4'))).toBe(false);
    expect(existsSync(path.join(dist, 'assets/case-studies/football-tracking.webp'))).toBe(false);
    expect(existsSync(initialEntry)).toBe(false);
    expect(readFileSync(path.join(directory, 'public/.htaccess'))).toEqual(trackedHtaccess);
    expect(readFileSync(path.join(directory, 'public/sitemap.xml'))).toEqual(trackedSitemap);

    writeFileSync(manifestPath, `${readFileSync(manifestPath, 'utf8')}\ncaseStudyPublicationManifest.records.splice(0, caseStudyPublicationManifest.records.length, { id: 'n8n-openai-data-extraction', slug: 'n8n-openai-data-extraction', status: 'draft' }, { id: 'invoice-ocr-extraction', slug: 'invoice-ocr-extraction', status: 'draft' }, { id: 'yolo-computer-vision-optimization', slug: 'yolo-computer-vision-optimization', status: 'draft' });\n`);
    runPublicationBuild(directory);
    expect(readFileSync(path.join(dist, '.htaccess'), 'utf8')).toContain('RewriteRule ^project/ - [R=404,L]');
    expect(readFileSync(path.join(dist, 'sitemap.xml'), 'utf8')).not.toContain('/project/');
    expect(existsSync(path.join(dist, 'project'))).toBe(false);
  }, 30_000);
});
