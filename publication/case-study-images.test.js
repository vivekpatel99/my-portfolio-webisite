// @vitest-environment node
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { digest } from './case-study-evidence.js';
import { mergeCaseStudyManifest } from './case-study-manifest-merge.js';
import { compileCaseStudyPublication } from './compile-case-studies.js';
import { prepareMarkdownCaseStudies } from './markdown-case-study.js';
import { stageReviewedCaseStudyCandidate } from './stage-case-study-publication.js';

const directories = [];
afterEach(() => directories.splice(0).forEach((directory) => rmSync(directory, { recursive: true, force: true })));

const fixtureBytes = {
  png: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'),
  jpg: Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAH/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAEFAqf/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAEDAQE/AYf/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAECAQE/AYf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAY/Aqf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAE/IYf/2gAMAwEAAgADAAAAEP/EABQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQMBAT8QH//EABQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQIBAT8QH//EABQQAQAAAAAAAAAAAAAAAAAAABD/2gAIAQEAAT8QH//Z', 'base64'),
  webp: Buffer.from('UklGRiIAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEALAAAAAABAAgAAQUxQSDIAAA=', 'base64'),
};

describe('case-study screenshot publication', () => {
  it('prepares, stages, and compiles PNG, JPEG, and WebP referenced assets only', async () => {
    const root = mkdtempSync(path.join(realpathSync(tmpdir()), 'case-study-images-')); directories.push(root);
    const assetsRoot = path.join(root, 'source-assets', 'image-fixture'); mkdirSync(assetsRoot, { recursive: true });
    for (const [extension, bytes] of Object.entries(fixtureBytes)) writeFileSync(path.join(assetsRoot, `referenced.${extension}`), bytes);
    writeFileSync(path.join(assetsRoot, 'unreferenced.png'), fixtureBytes.png);
    const sourcePath = path.join(root, 'image-fixture.md');
    writeFileSync(sourcePath, `---\nid: image-fixture\ntitle: Image fixture\nsummary: Three image formats.\nimage:\n  src: referenced.png\n  alt: Wide workflow\n  caption: Reviewed cover\n---\n## The problem\nA problem.\n## What I built\n![Document](referenced.jpg)\n![Browser](referenced.webp)\n## The outcome\nAn outcome.\n`);
    const preview = path.join(root, '.case-study-preview');
    const prepared = prepareMarkdownCaseStudies({ sourceFiles: [sourcePath], outputDirectory: preview, assetsRoot });
    expect(Object.keys(prepared.assets)).toHaveLength(3);
    expect(prepared.stories[0].image.width).toBe(1);
    const stagedPath = path.join(root, 'publication', 'staged-case-study-publication.js');
    mkdirSync(path.dirname(stagedPath), { recursive: true }); mkdirSync(path.join(root, 'public/assets/case-studies'), { recursive: true });
    writeFileSync(stagedPath, 'export const stagedCaseStudyPublication = {"records":[],"claims":{},"assets":{}};\n');
    writeFileSync(path.join(root, 'publication/case-study-manifest.js'), 'export const caseStudyPublicationBaseline = {schemaVersion:1,records:[],claims:{},assets:{}};\n');
    const metadata = { candidateSha256: digest(readFileSync(prepared.candidatePath)), approvedBy: 'Fixture', approvedAt: '2026-09-09T00:00:00Z', evidence: 'https://example.invalid/cs04' };
    await stageReviewedCaseStudyCandidate({ candidatePath: prepared.candidatePath, stagedPath, metadata });
    const staged = JSON.parse(readFileSync(stagedPath, 'utf8').match(/= ([\s\S]*);\s*$/)[1]);
    expect(Object.keys(staged.assets)).toHaveLength(3);
    for (const publicPath of Object.keys(staged.assets)) expect(existsSync(path.join(root, staged.assets[publicPath].file))).toBe(true);
    expect(existsSync(path.join(root, 'public/assets/case-studies/unreferenced.png'))).toBe(false);
    const manifest = mergeCaseStudyManifest({ schemaVersion: 1, records: [], claims: {}, assets: {} }, staged);
    const publication = compileCaseStudyPublication({ manifest, root });
    expect(publication[0].sections[1].nodes[0].children[0].src).toMatch(/\.jpg$/);
  });

  it('rejects a changed frozen snapshot and stale caption approval before replacing the store', async () => {
    const root = mkdtempSync(path.join(realpathSync(tmpdir()), 'case-study-images-stale-')); directories.push(root);
    const assetsRoot = path.join(root, 'assets', 'story'); mkdirSync(assetsRoot, { recursive: true }); writeFileSync(path.join(assetsRoot, 'cover.png'), fixtureBytes.png);
    const sourcePath = path.join(root, 'story.md'); writeFileSync(sourcePath, `---\nid: stale-image\ntitle: Stale image\nsummary: Summary\nimage:\n  src: cover.png\n  alt: Cover\n  caption: First\n---\n## The problem\nProblem\n## What I built\nBuild\n## The outcome\nOutcome\n`);
    const preview = path.join(root, '.case-study-preview'); const prepared = prepareMarkdownCaseStudies({ sourceFiles: [sourcePath], outputDirectory: preview, assetsRoot });
    const stagedPath = path.join(root, 'publication/staged-case-study-publication.js'); mkdirSync(path.dirname(stagedPath), { recursive: true }); mkdirSync(path.join(root, 'public/assets/case-studies'), { recursive: true }); writeFileSync(stagedPath, 'export const stagedCaseStudyPublication = {"records":[],"claims":{},"assets":{}};\n'); writeFileSync(path.join(root, 'publication/case-study-manifest.js'), 'export const caseStudyPublicationBaseline = {schemaVersion:1,records:[],claims:{},assets:{}};\n');
    const metadata = { candidateSha256: digest(readFileSync(prepared.candidatePath)), approvedBy: 'Fixture', approvedAt: '2026-09-09T00:00:00Z', evidence: 'https://example.invalid/cs04' };
    const asset = Object.values(prepared.assets)[0]; writeFileSync(path.join(preview, asset.source), Buffer.concat([fixtureBytes.png, Buffer.from('changed')]));
    await expect(stageReviewedCaseStudyCandidate({ candidatePath: prepared.candidatePath, stagedPath, metadata })).rejects.toThrow(/changed without approval/i);
    expect(readFileSync(stagedPath, 'utf8')).toContain('"records":[]');
    writeFileSync(path.join(preview, asset.source), fixtureBytes.png);
    const revisedCandidate = JSON.parse(readFileSync(prepared.candidatePath, 'utf8')); revisedCandidate.stories[0].image.caption = 'Second'; writeFileSync(prepared.candidatePath, JSON.stringify(revisedCandidate));
    await expect(stageReviewedCaseStudyCandidate({ candidatePath: prepared.candidatePath, stagedPath, metadata })).rejects.toThrow(/digest mismatch/i);
  });

  it.each([
    ['traversal', '../outside.png', 'Cover'],
    ['external', 'https://example.invalid/cover.png', 'Cover'],
    ['empty alt', 'cover.png', ''],
    ['unsupported format', 'cover.svg', 'Cover'],
  ])('rejects %s image input before replacing the candidate', (label, src, alt) => {
    const root = mkdtempSync(path.join(realpathSync(tmpdir()), `case-study-images-${label.replace(/\s/g, '-')}-`)); directories.push(root);
    const assetsRoot = path.join(root, 'assets', 'story'); mkdirSync(assetsRoot, { recursive: true }); writeFileSync(path.join(assetsRoot, 'cover.png'), fixtureBytes.png); writeFileSync(path.join(assetsRoot, 'cover.svg'), '<svg/>');
    const sourcePath = path.join(root, 'story.md'); const outputDirectory = path.join(root, '.case-study-preview');
    const valid = `---\nid: invalid-image\ntitle: Invalid\nsummary: Summary\n---\n## The problem\nProblem\n## What I built\nBuild\n## The outcome\nOutcome\n`;
    writeFileSync(sourcePath, `---\nid: invalid-image\ntitle: Invalid\nsummary: Summary\nimage:\n  src: ${src}\n  alt: ${alt}\n---\n## The problem\nProblem\n## What I built\nBuild\n## The outcome\nOutcome\n`);
    writeFileSync(path.join(root, 'outside.png'), fixtureBytes.png); mkdirSync(outputDirectory, { recursive: true }); writeFileSync(path.join(outputDirectory, 'candidate.json'), valid);
    expect(() => prepareMarkdownCaseStudies({ sourceFiles: [sourcePath], outputDirectory, assetsRoot })).toThrow(/image|source/i);
    expect(readFileSync(path.join(outputDirectory, 'candidate.json'), 'utf8')).toBe(valid);
  });

  it('rejects a symlink escaping the source asset root atomically', () => {
    const root = mkdtempSync(path.join(realpathSync(tmpdir()), 'case-study-images-symlink-')); directories.push(root);
    const assetsRoot = path.join(root, 'assets', 'story'); mkdirSync(assetsRoot, { recursive: true }); writeFileSync(path.join(root, 'outside.png'), fixtureBytes.png); symlinkSync(path.join(root, 'outside.png'), path.join(assetsRoot, 'link.png'));
    const sourcePath = path.join(root, 'story.md'); const outputDirectory = path.join(root, '.case-study-preview'); mkdirSync(outputDirectory, { recursive: true }); const prior = 'prior candidate'; writeFileSync(path.join(outputDirectory, 'candidate.json'), prior);
    writeFileSync(sourcePath, `---\nid: symlink-image\ntitle: Symlink\nsummary: Summary\nimage:\n  src: link.png\n  alt: Escaping link\n---\n## The problem\nProblem\n## What I built\nBuild\n## The outcome\nOutcome\n`);
    expect(() => prepareMarkdownCaseStudies({ sourceFiles: [sourcePath], outputDirectory, assetsRoot })).toThrow(/escapes/i);
    expect(readFileSync(path.join(outputDirectory, 'candidate.json'), 'utf8')).toBe(prior);
  });
});
