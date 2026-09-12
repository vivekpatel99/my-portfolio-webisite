// @vitest-environment node
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { caseStudyPublicationManifest } from './case-study-manifest.js';
import { compileCaseStudyPublication, renderPublicCaseStudyModule } from './compile-case-studies.js';
import { digest } from './case-study-evidence.js';
import { deploymentHtaccess } from '../plugins/vite-plugin-case-study-publication.js';

const outputDirectories = [];
afterEach(() => outputDirectories.splice(0).forEach((directory) => rmSync(directory, { recursive: true, force: true })));

const explicitApproval = (sha256) => ({ kind: 'explicit', sha256, approvedBy: 'Viv', approvedAt: '2026-09-08T00:00:00Z', evidence: 'https://example.invalid/approval/43' });
const unitAssetPath = '/assets/case-studies/fixture-unit.webp';
const unitAssetBytes = Buffer.from('UklGRiIAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEALAAAAAABAAgAAQUxQSDIAAA=', 'base64');
const fixtureContent = (id) => ({
  title: `${id} title`, cardTitle: `${id} card`, category: 'Fixture', summary: `${id} summary`,
  projectStatus: 'completed',
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
const validFixturePng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');
const validFixtureWebp = Buffer.from('UklGRiIAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEALAAAAAABAAgAAQUxQSDIAAA=', 'base64');

function buildFixture() {
  const directory = mkdtempSync(path.join(realpathSync(tmpdir()), 'case-study-publication-fixture-'));
  outputDirectories.push(directory);
  for (const source of ['src', 'public', 'publication', 'plugins', 'tools', 'convex']) cpSync(source, path.join(directory, source), { recursive: true });
  const assetDirectory = path.join(directory, 'public/assets/case-studies');
  rmSync(assetDirectory, { recursive: true, force: true });
  mkdirSync(assetDirectory, { recursive: true });
  writeFileSync(path.join(assetDirectory, 'fixture-approved.webp'), validFixtureWebp);
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

const runCaseStudyPrepare = (directory, sourceFiles) => execFileSync('node', [
  path.join(directory, 'tools/prepare-case-study.js'),
  ...sourceFiles.flatMap((source) => ['--source', source]),
], { cwd: directory, encoding: 'utf8', stdio: 'pipe', timeout: 20_000 });

const runCaseStudyStageWithDigest = (directory, candidatePath, candidateSha256) => {
  return execFileSync('node', [
    path.join(directory, 'tools/stage-case-study-publication.js'),
    '--candidate', candidatePath,
    '--sha256', candidateSha256,
    '--approved-by', 'Fixture reviewer',
    '--approved-at', '2026-09-09T00:00:00Z',
    '--evidence', 'https://example.invalid/review/cs03',
  ], { cwd: directory, encoding: 'utf8', stdio: 'pipe', timeout: 20_000 });
};
const runCaseStudyStage = (directory, candidatePath) => runCaseStudyStageWithDigest(directory, candidatePath, digest(readFileSync(candidatePath)));
const runCaseStudyWithdraw = (directory, id) => execFileSync('node', [
  path.join(directory, 'tools/withdraw-case-study.js'), '--id', id,
], { cwd: directory, encoding: 'utf8', stdio: 'pipe', timeout: 20_000 });

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
const articleStories = ['text-story-one', 'text-story-two'].map((id) => ({
  id, slug: id, title: id + ' title', summary: id + ' summary',
  sections: [
    { key: 'problem', heading: 'The problem', nodes: [{ type: 'paragraph', children: [{ type: 'text', value: id + ' problem' }] }] },
    { key: 'built', heading: 'What I built', nodes: [{ type: 'paragraph', children: [{ type: 'text', value: id + ' build' }] }] },
    { key: 'outcome', heading: 'The outcome', nodes: [{ type: 'paragraph', children: [{ type: 'text', value: id + ' outcome' }] }] },
  ],
}));
const articleRecords = articleStories.map((story) => {
  const summaryRef = story.id + '.summary';
  const outcomeRef = story.id + '.outcome';
  const content = { title: story.title, summary: story.summary, projectStatus: 'completed', sections: story.sections };
  caseStudyPublicationManifest.claims[summaryRef] = { type: 'content', recordId: story.id, placement: 'summary', value: story.summary, approval: fixtureApproval(fixtureDigest({ id: summaryRef, type: 'content', recordId: story.id, placement: 'summary', value: story.summary })) };
  caseStudyPublicationManifest.claims[outcomeRef] = { type: 'content', recordId: story.id, placement: 'outcome', value: story.sections[2], approval: fixtureApproval(fixtureDigest({ id: outcomeRef, type: 'content', recordId: story.id, placement: 'outcome', value: story.sections[2] })) };
  const record = { id: story.id, slug: story.slug, status: 'published', variant: 'article', content, claimRefs: { summary: summaryRef, outcome: outcomeRef } };
  record.approval = fixtureApproval(fixtureDigest({ id: record.id, slug: record.slug, content }));
  return record;
});
caseStudyPublicationManifest.records.splice(0, caseStudyPublicationManifest.records.length, fixtureRecord, ...articleRecords);
`;

describe('case-study publication boundary', () => {
  it('generates one completed-only collection set for browser consumers', async () => {
    const rendered = renderPublicCaseStudyModule([
      { id: 'completed-story', slug: 'completed-story', projectStatus: 'completed' },
      { id: 'ongoing-story', slug: 'ongoing-story', projectStatus: 'ongoing' },
    ]);
    const module = await import(`data:text/javascript;base64,${Buffer.from(rendered).toString('base64')}`);
    expect(module.caseStudies).toHaveLength(2);
    expect(module.eligibleCaseStudies.map(({ id }) => id)).toEqual(['completed-story']);
    expect(module.eligibleCaseStudyCount).toBe(1);
    expect(module.featuredCaseStudies).toEqual(module.eligibleCaseStudies);
  });

  it('projects project status from approved article content', () => {
    const manifest = manifestCopy();
    const record = manifest.records[0];
    const content = {
      title: 'Article fixture',
      summary: 'Article summary',
      projectStatus: 'ongoing',
      sections: [
        { key: 'problem', heading: 'The problem', nodes: [{ type: 'paragraph', children: [{ type: 'text', value: 'Problem.' }] }] },
        { key: 'built', heading: 'What I built', nodes: [{ type: 'paragraph', children: [{ type: 'text', value: 'Built.' }] }] },
        { key: 'outcome', heading: 'The outcome', nodes: [{ type: 'paragraph', children: [{ type: 'text', value: 'Outcome.' }] }] },
      ],
    };
    record.variant = 'article';
    record.content = content;
    record.claimRefs = { summary: 'fixture-one.summary', outcome: 'fixture-one.outcome' };
    manifest.claims['fixture-one.summary'].value = content.summary;
    manifest.claims['fixture-one.summary'].approval = explicitApproval(digest({ id: 'fixture-one.summary', type: 'content', recordId: 'fixture-one', placement: 'summary', value: content.summary }));
    manifest.claims['fixture-one.outcome'].value = content.sections[2];
    manifest.claims['fixture-one.outcome'].approval = explicitApproval(digest({ id: 'fixture-one.outcome', type: 'content', recordId: 'fixture-one', placement: 'outcome', value: content.sections[2] }));
    record.approval = explicitApproval(digest({ id: record.id, slug: record.slug, content }));
    expect(compileFixture(manifest)[0].projectStatus).toBe('ongoing');
  });

  it('keeps published articles available while eligible collection data requires completed status', () => {
    const ongoing = manifestCopy();
    ongoing.records[0].content.projectStatus = 'ongoing';
    ongoing.records[0].approval = explicitApproval(digest({ id: ongoing.records[0].id, slug: ongoing.records[0].slug, content: ongoing.records[0].content }));
    const compiledOngoing = compileFixture(ongoing);
    expect(compiledOngoing).toHaveLength(2);
    expect(compiledOngoing[0].projectStatus).toBe('ongoing');

    const missing = manifestCopy();
    delete missing.records[0].content.projectStatus;
    missing.records[0].approval = explicitApproval(digest({ id: missing.records[0].id, slug: missing.records[0].slug, content: missing.records[0].content }));
    const compiledMissing = compileFixture(missing);
    expect(compiledMissing).toHaveLength(2);
    expect(compiledMissing[0]).not.toHaveProperty('projectStatus');

    const invalid = manifestCopy();
    invalid.records[0].content.projectStatus = 'unknown';
    invalid.records[0].approval = explicitApproval(digest({ id: invalid.records[0].id, slug: invalid.records[0].slug, content: invalid.records[0].content }));
    expect(() => compileFixture(invalid)).toThrow(/project status.*completed.*ongoing/i);
  });

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

    const invalidEvidence = manifestCopy();
    invalidEvidence.records[0].approval.evidence = 'https://:';
    expect(() => compileFixture(invalidEvidence)).toThrow(/requires explicit approval/i);

    const invalidApprovalDate = manifestCopy();
    invalidApprovalDate.records[0].approval.approvedAt = '2026-02-30T00:00:00Z';
    expect(() => compileFixture(invalidApprovalDate)).toThrow(/requires explicit approval/i);

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

  it('rejects new-article image paths with unsupported or mismatched extensions', () => {
    const articleManifest = (publicPath) => {
      const manifest = manifestCopy();
      const root = unitRoots.get(manifest);
      const id = `article-${publicPath.slice(publicPath.lastIndexOf('/') + 1).split('.')[1] ?? 'fixture'}`;
      const content = {
        title: 'Article fixture', summary: 'Article summary.',
        image: { src: publicPath, alt: 'Article fixture image.', width: 1, height: 1 },
        sections: [
          { key: 'problem', heading: 'The problem', nodes: [{ type: 'paragraph', children: [{ type: 'text', value: 'Problem.' }] }] },
          { key: 'built', heading: 'What I built', nodes: [{ type: 'paragraph', children: [{ type: 'text', value: 'Built.' }] }] },
          { key: 'outcome', heading: 'The outcome', nodes: [{ type: 'paragraph', children: [{ type: 'text', value: 'Outcome.' }] }] },
        ],
      };
      const summaryRef = `${id}.summary`;
      const outcomeRef = `${id}.outcome`;
      const claimApproval = (claimId, placement, value) => ({
        type: 'content', recordId: id, placement, value,
        approval: explicitApproval(digest({ id: claimId, type: 'content', recordId: id, placement, value })),
      });
      manifest.claims[summaryRef] = claimApproval(summaryRef, 'summary', content.summary);
      manifest.claims[outcomeRef] = claimApproval(outcomeRef, 'outcome', content.sections[2]);
      manifest.records.push({
        id, slug: id, status: 'published', variant: 'article', content,
        approval: explicitApproval(digest({ id, slug: id, content })),
        claimRefs: { summary: summaryRef, outcome: outcomeRef },
      });
      const file = `public${publicPath}`;
      writeFileSync(path.join(root, file), validFixturePng);
      manifest.assets[publicPath] = { file, width: 1, height: 1, format: 'png', approval: explicitApproval(digest(validFixturePng)) };
      return manifest;
    };

    expect(() => compileFixture(articleManifest('/assets/case-studies/format-probe.html'))).toThrow(/safe public case-study image path.*\.png.*\.jpg.*\.jpeg.*\.webp/i);
    expect(() => compileFixture(articleManifest('/assets/case-studies/format-probe.jpg'))).toThrow(/extension.*does not match its actual png format/i);
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
    for (const storyId of ['text-story-one', 'text-story-two']) {
      const articleHtml = readFileSync(path.join(dist, `project/${storyId}/index.html`), 'utf8');
      expect(articleHtml).toContain(`<h1>${storyId} title</h1>`);
      expect(articleHtml).toContain(`${storyId} outcome`);
      expect(articleHtml).toContain('href="/#portfolio"');
      expect(articleHtml).toContain('href="/contact/"');
    }

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

  it('prepares, stages, and builds two text stories with safe literal-dollar SEO and revisions', () => {
    const directory = buildFixture();
    cpSync('public/assets/case-studies', path.join(directory, 'public/assets/case-studies'), { recursive: true, force: true });
    const sourceOne = path.join(directory, 'story-one.md');
    const sourceTwo = path.join(directory, 'story-two.md');
    mkdirSync(path.join(directory, 'assets/text-story-one'), { recursive: true });
    writeFileSync(path.join(directory, 'assets/text-story-one/cover.png'), validFixturePng);
    writeFileSync(path.join(directory, 'assets/text-story-one/cover-revised.webp'), validFixtureWebp);
    const writeStory = (filePath, id, title, summary, outcome, image) => writeFileSync(filePath, `---\nid: ${id}\ntitle: "${title}"\nsummary: "${summary}"\n${image ? `image:\n  src: ${image}\n  alt: ${id} reviewed cover\n` : ''}---\n\n## The problem\n\nThe ${id} problem uses **bold** language.\n\n- First item\n- Second item\n\n## What I built\n\nI built a small workflow for the ${id} story.\n\n1. Prepare the input.\n2. Review the output.\n\n## The outcome\n\n${outcome}\n\n## Private notes\n\nPRIVATE_CASE_STUDY_SENTINEL and DRAFT_CASE_STUDY_SENTINEL\n`);
    writeStory(sourceOne, 'text-story-one', 'Text story $& one', "A summary with $' replacement markers.", "Outcome with $& and $' markers.", 'cover.png');
    writeStory(sourceTwo, 'text-story-two', 'Text story two', 'Second story summary.', 'Second story outcome.');

    runCaseStudyPrepare(directory, [sourceOne, sourceTwo]);
    const candidatePath = path.join(directory, '.case-study-preview/candidate.json');
    runCaseStudyStage(directory, candidatePath);
    const stagedAfterInitial = JSON.parse(readFileSync(path.join(directory, 'publication/staged-case-study-publication.js'), 'utf8').match(/= ([\s\S]*);\s*$/)[1]);
    const secondRecordBeforeRevision = structuredClone(stagedAfterInitial.records.find((record) => record.id === 'text-story-two'));
    runPublicationBuild(directory);
    const assertNoSentinels = () => {
      const output = Buffer.concat(outputFiles(path.join(directory, 'dist')).map((file) => readFileSync(file))).toString('utf8');
      expect(output).not.toContain('PRIVATE_CASE_STUDY_SENTINEL');
      expect(output).not.toContain('DRAFT_CASE_STUDY_SENTINEL');
    };
    assertNoSentinels();
    expect(outputFiles(path.join(directory, 'dist')).some((file) => /assets\/case-studies\/text-story-one-.*\.png$/.test(file))).toBe(true);
    const firstHtml = readFileSync(path.join(directory, 'dist/project/text-story-one/index.html'), 'utf8');
    expect(firstHtml).toContain('<h1>Text story $&amp; one</h1>');
    expect(firstHtml).toContain('content="Text story $&amp; one | AI Case Study - Vivek Patel"');
    expect(firstHtml).toContain("content=\"A summary with $' replacement markers.\"");
    expect(firstHtml).toContain('Outcome with $&amp; and $&#x27; markers.');
    expect(firstHtml).toContain('<ul>');
    expect(firstHtml).toContain('<ol>');
    expect(firstHtml).not.toContain('private');
    const secondBeforeRevision = readFileSync(path.join(directory, 'dist/project/text-story-two/index.html'), 'utf8');

    const staleDigest = digest(readFileSync(path.join(directory, '.case-study-preview/candidate.json')));
    const stagedBeforeInvalidRevision = readFileSync(path.join(directory, 'publication/staged-case-study-publication.js'), 'utf8');
    const candidateBeforeFailedBatch = readFileSync(path.join(directory, '.case-study-preview/candidate.json'), 'utf8');
    writeFileSync(sourceTwo, '---\nid: text-story-two\ntitle: Broken story\nsummary: Broken summary\n---\n\n## Missing heading\n\nThis batch is intentionally invalid.\n');
    expect(() => runCaseStudyPrepare(directory, [sourceOne, sourceTwo])).toThrow(/The problem|image|heading|required/i);
    expect(readFileSync(path.join(directory, '.case-study-preview/candidate.json'), 'utf8')).toBe(candidateBeforeFailedBatch);
    writeStory(sourceTwo, 'text-story-two', 'Text story two', 'Second story summary.', 'Second story outcome.');
    writeStory(sourceOne, 'text-story-one', 'Text story $& one revised', "A revised summary with $' markers.", "A revised outcome with $& and $' markers.", 'cover-revised.webp');
    runCaseStudyPrepare(directory, [sourceOne]);
    expect(() => runCaseStudyStageWithDigest(directory, candidatePath, staleDigest)).toThrow(/digest mismatch/i);
    expect(readFileSync(path.join(directory, 'publication/staged-case-study-publication.js'), 'utf8')).toBe(stagedBeforeInvalidRevision);
    runCaseStudyStage(directory, candidatePath);
    runPublicationBuild(directory);
    const revisedHtml = readFileSync(path.join(directory, 'dist/project/text-story-one/index.html'), 'utf8');
    expect(revisedHtml).toContain('<h1>Text story $&amp; one revised</h1>');
    expect(revisedHtml).toContain('A revised summary with $\' markers.');
    expect(revisedHtml).toContain('A revised outcome with $&amp; and $&#x27; markers.');
    expect(revisedHtml).toContain('<meta data-react-helmet="true" property="og:title" content="Text story $&amp; one revised | AI Case Study - Vivek Patel" />');
    expect(revisedHtml).toContain('<meta data-react-helmet="true" property="og:description" content="A revised summary with $\' markers." />');
    const revisedOgImage = revisedHtml.match(/<meta[^>]+property="og:image"[^>]+>/i)?.[0] ?? '';
    expect(revisedOgImage).toContain('https://www.vivekapatel.com/assets/case-studies/text-story-one-');
    expect(revisedOgImage).toMatch(/\.webp"/);
    expect(outputFiles(path.join(directory, 'dist')).some((file) => /assets\/case-studies\/text-story-one-.*\.webp$/.test(file))).toBe(true);
    expect(outputFiles(path.join(directory, 'dist')).some((file) => /assets\/case-studies\/text-story-one-.*\.png$/.test(file))).toBe(false);
    assertNoSentinels();
    expect(revisedHtml).not.toContain('A summary with $\' replacement markers.');
    const stagedAfterRevision = JSON.parse(readFileSync(path.join(directory, 'publication/staged-case-study-publication.js'), 'utf8').match(/= ([\s\S]*);\s*$/)[1]);
    expect(stagedAfterRevision.records.find((record) => record.id === 'text-story-two')).toEqual(secondRecordBeforeRevision);
    runAffectedTests(directory);
    const secondAfterRevision = readFileSync(path.join(directory, 'dist/project/text-story-two/index.html'), 'utf8');
    expect(secondAfterRevision).toContain('<h1>Text story two</h1>');
    expect(secondAfterRevision).toContain('Second story outcome.');
    expect(secondAfterRevision.replace(/index-[A-Za-z0-9_-]+\.js/g, 'index-HASH.js')).toBe(
      secondBeforeRevision.replace(/index-[A-Za-z0-9_-]+\.js/g, 'index-HASH.js'),
    );

    const entryBeforeWithdrawal = outputFiles(path.join(directory, 'dist')).find((file) => /\/assets\/index-[A-Za-z0-9_-]+\.js$/.test(file));
    expect(entryBeforeWithdrawal).toBeTruthy();
    const stagedBeforeWithdrawal = readFileSync(path.join(directory, 'publication/staged-case-study-publication.js'), 'utf8');
    expect(runCaseStudyWithdraw(directory, 'text-story-two')).toContain('text-story-two');
    const withdrawalOutput = readFileSync(path.join(directory, 'publication/staged-case-study-publication.js'), 'utf8');
    expect(withdrawalOutput).toContain('"id": "text-story-two"');
    expect(withdrawalOutput).toContain('"status": "draft"');
    expect(withdrawalOutput).not.toContain('Second story outcome.');
    expect(withdrawalOutput).toContain('text-story-one');
    expect(withdrawalOutput).not.toBe(stagedBeforeWithdrawal);
    runPublicationBuild(directory);
    expect(existsSync(path.join(directory, 'dist/project/text-story-two'))).toBe(false);
    expect(existsSync(path.join(directory, 'dist/project/text-story-one/index.html'))).toBe(true);
    expect(existsSync(entryBeforeWithdrawal)).toBe(false);
    assertNoSentinels();
    expect(readFileSync(path.join(directory, 'dist/.htaccess'), 'utf8')).toContain('RewriteRule ^project/(n8n-openai-data-extraction|invoice-ocr-extraction|yolo-computer-vision-optimization|text-story-one)/?$ index.html [L]');
    expect(readFileSync(path.join(directory, 'dist/sitemap.xml'), 'utf8')).not.toContain('/project/text-story-two/');
  }, 180_000);

  it('withdraws baseline identities through the CLI while retaining a genuinely shared public asset', () => {
    const directory = buildFixture();
    const sharedBytes = Buffer.from('UklGRiIAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEALAAAAAABAAgAAQUxQSDIAAA=', 'base64');
    const sharedPath = path.join(directory, 'public/assets/case-studies/shared-fixture.webp');
    writeFileSync(sharedPath, sharedBytes);
    const manifestPath = path.join(directory, 'publication/case-study-manifest.js');
    const sharedPublicPath = '/assets/case-studies/shared-fixture.webp';
    const sharedImage = { src: sharedPublicPath, alt: 'Shared synthetic fixture image.', width: 1, height: 1 };
    const sharedStory = (id) => ({
      id, slug: id, status: 'published', variant: 'article',
      content: {
        title: `${id} title`, summary: `${id} summary`, image: sharedImage,
        sections: [
          { key: 'problem', heading: 'The problem', nodes: [{ type: 'paragraph', children: [{ type: 'text', value: `${id} problem` }] }] },
          { key: 'built', heading: 'What I built', nodes: [{ type: 'paragraph', children: [{ type: 'text', value: `${id} build` }] }] },
          { key: 'outcome', heading: 'The outcome', nodes: [{ type: 'paragraph', children: [{ type: 'text', value: `${id} outcome` }] }] },
        ],
      },
      claimRefs: { summary: `${id}.summary`, outcome: `${id}.outcome` },
    });
    const sharedRecords = ['text-story-one', 'text-story-two'].map((id) => {
      const record = sharedStory(id);
      record.approval = explicitApproval(digest({ id, slug: id, content: record.content }));
      return record;
    });
    const sharedClaims = Object.fromEntries(sharedRecords.flatMap((record) => [
      [record.claimRefs.summary, { type: 'content', recordId: record.id, placement: 'summary', value: record.content.summary, approval: explicitApproval(digest({ id: record.claimRefs.summary, type: 'content', recordId: record.id, placement: 'summary', value: record.content.summary })) }],
      [record.claimRefs.outcome, { type: 'content', recordId: record.id, placement: 'outcome', value: record.content.sections[2], approval: explicitApproval(digest({ id: record.claimRefs.outcome, type: 'content', recordId: record.id, placement: 'outcome', value: record.content.sections[2] })) }],
    ]));
    const sharedBaseline = {
      schemaVersion: 1, claims: sharedClaims,
      assets: { [sharedPublicPath]: { file: 'public/assets/case-studies/shared-fixture.webp', width: 1, height: 1, format: 'webp', approval: explicitApproval(digest(sharedBytes)) } },
      records: sharedRecords,
    };
    writeFileSync(manifestPath, `import { stagedCaseStudyPublication } from './staged-case-study-publication.js';\nimport { mergeCaseStudyManifest } from './case-study-manifest-merge.js';\nexport const caseStudyPublicationBaseline = ${JSON.stringify(sharedBaseline)};\nexport const caseStudyPublicationManifest = mergeCaseStudyManifest(caseStudyPublicationBaseline, stagedCaseStudyPublication);\n`);

    runPublicationBuild(directory);
    expect(existsSync(path.join(directory, 'dist/project/text-story-one/index.html'))).toBe(true);
    expect(existsSync(path.join(directory, 'dist/project/text-story-two/index.html'))).toBe(true);
    expect(existsSync(path.join(directory, 'dist/assets/case-studies/shared-fixture.webp'))).toBe(true);

    expect(runCaseStudyWithdraw(directory, 'text-story-one')).toContain('text-story-one');
    runPublicationBuild(directory);
    expect(existsSync(path.join(directory, 'dist/project/text-story-one'))).toBe(false);
    expect(existsSync(path.join(directory, 'dist/project/text-story-two/index.html'))).toBe(true);
    expect(existsSync(path.join(directory, 'dist/assets/case-studies/shared-fixture.webp'))).toBe(true);
    expect(readFileSync(path.join(directory, 'dist/.htaccess'), 'utf8')).toContain('RewriteRule ^project/(text-story-two)/?$ index.html [L]');

    expect(runCaseStudyWithdraw(directory, 'text-story-two')).toContain('text-story-two');
    runPublicationBuild(directory);
    runAffectedTests(directory);
    expect(existsSync(path.join(directory, 'dist/project'))).toBe(false);
    expect(existsSync(path.join(directory, 'dist/assets/case-studies/shared-fixture.webp'))).toBe(false);
    expect(readFileSync(path.join(directory, 'dist/.htaccess'), 'utf8')).toContain('RewriteRule ^project/ - [R=404,L]');
    expect(readFileSync(path.join(directory, 'dist/sitemap.xml'), 'utf8')).not.toContain('/project/');
  }, 180_000);
});
