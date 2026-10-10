// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { caseStudyPublicationManifest } from './case-study-manifest.js';
import { compileCaseStudyPublication } from './compile-case-studies.js';
import { digest } from './case-study-evidence.js';
import { collectGalleryImages } from '../src/components/CaseStudyGallery.js';

const slug = 'sports-video-analytics-yolo';
const changedManifest = (change) => {
  const manifest = structuredClone(caseStudyPublicationManifest);
  const record = manifest.records.find((item) => item.slug === slug);
  change(record.content, manifest);
  record.approval.sha256 = digest({ id: record.id, slug: record.slug, content: record.content });
  return manifest;
};

describe('approved article galleries', () => {
  it('delivers the cover, video with poster, and both evaluation images to the existing gallery', () => {
    const story = compileCaseStudyPublication().find((item) => item.slug === slug);
    const media = collectGalleryImages(story);
    expect(media).toHaveLength(4);
    expect(media[0].src).toContain('sports-football-workflow.png');
    expect(media[1]).toMatchObject({
      src: '/assets/case-studies/sports-football-tracking.mp4',
      poster: '/assets/case-studies/sports-football-tracking-poster.png',
      width: 640,
      height: 360,
    });
    expect(media[2].src).toContain('f1-confidence.png');
    expect(media[3].src).toContain('confusion-matrix.png');
    expect(media.every((item) => item.alt && item.caption)).toBe(true);
  });

  it.each([
    ['a non-array gallery', (content) => { content.gallery = {}; }, /gallery must be an array/],
    ['missing dimensions', (content) => { delete content.gallery[0].width; }, /requires intrinsic dimensions/],
    ['a missing video poster', (content) => { delete content.gallery[0].poster; }, /requires an approved image poster/],
    ['a video used as a poster', (content) => { content.gallery[0].poster = content.gallery[0].src; }, /requires an approved image poster/],
    ['unapproved video bytes', (content, manifest) => { delete manifest.assets[content.gallery[0].src]; }, /unapproved asset/],
    ['an unapproved poster', (content) => { content.gallery[0].poster = '/assets/case-studies/missing-poster.png'; }, /unapproved asset/],
    ['an unsupported media format', (content) => { content.gallery[0].src = '/assets/case-studies/file.html'; }, /approved image or MP4 path/],
    ['a remote video', (content) => { content.gallery[0].src = 'https://example.com/file.mp4'; }, /unsafe case-study asset path/],
    ['incorrect image dimensions', (content) => { content.gallery[1].width = 1; }, /dimensions do not match/],
    ['changed asset approval', (content, manifest) => { manifest.assets[content.gallery[0].src].approval.sha256 = '0'.repeat(64); }, /bytes changed without approval/],
  ])('rejects %s before publication', (_, change, expected) => {
    expect(() => compileCaseStudyPublication({ manifest: changedManifest(change) })).toThrow(expected);
  });
});
