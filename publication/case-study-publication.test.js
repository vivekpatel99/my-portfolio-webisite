// @vitest-environment node
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { caseStudyPublicationManifest } from './case-study-manifest.js';
import { compileCaseStudyPublication } from './compile-case-studies.js';
import { digest } from './case-study-evidence.js';
import { deploymentHtaccess } from '../plugins/vite-plugin-case-study-publication.js';

const outputDirectories = [];
afterEach(() => outputDirectories.splice(0).forEach((directory) => rmSync(directory, { recursive: true, force: true })));

const explicitApproval = (sha256) => ({ kind: 'explicit', sha256, approvedBy: 'Viv', approvedAt: '2026-09-08T00:00:00Z', evidence: 'https://example.invalid/approval/43' });
const unitAssetPath = '/assets/case-studies/fixture-unit.webp';
const unitAssetBytes = Buffer.from('FIXTURE_UNIT_ASSET');
const fixtureContent = (id) => ({
  title: `${id} title`, cardTitle: `${id} card`, category: 'Fixture', summary: `${id} summary`,
  challenge: `${id} challenge`, solution: `${id} solution`, outcome: `${id} outcome`,
  stats: [{ value: 1, suffix: '', label: `${id} stat`, description: `${id} statistic` }],
  image: { src: unitAssetPath, alt: `${id} image` },
  gallery: [{ src: unitAssetPath, alt: `${id} gallery` }],
  stack: ['Fixture'], externalLinks: [{ label: `${id} link`, claimRef: `${id}.external` }],
});
const fixtureRecord = (id) => {
  const content = fixtureContent(id);
  const record = { id, slug: id, status: 'published', content, claimRefs: { summary: `${id}.summary`, outcome: `${id}.outcome`, stats: [`${id}.stats.0`] } };
  record.approval = explicitApproval(digest({ id: record.id, slug: record.slug, content: record.content }));
  return record;
};
const unitRoots = new WeakMap();
const manifestCopy = () => {
  const root = mkdtempSync(path.join(realpathSync(tmpdir()), 'case-study-unit-fixture-'));
  outputDirectories.push(root);
  const assetDirectory = path.join(root, 'public/assets/case-studies');
  mkdirSync(assetDirectory, { recursive: true });
  writeFileSync(path.join(assetDirectory, 'fixture-unit.webp'), unitAssetBytes);
  const manifest = structuredClone(caseStudyPublicationManifest);
  manifest.assets = {
    [unitAssetPath]: {
      file: 'public/assets/case-studies/fixture-unit.webp',
      approval: explicitApproval(digest(unitAssetBytes)),
    },
  };
  const records = [fixtureRecord('fixture-one'), fixtureRecord('fixture-two')];
  manifest.records = records;
  for (const record of records) {
    const claim = (id, placement, value, type = 'content') => {
      const entry = { type, recordId: record.id, placement, value };
      entry.approval = explicitApproval(digest({ id, type: entry.type, recordId: entry.recordId, placement: entry.placement, value: entry.value }));
      manifest.claims[id] = entry;
    };
    claim(`${record.id}.summary`, 'summary', record.content.summary);
    claim(`${record.id}.outcome`, 'outcome', record.content.outcome);
    claim(`${record.id}.stats.0`, 'stats.0', record.content.stats[0]);
    claim(`${record.id}.external`, 'externalLinks.0', 'https://example.invalid/service', 'external-link');
  }
  unitRoots.set(manifest, root);
  return manifest;
};
const compileFixture = (manifest) => compileCaseStudyPublication({ manifest, root: unitRoots.get(manifest) });
const outputFiles = (directory) => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const file = path.join(directory, entry.name);
  return entry.isDirectory() ? outputFiles(file) : [file];
});

function buildFixture() {
  const directory = mkdtempSync(path.join(realpathSync(tmpdir()), 'case-study-publication-fixture-'));
  outputDirectories.push(directory);
  for (const source of ['src', 'public', 'publication', 'plugins', 'tools', 'convex']) cpSync(source, path.join(directory, source), { recursive: true });
  const assetDirectory = path.join(directory, 'public/assets/case-studies');
  rmSync(assetDirectory, { recursive: true, force: true });
  mkdirSync(assetDirectory, { recursive: true });
  writeFileSync(path.join(assetDirectory, 'fixture-approved.webp'), 'FIXTURE_APPROVED_ASSET');
  writeFileSync(path.join(assetDirectory, 'obsolete-approved.webp'), 'OBSOLETE_FIXTURE_ASSET');
  for (const source of ['index.html', 'package.json', 'vite.config.js', 'vitest.config.ts']) cpSync(source, path.join(directory, source));
  symlinkSync(path.join(process.cwd(), 'node_modules'), path.join(directory, 'node_modules'));
  return directory;
}

