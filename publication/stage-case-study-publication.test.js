// @vitest-environment node
import { digest } from './case-study-evidence.js';
import { stageReviewedCaseStudyCandidate, withdrawStagedCaseStudy } from './stage-case-study-publication.js';
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const directories = [];
afterEach(() => directories.splice(0).forEach((directory) => rmSync(directory, { recursive: true, force: true })));

const story = (id, slug = id) => ({
  id, slug, title: `${id} title`, summary: `${id} summary`, projectStatus: 'completed', completedAt: '2026-08',
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
const validPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');
// A valid, silent AAC-only MP4 has no video stream to publish in a gallery.
const audioOnlyMp4 = Buffer.from('AAAAHGZ0eXBpc29tAAACAGlzb21pc28ybXA0MQAAAAhmcmVlAAAAH21kYXTcAExhdmM2My4xLjEwMgACMEAOARggBwAAAxZtb292AAAAbG12aGQAAAAAAAAAAAAAAAAAAB9AAAAAUAABAAABAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAACQXRyYWsAAABcdGtoZAAAAAMAAAAAAAAAAAAAAAEAAAAAAAAAUAAAAAAAAAAAAAAAAQEAAAAAAQAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAACRlZHRzAAAAHGVsc3QAAAAAAAAAAQAAAFAAAAQAAAEAAAAAAbltZGlhAAAAIG1kaGQAAAAAAAAAAAAAAAAAAB9AAAAEUFXEAAAAAAAtaGRscgAAAAAAAAAAc291bgAAAAAAAAAAAAAAAFNvdW5kSGFuZGxlcgAAAAFkbWluZgAAABBzbWhkAAAAAAAAAAAAAAAkZGluZgAAABxkcmVmAAAAAAAAAAEAAAAMdXJsIAAAAAEAAAEoc3RibAAAAH5zdHNkAAAAAAAAAAEAAABubXA0YQAAAAAAAAABAAAAAAAAAAAAAQAQAAAAAB9AAAAAAAA2ZXNkcwAAAAADgICAJQABAASAgIAXQBUAAAAAALuAAAAFNQWAgIAFFYhW5QAGgICAAQIAAAAUYnRydAAAAAAAALuAAAAFNQAAACBzdHRzAAAAAAAAAAIAAAABAAAEAAAAAAEAAABQAAAAHHN0c2MAAAAAAAAAAQAAAAEAAAACAAAAAQAAABxzdHN6AAAAAAAAAAAAAAACAAAAEwAAAAQAAAAUc3RjbwAAAAAAAAABAAAALAAAABpzZ3BkAQAAAHJvbGwAAAACAAAAAf//AAAAHHNiZ3AAAAAAcm9sbAAAAAEAAAACAAAAAQAAAGF1ZHRhAAAAWW1ldGEAAAAAAAAAIWhkbHIAAAAAAAAAAG1kaXJhcHBsAAAAAAAAAAAAAAAALGlsc3QAAAAkqXRvbwAAABxkYXRhAAAAAQAAAABMYXZmNjMuMS4xMDI=', 'base64');

describe('reviewed case-study staging', () => {
  const galleryFixture = () => {
    const media = [
      { src: '/assets/case-studies/stage-video.mp4', poster: '/assets/case-studies/stage-poster.png', alt: 'Reviewed tracking demonstration.', caption: 'Supplied demonstration, not a project benchmark.', width: 640, height: 360 },
      { src: '/assets/case-studies/stage-chart.png', alt: 'Reviewed detector chart.', caption: 'Detector evaluation only.', width: 1, height: 1 },
    ];
    const candidateStory = { ...story('gallery-story'), gallery: media };
    const fixture = setup([candidateStory]);
    const publicationDirectory = path.join(fixture.directory, 'publication');
    mkdirSync(publicationDirectory);
    const stagedPath = path.join(publicationDirectory, 'staged-case-study-publication.js');
    writeFileSync(stagedPath, readFileSync(fixture.stagedPath));
    writeFileSync(path.join(publicationDirectory, 'case-study-manifest.js'), readFileSync(path.join(fixture.directory, 'case-study-manifest.js')));
    const video = readFileSync(path.join(process.cwd(), 'public/assets/case-studies/sports-football-tracking.mp4'));
    mkdirSync(path.join(fixture.directory, 'assets'));
    const assets = {};
    for (const [publicPath, bytes, format, width, height] of [
      [media[0].src, video, 'mp4', 640, 360],
      [media[0].poster, validPng, 'png', 1, 1],
      [media[1].src, validPng, 'png', 1, 1],
    ]) {
      const source = `assets/${path.basename(publicPath)}`;
      writeFileSync(path.join(fixture.directory, source), bytes);
      assets[publicPath] = { source, sha256: digest(bytes), width, height, format };
    }
    writeFileSync(fixture.candidatePath, JSON.stringify({ schemaVersion: 1, stories: [candidateStory], assets }));
    return { ...fixture, stagedPath, media, candidateStory, assets };
  };

  it('stages a reviewed article gallery without losing video, poster, captions or asset approvals', async () => {
    const fixture = galleryFixture();
    await stageReviewedCaseStudyCandidate({ ...fixture, metadata: metadata(fixture.candidatePath) });
    const store = JSON.parse(readFileSync(fixture.stagedPath, 'utf8').match(/= ([\s\S]*);\s*$/)[1]);
    expect(store.records[0].content.gallery).toEqual(fixture.media);
    const { compileCaseStudyPublication } = await import('./compile-case-studies.js');
    const published = compileCaseStudyPublication({ manifest: { schemaVersion: 1, ...store }, root: fixture.directory });
    expect(published[0].gallery).toEqual(fixture.media);
    expect(store.assets[fixture.media[0].src].approval.sha256).toBe(fixture.assets[fixture.media[0].src].sha256);
    const stagedVideo = readFileSync(path.join(fixture.directory, 'public' + fixture.media[0].src));
    const reviewedVideo = readFileSync(path.join(fixture.directory, fixture.assets[fixture.media[0].src].source));
    expect(stagedVideo.equals(reviewedVideo)).toBe(true);
  });

  it.each([
    ['missing poster', candidate => { delete candidate.stories[0].gallery[0].poster; }, /image poster/],
    ['remote video', candidate => { candidate.stories[0].gallery[0].src = 'https://example.invalid/video.mp4'; }, /safe public case-study MP4 path/],
    ['unsupported gallery field', candidate => { candidate.stories[0].gallery[0].secret = 'private'; }, /unsupported fields/],
    ['changed video hash', candidate => { candidate.assets['/assets/case-studies/stage-video.mp4'].sha256 = '0'.repeat(64); }, /bytes changed without approval/],
    ['invalid MP4 format', candidate => { candidate.assets['/assets/case-studies/stage-video.mp4'].format = 'png'; }, /valid MP4 snapshot/],
  ])('rejects %s without changing staged publication', async (_, mutate, expected) => {
    const fixture = galleryFixture();
    const before = readFileSync(fixture.stagedPath, 'utf8');
    const candidate = JSON.parse(readFileSync(fixture.candidatePath, 'utf8'));
    mutate(candidate);
    writeFileSync(fixture.candidatePath, JSON.stringify(candidate));
    await expect(stageReviewedCaseStudyCandidate({ ...fixture, metadata: metadata(fixture.candidatePath) })).rejects.toThrow(expected);
    expect(readFileSync(fixture.stagedPath, 'utf8')).toBe(before);
  });

  const replaceVideoSnapshot = (candidate, fixture, bytes) => {
    const asset = candidate.assets[fixture.media[0].src];
    writeFileSync(path.join(fixture.directory, asset.source), bytes);
    asset.sha256 = digest(bytes);
  };
  const publicAssetSnapshot = (directory) => Object.fromEntries(readdirSync(directory).sort().map((name) => [name, digest(readFileSync(path.join(directory, name)))]));

  it.each([
    ['ftyp-only content with its truthful approved hash', (candidate, fixture) => {
      replaceVideoSnapshot(candidate, fixture, Buffer.from('000000186674797069736f6d0000000069736f6d6d703432', 'hex'));
    }, /valid MP4 snapshot/],
    ['audio-only content with its truthful approved hash', (candidate, fixture) => {
      replaceVideoSnapshot(candidate, fixture, audioOnlyMp4);
    }, /video stream/],
    ['source dimensions that disagree with the real video', candidate => {
      candidate.assets['/assets/case-studies/stage-video.mp4'].width = 641;
    }, /MP4 dimensions changed without approval/],
    ['gallery dimensions that disagree with the real video', candidate => {
      candidate.stories[0].gallery[0].width = 641;
    }, /gallery video dimensions/],
    ['a second story with conflicting dimensions for the same video', candidate => {
      candidate.stories.push({ ...story('second-gallery-story'), gallery: [{ ...candidate.stories[0].gallery[0], height: 361 }] });
    }, /gallery video dimensions.*second-gallery-story/],
  ])('rejects reviewed MP4 %s before changing staged bytes or public assets', async (_, mutate, expected) => {
    const fixture = galleryFixture();
    const publicDirectory = path.join(fixture.directory, 'public/assets/case-studies');
    writeFileSync(path.join(publicDirectory, 'retained.png'), validPng);
    const stagedBefore = readFileSync(fixture.stagedPath);
    const publicBefore = publicAssetSnapshot(publicDirectory);
    const candidate = JSON.parse(readFileSync(fixture.candidatePath, 'utf8'));
    mutate(candidate, fixture);
    writeFileSync(fixture.candidatePath, JSON.stringify(candidate));
    await expect(stageReviewedCaseStudyCandidate({ ...fixture, metadata: metadata(fixture.candidatePath) })).rejects.toThrow(expected);
    expect(readFileSync(fixture.stagedPath).equals(stagedBefore)).toBe(true);
    expect(publicAssetSnapshot(publicDirectory)).toEqual(publicBefore);
  });

  it('rejects a calendar-invalid approval timestamp before changing staged bytes', async () => {
    const fixture = setup([story('first-story')]);
    const before = readFileSync(fixture.stagedPath, 'utf8');
    await expect(stageReviewedCaseStudyCandidate({
      ...fixture,
      metadata: { ...metadata(fixture.candidatePath), approvedAt: '2026-02-30T00:00:00Z' },
    })).rejects.toThrow(/real ISO UTC timestamp/i);
    expect(readFileSync(fixture.stagedPath, 'utf8')).toBe(before);
  });

  it.each(['https://:', 'https://user@example.invalid/review', 'http://example.invalid/review'])(
    'rejects invalid approval evidence URL %s before changing staged bytes',
    async (evidence) => {
      const fixture = setup([story('first-story')]);
      const before = readFileSync(fixture.stagedPath, 'utf8');
      await expect(stageReviewedCaseStudyCandidate({
        ...fixture,
        metadata: { ...metadata(fixture.candidatePath), evidence },
      })).rejects.toThrow(/HTTPS --evidence URL/i);
      expect(readFileSync(fixture.stagedPath, 'utf8')).toBe(before);
    },
  );

  it('stages article records mechanically and rejects a stale slug without changing bytes', async () => {
    const fixture = setup([story('first-story')]);
    await stageReviewedCaseStudyCandidate({ ...fixture, metadata: metadata(fixture.candidatePath) });
    const staged = JSON.parse(readFileSync(fixture.stagedPath, 'utf8').match(/= ([\s\S]*);\s*$/)[1]);
    expect(staged.records[0].content.projectStatus).toBe('completed');
    expect(staged.records[0].content.completedAt).toBe('2026-08');
    expect(staged.records[0].approval.sha256).toBe(digest({
      id: staged.records[0].id,
      slug: staged.records[0].slug,
      content: staged.records[0].content,
    }));
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

  it('rejects unsupported and mismatched new-article image extensions before changing the staged store', async () => {
    const stageImage = async (publicPath) => {
      const fixture = setup([{
        ...story('image-story'),
        image: { src: publicPath, alt: 'Fixture image.', width: 1, height: 1 },
      }]);
      const snapshotSource = 'assets/fixture.png';
      mkdirSync(path.join(fixture.directory, 'assets'), { recursive: true });
      writeFileSync(path.join(fixture.directory, snapshotSource), validPng);
      writeFileSync(fixture.candidatePath, JSON.stringify({ schemaVersion: 1, stories: [{
        ...story('image-story'),
        image: { src: publicPath, alt: 'Fixture image.', width: 1, height: 1 },
      }], assets: {
        [publicPath]: { source: snapshotSource, sha256: digest(validPng), width: 1, height: 1, format: 'png' },
      }}));
      const before = readFileSync(fixture.stagedPath, 'utf8');
      await expect(stageReviewedCaseStudyCandidate({ ...fixture, metadata: metadata(fixture.candidatePath) })).rejects.toThrow(
        publicPath.endsWith('.html') ? /safe public case-study image path/i : /extension does not match its actual png format/i,
      );
      expect(readFileSync(fixture.stagedPath, 'utf8')).toBe(before);
    };
    await stageImage('/assets/case-studies/format-probe.html');
    await stageImage('/assets/case-studies/format-probe.jpg');
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

  it('withdraws one selected identity with a draft tombstone and preserves unrelated order and claims', async () => {
    const fixture = setup([story('first-story'), story('second-story')]);
    await stageReviewedCaseStudyCandidate({ ...fixture, metadata: metadata(fixture.candidatePath) });
    const before = JSON.parse(readFileSync(fixture.stagedPath, 'utf8').match(/= ([\s\S]*);\s*$/)[1]);
    const result = await withdrawStagedCaseStudy({ id: 'first-story', stagedPath: fixture.stagedPath });
    expect(result).toMatchObject({ id: 'first-story', slug: 'first-story', changed: true });
    const afterSource = readFileSync(fixture.stagedPath, 'utf8');
    const after = JSON.parse(afterSource.match(/= ([\s\S]*);\s*$/)[1]);
    expect(after.records).toEqual([
      { id: 'first-story', slug: 'first-story', status: 'draft' },
      before.records[1],
    ]);
    expect(Object.keys(after.claims)).not.toContain('first-story.summary');
    expect(after.claims['second-story.summary']).toEqual(before.claims['second-story.summary']);
    const unchanged = afterSource;
    await withdrawStagedCaseStudy({ id: 'first-story', stagedPath: fixture.stagedPath });
    expect(readFileSync(fixture.stagedPath, 'utf8')).toBe(unchanged);
  });

  it('rejects an unknown withdrawal without changing staged bytes', async () => {
    const fixture = setup([story('known-story')]);
    await stageReviewedCaseStudyCandidate({ ...fixture, metadata: metadata(fixture.candidatePath) });
    const before = readFileSync(fixture.stagedPath, 'utf8');
    await expect(withdrawStagedCaseStudy({ id: 'missing-story', stagedPath: fixture.stagedPath })).rejects.toThrow(/unknown.*missing-story/i);
    expect(readFileSync(fixture.stagedPath, 'utf8')).toBe(before);
  });

  it('writes an explicit tombstone for a baseline identity even when the candidate omits it', async () => {
    const fixture = setup([], [{ id: 'baseline-story', slug: 'baseline-story', status: 'draft' }]);
    const before = readFileSync(fixture.stagedPath, 'utf8');
    await withdrawStagedCaseStudy({ id: 'baseline-story', stagedPath: fixture.stagedPath });
    const after = JSON.parse(readFileSync(fixture.stagedPath, 'utf8').match(/= ([\s\S]*);\s*$/)[1]);
    expect(after.records).toEqual([{ id: 'baseline-story', slug: 'baseline-story', status: 'draft' }]);
    expect(readFileSync(fixture.stagedPath, 'utf8')).not.toBe(before);
  });
});
