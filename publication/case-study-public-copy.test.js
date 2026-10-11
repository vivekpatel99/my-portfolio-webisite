// @vitest-environment node
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { collectGalleryImages } from '../src/components/CaseStudyGallery.js';
import { containsCaseStudyCopyLeak } from '../tests/case-study-copy.js';
import { digest } from './case-study-evidence.js';
import { caseStudyPublicationManifest } from './case-study-manifest.js';
import { compileCaseStudyPublication, repositoryRoot } from './compile-case-studies.js';

const oldDepthDiagram = '6f27eac0ad723f3f4efd36a0ad81d7893a8410409f1cb841d61cc39c6c0f436e';
const depthWebcamStill = '6cff31a07362f0483bf43298af0366ffb4c8f40137291202506a8924b0d24957';
const trackingVideo = '8cbcc66d4354a1e2e019c5724710e35d39a70e3dfdd2613f9912eca7e4f4cef3';
const otherFootballClip = 'e8f90196e5e6edcef0ad11eefb8739f8c16b936217ea84109c33fe4ca7b12369';
const f1ChartDigests = [
  '17675c81b372e6fb4505c19e5fe2d22c3eefdacc34b1ad9c4d12c6ca24edf0dc',
  '4422c54ac53200d0a5e3e529709980779fb42c5c87ba182435157745b60d9b95',
];
const confusionMatrixDigests = [
  'd039a81022e6edc6b245623ac0ecb71f16b1cc0fcbb37e9532e85ba4b1b966be',
  '9cc6ca9b6368f9c1c0203c352d73a18f1fc19d0be2e5561544ce09679687a2e1',
];
const removedN8nDigests = [
  'b11f57c86cd2e19c810cc72df7925d1ac3a65c0aabfcdf29a7298f78c5b6dc82',
  '7e992ce1c04c997787f1eb7790f0bc04e59ad3403e5f8c5e227b4d594db7829b',
  '3b3acaaa3beaef9b7c4e2c33ac9ff98b294a28be75d13abbac29af3292599b66',
  'ef68f8fb2060291419713daf3c385f923333fbe87869f5828ada20ba68d3f338',
  'f36fee637d46a13baffb79337b87cb4ac1f7a1a6d29a330be71e4217a1633275',
  'c69906586afbf78dadaadc2e23461c8427034f20808a862cd681cff7189521f9',
  'e542384f4f7532d230440cb9a68e0e7e66d951996959221225633fc5304b08b7',
];
const invoiceCaptionsByDigest = {
  f36fee637d46a13baffb79337b87cb4ac1f7a1a6d29a330be71e4217a1633275: 'Earlier invoice orchestrator canvas, showing intake, extraction and spreadsheet handoffs. The 97.9% annotation is an internal target, not a verified project accuracy result.',
  c69906586afbf78dadaadc2e23461c8427034f20808a862cd681cff7189521f9: 'Earlier extraction canvas with model processing and Greek-to-English translation. The benchmark and ranking annotations do not establish this project\'s measured performance.',
  c4ef84c5245e7116671357858924a22b8a2dbd1f95695108125704d6021f9964: 'Historical PDF-splitting workflow. Combined multi-invoice PDF processing was an extension in progress, outside the delivered core described here.',
};
const fictionalSamples = {
  'browser-search-to-spreadsheet': {
    sha256: 'f41570cb8d94aa364a7b72585ec57dd75f0cfbfe499c6747e651dbcb2ff0f97b',
    label: /not a client sheet/,
  },
  'ai-project-planning-assistant': {
    sha256: 'eff7965595d32bb9557300645b36c7bd15b56e165c3615899cc5dd57bdce175f',
    label: /not a captured agent result/,
  },
  'python-ci-workflow-automation': {
    sha256: 'b2489f2c3e945c7e978c5074fd895e808504097ed5cad9376c29b73c14d22ea5',
    label: /No tool run/,
  },
  'healthcare-document-intelligence': {
    previousSha256: '082df33a75889756d6775d712fd9a577e2a1d7618fb5b73fb994e4ee11d3b225',
    label: /not a client workbook/,
  },
  'n8n-python-ai-agents': {
    previousSha256: '39463a417eec39966c51d0f6dffda491d511b52d3863be3dccd4ea592c087339',
    label: /not an executed agent result/,
  },
  'resumable-listing-data-extraction': {
    previousSha256: '793305363094814e248eb621dc2d5f14288d319fbf34d439e89613dc4acb9e4a',
    label: /not a client export or measured run/,
  },
};

