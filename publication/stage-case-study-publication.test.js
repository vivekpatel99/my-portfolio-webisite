// @vitest-environment node
import { digest } from './case-study-evidence.js';
import { stageReviewedCaseStudyCandidate } from './stage-case-study-publication.js';
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const directories = [];
afterEach(() => directories.splice(0).forEach((directory) => rmSync(directory, { recursive: true, force: true })));

const story = (id, slug = id) => ({
  id, slug, title: `${id} title`, summary: `${id} summary`,
  sections: [
    { key: 'problem', heading: 'The problem', nodes: [{ type: 'paragraph', children: [{ type: 'text', value: `${id} problem` }] }] },
    { key: 'built', heading: 'What I built', nodes: [{ type: 'paragraph', children: [{ type: 'text', value: `${id} build` }] }] },
    { key: 'outcome', heading: 'The outcome', nodes: [{ type: 'paragraph', children: [{ type: 'text', value: `${id} outcome` }] }] },
  ],
});

const setup = (stories = [], baselineRecords = []) => {
  mkdirSync(path.join(process.cwd(), '.case-study-preview'), { recursive: true });
  const directory = mkdtempSync(path.join(process.cwd(), '.case-study-preview', 'stage-test-'));
  directories.push(directory);
  mkdirSync(path.join(directory, 'public/assets/case-studies'), { recursive: true });
  const stagedPath = path.join(directory, 'staged-case-study-publication.js');
  writeFileSync(stagedPath, 'export const stagedCaseStudyPublication = { "records": [], "claims": {} };\n');
  writeFileSync(path.join(directory, 'case-study-manifest.js'), `export const caseStudyPublicationBaseline = ${JSON.stringify({ schemaVersion: 1, claims: {}, assets: {}, records: baselineRecords })};\n`);
  const candidatePath = path.join(directory, 'candidate.json');
  writeFileSync(candidatePath, JSON.stringify({ schemaVersion: 1, stories }));
  return { directory, stagedPath, candidatePath };
};

const metadata = (candidatePath) => ({
  candidateSha256: digest(readFileSync(candidatePath)), approvedBy: 'Fixture', approvedAt: '2026-09-09T00:00:00Z', evidence: 'https://example.invalid/review',
});

describe('reviewed case-study staging', () => {
  it('stages article records mechanically and rejects a stale slug without changing bytes', async () => {
    const fixture = setup([story('first-story')]);
    await stageReviewedCaseStudyCandidate({ ...fixture, metadata: metadata(fixture.candidatePath) });
    const before = readFileSync(fixture.stagedPath, 'utf8');
    writeFileSync(fixture.candidatePath, JSON.stringify({ schemaVersion: 1, stories: [story('first-story', 'renamed-story')] }));
    await expect(stageReviewedCaseStudyCandidate({ ...fixture, metadata: metadata(fixture.candidatePath) })).rejects.toThrow(/preserve.*slug/i);
    expect(readFileSync(fixture.stagedPath, 'utf8')).toBe(before);
  });

  it('keeps repeated staging deterministic and preserves unrelated record order', async () => {
    const fixture = setup([story('first-story'), story('second-story')]);
    await stageReviewedCaseStudyCandidate({ ...fixture, metadata: metadata(fixture.candidatePath) });
    const firstCandidate = story('first-story');
    firstCandidate.title = 'first-story revised title';
    writeFileSync(fixture.candidatePath, JSON.stringify({ schemaVersion: 1, stories: [firstCandidate] }));
    const revisedMetadata = metadata(fixture.candidatePath);
    await stageReviewedCaseStudyCandidate({ ...fixture, metadata: revisedMetadata });
    const afterRevision = readFileSync(fixture.stagedPath, 'utf8');
    await stageReviewedCaseStudyCandidate({ ...fixture, metadata: revisedMetadata });
    expect(readFileSync(fixture.stagedPath, 'utf8')).toBe(afterRevision);
    expect(JSON.parse(afterRevision.match(/= ([\s\S]*);\s*$/)[1]).records.map((record) => record.id)).toEqual(['first-story', 'second-story']);
  });

  it('rejects a candidate whose bytes changed after the reviewed digest was recorded', async () => {
    const fixture = setup([story('first-story')]);
    const reviewedMetadata = metadata(fixture.candidatePath);
    writeFileSync(fixture.candidatePath, JSON.stringify({ schemaVersion: 1, stories: [story('first-story', 'first-story-v2')] }));
    await expect(stageReviewedCaseStudyCandidate({ ...fixture, metadata: reviewedMetadata })).rejects.toThrow(/digest mismatch/i);
    expect(readFileSync(fixture.stagedPath, 'utf8')).toContain('records": []');
  });

  it('rejects a slug collision with an unrelated staged identity before replacement', async () => {
    const fixture = setup([story('first-story')]);
    await stageReviewedCaseStudyCandidate({ ...fixture, metadata: metadata(fixture.candidatePath) });
    const before = readFileSync(fixture.stagedPath, 'utf8');
    writeFileSync(fixture.candidatePath, JSON.stringify({ schemaVersion: 1, stories: [story('second-story', 'first-story')] }));
    await expect(stageReviewedCaseStudyCandidate({ ...fixture, metadata: metadata(fixture.candidatePath) })).rejects.toThrow(/slug owned/i);
    expect(readFileSync(fixture.stagedPath, 'utf8')).toBe(before);
  });

  it('preserves a legacy replacement slot and rejects a legacy slug rename', async () => {
    const fixture = setup([], [{ id: 'legacy-story', slug: 'legacy-story', status: 'draft' }]);
    writeFileSync(fixture.candidatePath, JSON.stringify({ schemaVersion: 1, stories: [story('legacy-story')] }));
    await stageReviewedCaseStudyCandidate({ ...fixture, metadata: metadata(fixture.candidatePath) });
    const staged = JSON.parse(readFileSync(fixture.stagedPath, 'utf8').match(/= ([\s\S]*);\s*$/)[1]);
    expect(staged.records.map((record) => [record.id, record.slug])).toEqual([['legacy-story', 'legacy-story']]);

    const before = readFileSync(fixture.stagedPath, 'utf8');
    writeFileSync(fixture.candidatePath, JSON.stringify({ schemaVersion: 1, stories: [story('legacy-story', 'renamed-legacy')] }));
    await expect(stageReviewedCaseStudyCandidate({ ...fixture, metadata: metadata(fixture.candidatePath) })).rejects.toThrow(/preserve.*slug/i);
    expect(readFileSync(fixture.stagedPath, 'utf8')).toBe(before);
  });

  it('rejects duplicate raw staged identities before indexing or writing', async () => {
    const fixture = setup();
    writeFileSync(fixture.stagedPath, `export const stagedCaseStudyPublication = ${JSON.stringify({ records: [
      { id: 'duplicate', slug: 'duplicate' }, { id: 'duplicate', slug: 'duplicate-two' },
    ], claims: {} })};\n`);
    writeFileSync(fixture.candidatePath, JSON.stringify({ schemaVersion: 1, stories: [story('new-story')] }));
    const before = readFileSync(fixture.stagedPath, 'utf8');
    await expect(stageReviewedCaseStudyCandidate({ ...fixture, metadata: metadata(fixture.candidatePath) })).rejects.toThrow(/duplicate/i);
    expect(readFileSync(fixture.stagedPath, 'utf8')).toBe(before);
  });
});