const runPublicationBuild = (directory) => execFileSync('npm', ['run', 'build'], {
  cwd: directory,
  encoding: 'utf8',
  stdio: 'pipe',
  timeout: 60_000,
  killSignal: 'SIGTERM',
});
const runAffectedTests = (directory) => execFileSync(path.join(directory, 'node_modules/.bin/vitest'), [
  'run',
  'src/data/caseStudies.test.js',
  'tools/case-study-route-integrity.test.js',
  'src/components/Portfolio.test.jsx',
  'src/pages/Project.test.jsx',
], {
  cwd: directory,
  encoding: 'utf8',
  stdio: 'pipe',
  timeout: 20_000,
  killSignal: 'SIGTERM',
});

const fixtureManifestSetup = `
const [{ createHash: fixtureCreateHash }, { readFileSync: fixtureReadFileSync }] = await Promise.all([import('node:crypto'), import('node:fs')]);
const fixtureDigest = (value) => fixtureCreateHash('sha256').update(JSON.stringify(value)).digest('hex');
const fixtureApproval = (sha256) => ({ kind: 'explicit', sha256, approvedBy: 'Fixture', approvedAt: '2026-09-08T00:00:00Z', evidence: 'https://example.invalid/approval/fixture' });
const fixtureContent = {
  title: 'Fixture Case Study', cardTitle: 'Fixture Case Study', category: 'Fixture',
  summary: 'Fixture summary.', challenge: 'Fixture challenge.', solution: 'Fixture solution.', outcome: 'Fixture outcome.',
  stats: [{ value: 1, suffix: '', label: 'Fixture stat', description: 'Fixture statistic.' }],
  image: { src: '/assets/case-studies/fixture-approved.webp', alt: 'Fixture image.' },
  gallery: [{ src: '/assets/case-studies/fixture-approved.webp', alt: 'Fixture gallery image.' }],
  stack: ['Fixture'], externalLinks: [],
};
const fixtureId = 'fixture-case-study';
caseStudyPublicationManifest.assets = {
  '/assets/case-studies/fixture-approved.webp': {
    file: 'public/assets/case-studies/fixture-approved.webp',
    approval: fixtureApproval(fixtureCreateHash('sha256').update(fixtureReadFileSync('public/assets/case-studies/fixture-approved.webp')).digest('hex')),
  },
};
const fixtureClaim = (placement, value) => {
  const id = fixtureId + '.' + placement;
  const claim = { type: 'content', recordId: fixtureId, placement, value };
  claim.approval = fixtureApproval(fixtureDigest({ id, type: claim.type, recordId: claim.recordId, placement: claim.placement, value: claim.value }));
  caseStudyPublicationManifest.claims[id] = claim;
  return id;
};
const fixtureRecord = { id: fixtureId, slug: fixtureId, status: 'published', content: fixtureContent, claimRefs: {
  summary: fixtureClaim('summary', fixtureContent.summary),
  outcome: fixtureClaim('outcome', fixtureContent.outcome),
  stats: [fixtureClaim('stats.0', fixtureContent.stats[0])],
} };
fixtureRecord.approval = fixtureApproval(fixtureDigest({ id: fixtureRecord.id, slug: fixtureRecord.slug, content: fixtureRecord.content }));
caseStudyPublicationManifest.records.splice(0, caseStudyPublicationManifest.records.length, fixtureRecord);
`;