const publishedDigest = (src) => {
  const asset = caseStudyPublicationManifest.assets?.[src];
  expect(asset?.file, src).toBe(`public${src}`);
  const sha256 = digest(readFileSync(path.join(repositoryRoot, asset.file)));
  expect(asset.approval.sha256, src).toBe(sha256);
  return sha256;
};

const expectStoryAsset = (story, src) => {
  const sha256 = publishedDigest(src);
  expect(src).toBe(`/assets/case-studies/${story.id}-${sha256}${path.posix.extname(src)}`);
  return sha256;
};

const sectionProse = (story) => {
  const parts = [];
  const walk = (node) => {
    if (!node || typeof node !== 'object') return;
    if (typeof node.value === 'string') parts.push(node.value);
    node.children?.forEach(walk);
    node.items?.forEach(walk);
    node.nodes?.forEach(walk);
  };
  story.sections.forEach((section) => walk(section));
  return parts.join('\n');
};

const galleryMedia = (story) => {
  const media = collectGalleryImages(story);
  expect(media[0]?.src).toBe(story.image.src);
  const gallerySrcs = (story.gallery ?? []).map((item) => item.src);
  expect(gallerySrcs).not.toContain(story.image.src);
  expect(media.slice(1).map((item) => item.src)).toEqual(gallerySrcs);
  for (const item of media) {
    expectStoryAsset(story, item.src);
    if (item.poster) expectStoryAsset(story, item.poster);
  }
  return media;
};

const mediaByDigest = (media, allowed) => media.find((item) => allowed.includes(publishedDigest(item.src)));

describe('buyer-facing case-study copy', () => {
  const publication = compileCaseStudyPublication();
  const storyBySlug = (slug) => publication.find((record) => record.slug === slug);

  it('excludes draft history and proposal instructions from public stories', () => {
    expect(publication.filter((story) => containsCaseStudyCopyLeak(JSON.stringify(story))).map((story) => story.slug)).toEqual([]);
  });

  it('keeps depth distances on a stored reference scale without an accuracy claim', () => {
    const story = storyBySlug('depth-based-distance-estimation');
    const media = galleryMedia(story);
    expect(media).toHaveLength(2);
    expect(publishedDigest(story.image.src)).not.toBe(oldDepthDiagram);
    const still = mediaByDigest(media, [depthWebcamStill]);
    expect(still?.src).not.toBe(story.image.src);
    expect(`${still.alt} ${still.caption}`).toMatch(/stored reference scale/);
    expect(`${still.alt} ${still.caption}`).toMatch(/assumed camera geometry/);
    expect(still.caption).toContain('printed FPS is an on-screen prototype counter');
    expect(still.caption).toContain('not a validated processing-speed benchmark');
    expect(still.alt).toContain('not a validated speed benchmark');
    expect(`${story.image.alt} ${story.image.caption} ${still.alt} ${still.caption}`).not.toMatch(/\baccuracy\b|uncalibrated/i);
    const prose = sectionProse(story);
    expect(prose).toContain('navigation module exists in the source but is not called');
    expect(prose).toContain('stored reference scale');
    expect(prose).toContain('assumed camera geometry');
    expect(prose).toContain('not a validated measurement system');
    expect(prose).not.toMatch(/uncalibrated/i);
  });

  it.each(Object.entries(fictionalSamples))('identifies the fictional sample in %s by asset digest', (slug, sample) => {
    const story = storyBySlug(slug);
    const media = galleryMedia(story);
    const examples = media.filter((item) => item.caption?.startsWith('Fictional '));
    expect(examples).toHaveLength(1);
    const example = examples[0];
    expect(example.src).not.toBe(story.image.src);
    const sha256 = publishedDigest(example.src);
    if (sample.sha256) expect(sha256).toBe(sample.sha256);
    if (sample.previousSha256) expect(sha256).not.toBe(sample.previousSha256);
    if (slug === 'resumable-listing-data-extraction') {
      expect(example.caption).toMatch(/listing_id/);
      expect(example.caption).toMatch(/JSON Lines/);
      expect(example.caption).toMatch(/rather than a separate checkpoint file/);
    }
    expect(example.caption).toMatch(sample.label);
  });

  it('keeps the combined n8n story to its diagram and one fictional SQL sample', () => {
    const story = storyBySlug('n8n-python-ai-agents');
    const media = galleryMedia(story);
    expect(media).toHaveLength(2);
    const digests = media.map((item) => publishedDigest(item.src));
    for (const removed of removedN8nDigests) expect(digests).not.toContain(removed);
    expect(media.some((item) => item.alt.startsWith('Representative '))).toBe(false);
    const prose = sectionProse(story);
    expect(prose).toContain('fallback LIMIT 100');
    expect(prose).toContain('do not establish database-enforced read-only access or a maximum row count');
  });

  it('narrows historical invoice metric captions to the reviewed wording', () => {
    const story = storyBySlug('ai-invoice-processing-automation');
    const media = galleryMedia(story);
    for (const [sha256, caption] of Object.entries(invoiceCaptionsByDigest)) {
      const image = mediaByDigest(media, [sha256]);
      expect(image, sha256).toBeTruthy();
      expect(image.caption).toBe(caption);
    }
    const borrowed = storyBySlug('n8n-python-ai-agents');
    const borrowedDigests = galleryMedia(borrowed).map((item) => publishedDigest(item.src));
    for (const sha256 of Object.keys(invoiceCaptionsByDigest)) expect(borrowedDigests).not.toContain(sha256);
  });

  it('reports the football detector scores as published box results, not a rerun or a speed claim', () => {
    const story = storyBySlug('sports-video-analytics-yolo');
    const media = galleryMedia(story);
    expect(media).toHaveLength(4);
    const prose = sectionProse(story);
    expect(prose).toContain('49 validation images');
    expect(prose).toContain('precision 0.948, recall 0.880, mAP50 0.916 and mAP50-95 0.675');
    expect(prose).toContain('Player mAP50 is 0.994');
    expect(prose).toContain('ball recall is 0.618');
    expect(prose).toContain('not measurements of tracking identity consistency, team assignment or processing speed');
    expect(prose).toContain('The evaluation was not rerun for this case study.');
    const clip = media.filter((item) => item.src.endsWith('.mp4'));
    expect(clip).toHaveLength(1);
    expect(publishedDigest(clip[0].src)).toBe(trackingVideo);
    expect(publishedDigest(clip[0].src)).not.toBe(otherFootballClip);
    expect(clip[0].caption).toMatch(/not a processing-speed result/);
    const f1 = mediaByDigest(media, f1ChartDigests);
    expect(f1.caption).toMatch(/49-image validation split/);
    expect(f1.caption).toMatch(/0\.90 at confidence 0\.359/);
    expect(f1.caption).toMatch(/not tracking accuracy/);
    const matrix = mediaByDigest(media, confusionMatrixDigests);
    expect(matrix.caption).toMatch(/missed detections/);
    expect(matrix.caption).toMatch(/not a fifth trained class/);
    for (const item of media) expect(item.caption.startsWith('Supplied ')).toBe(false);
  });

  it('states the schedule columns and numeric request legend', () => {
    const prose = sectionProse(storyBySlug('healthcare-document-intelligence'));
    expect(prose).toContain('NAME, Date, Year, WEEKDAY, SHIFT and REQUEST');
    expect(prose).toContain('0 = Off');
    expect(prose).toContain('1 = Available');
    expect(prose).toContain('2 = Request to Work');
  });
});