describe('case-study publication boundary', () => {
  it('rejects draft payloads, changed baseline identity, and moved approved claims', () => {
    const draft = manifestCopy();
    draft.records.push({ id: 'private-sentinel', slug: 'private-sentinel', status: 'draft', content: { secret: 'DO_NOT_PUBLISH' } });
    expect(() => compileFixture(draft)).toThrow(/unsupported fields/i);

    const renamed = manifestCopy();
    renamed.records[0].slug = 'new-public-route';
    expect(() => compileFixture(renamed)).toThrow(/matching hash/i);

    const moved = manifestCopy();
    moved.claims['fixture-one.summary'].placement = 'outcome';
    expect(() => compileFixture(moved)).toThrow(/exact value/i);
  });

  it('fails closed for duplicate slugs, missing approvals, and unsafe external links', () => {
    const duplicate = manifestCopy();
    duplicate.records[1].slug = duplicate.records[0].slug;
    expect(() => compileFixture(duplicate)).toThrow(/duplicate id or slug/i);

    const missingApproval = manifestCopy();
    delete missingApproval.records[0].approval;
    expect(() => compileFixture(missingApproval)).toThrow(/requires an approval/i);

    const unsafeLink = manifestCopy();
    unsafeLink.claims['fixture-one.external'].value = 'https://user@example.invalid/\\path';
    unsafeLink.claims['fixture-one.external'].approval = explicitApproval(digest({ id: 'fixture-one.external', type: 'external-link', recordId: 'fixture-one', placement: 'externalLinks.0', value: unsafeLink.claims['fixture-one.external'].value }));
    expect(() => compileFixture(unsafeLink)).toThrow(/unsafe URL/i);

    const missingClaimApproval = manifestCopy();
    delete missingClaimApproval.claims['fixture-one.external'].approval;
    expect(() => compileFixture(missingClaimApproval)).toThrow(/claim .* requires an approval/i);

    const unsafeAssetPath = manifestCopy();
    unsafeAssetPath.records[0].content.image.src = '/assets/case-studies/../escape.webp';
    unsafeAssetPath.records[0].approval = explicitApproval(digest({ id: unsafeAssetPath.records[0].id, slug: unsafeAssetPath.records[0].slug, content: unsafeAssetPath.records[0].content }));
    expect(() => compileFixture(unsafeAssetPath)).toThrow(/unsafe case-study asset path/i);

    const invalidIdentity = manifestCopy();
    invalidIdentity.records[0].id = '';
    expect(() => compileFixture(invalidIdentity)).toThrow(/safe id and slug/i);

    const invalidLabel = manifestCopy();
    invalidLabel.records[0].content.externalLinks[0].label = { unsupported: true };
    invalidLabel.records[0].approval = explicitApproval(digest({ id: invalidLabel.records[0].id, slug: invalidLabel.records[0].slug, content: invalidLabel.records[0].content }));
    expect(() => compileFixture(invalidLabel)).toThrow(/label must be a non-empty string/i);
  });

  it('renders a deny-all deployment rule when every case study is withdrawn', () => {
    const rendered = deploymentHtaccess(readFileSync('public/.htaccess', 'utf8'), []);
    expect(rendered).toContain('RewriteRule ^project/ - [R=404,L]');
  });

  it('builds from a self-contained fixture, excludes drafts, and withdraws stale public output', () => {
    const directory = buildFixture();
    const manifestPath = path.join(directory, 'publication/case-study-manifest.js');
    const trackedHtaccess = readFileSync(path.join(directory, 'public/.htaccess'));
    const trackedSitemap = readFileSync(path.join(directory, 'public/sitemap.xml'));
    writeFileSync(path.join(directory, 'public/assets/case-studies/private-sentinel.webp'), 'PRIVATE_SENTINEL_ASSET');
    writeFileSync(manifestPath, `${readFileSync(manifestPath, 'utf8')}\n${fixtureManifestSetup}\ncaseStudyPublicationManifest.records.push({ id: 'private-sentinel', slug: 'private-sentinel', status: 'draft' });\n`);
    runPublicationBuild(directory);
    runAffectedTests(directory);
    const dist = path.join(directory, 'dist');
    const initialFiles = outputFiles(dist);
    const initialEntry = initialFiles.find((file) => /\/assets\/index-.*\.js$/.test(file));
    expect(Buffer.concat(initialFiles.map((file) => readFileSync(file))).includes(Buffer.from('private-sentinel'))).toBe(false);
    expect(existsSync(path.join(dist, 'assets/case-studies/private-sentinel.webp'))).toBe(false);
    expect(existsSync(path.join(dist, 'assets/case-studies/fixture-approved.webp'))).toBe(true);
    expect(existsSync(path.join(dist, 'assets/case-studies/obsolete-approved.webp'))).toBe(false);
    expect(existsSync(path.join(dist, 'project/fixture-case-study/index.html'))).toBe(true);

    writeFileSync(manifestPath, `${readFileSync(manifestPath, 'utf8')}\ncaseStudyPublicationManifest.records.splice(0, caseStudyPublicationManifest.records.length, { id: 'fixture-case-study', slug: 'fixture-case-study', status: 'draft' }, { id: 'private-sentinel', slug: 'private-sentinel', status: 'draft' });\n`);
    rmSync(path.join(directory, 'public/assets/case-studies/obsolete-approved.webp'));
    runPublicationBuild(directory);
    runAffectedTests(directory);
    const withdrawnFiles = outputFiles(dist);
    const outputText = Buffer.concat(withdrawnFiles.map((file) => readFileSync(file))).toString('latin1');
    expect(outputText).not.toContain('fixture-case-study');
    expect(existsSync(path.join(dist, 'project/fixture-case-study'))).toBe(false);
    expect(existsSync(path.join(dist, 'assets/case-studies/fixture-approved.webp'))).toBe(false);
    expect(existsSync(initialEntry)).toBe(false);
    expect(readFileSync(path.join(directory, 'public/.htaccess'))).toEqual(trackedHtaccess);
    expect(readFileSync(path.join(directory, 'public/sitemap.xml'))).toEqual(trackedSitemap);

    expect(readFileSync(path.join(dist, '.htaccess'), 'utf8')).toContain('RewriteRule ^project/ - [R=404,L]');
    expect(readFileSync(path.join(dist, 'sitemap.xml'), 'utf8')).not.toContain('/project/');
    expect(existsSync(path.join(dist, 'project'))).toBe(false);
  }, 180_000);
});
