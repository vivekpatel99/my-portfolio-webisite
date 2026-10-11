// @vitest-environment node
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { imageSize } from 'image-size';
import { describe, expect, it } from 'vitest';
import { caseStudyPublicationManifest } from './case-study-manifest.js';
import { compileCaseStudyPublication, repositoryRoot } from './compile-case-studies.js';
import { digest } from './case-study-evidence.js';
import { collectGalleryImages } from '../src/components/CaseStudyGallery.js';

const slug = 'sports-video-analytics-yolo';
const realtimeCover = '890bce9082b77f882bfba6e8c08afd57459a547ec3624076bc79300fcd07328a';
const trackingVideo = '8cbcc66d4354a1e2e019c5724710e35d39a70e3dfdd2613f9912eca7e4f4cef3';
const trackingPoster = 'dc043038188a069bd29249f0389a998e64cab98e0f5fc6cbe702bb9c60c87cbb';
const otherFootballClip = 'e8f90196e5e6edcef0ad11eefb8739f8c16b936217ea84109c33fe4ca7b12369';
const f1Chart = {
  width: 2250,
  height: 1500,
  digests: [
    '17675c81b372e6fb4505c19e5fe2d22c3eefdacc34b1ad9c4d12c6ca24edf0dc',
    '4422c54ac53200d0a5e3e529709980779fb42c5c87ba182435157745b60d9b95',
  ],
};
const confusionMatrix = {
  width: 3000,
  height: 2250,
  digests: [
    'd039a81022e6edc6b245623ac0ecb71f16b1cc0fcbb37e9532e85ba4b1b966be',
    '9cc6ca9b6368f9c1c0203c352d73a18f1fc19d0be2e5561544ce09679687a2e1',
  ],
};

const publishedAsset = (src) => {
  const asset = caseStudyPublicationManifest.assets?.[src];
  expect(asset?.file, src).toBe(`public${src}`);
  const bytes = readFileSync(path.join(repositoryRoot, asset.file));
  const sha256 = digest(bytes);
  expect(asset.approval.sha256, src).toBe(sha256);
  return { asset, bytes, sha256 };
};

const expectContentAddressed = (src, sha256) => {
  expect(src).toBe(`/assets/case-studies/${slug}-${sha256}${path.posix.extname(src)}`);
};

const videoStreamSize = (filePath) => {
  const result = spawnSync('ffprobe', [
    '-v', 'error', '-select_streams', 'v:0', '-count_packets',
    '-show_entries', 'stream=codec_type,width,height,nb_read_packets',
    '-of', 'json', filePath,
  ], { encoding: 'utf8', timeout: 10_000 });
  expect(result.error, result.error?.message).toBeUndefined();
  expect(result.status, result.stderr).toBe(0);
  const video = JSON.parse(result.stdout).streams?.find((stream) => stream.codec_type === 'video');
  expect(Number(video?.nb_read_packets)).toBeGreaterThan(0);
  return { width: Number(video.width), height: Number(video.height) };
};

const expectChart = (item, chart) => {
  const published = publishedAsset(item.src);
  const size = imageSize(published.bytes);
  expect(size).toMatchObject({ width: chart.width, height: chart.height });
  expect(item.width).toBe(chart.width);
  expect(item.height).toBe(chart.height);
  expect(chart.digests, item.src).toContain(published.sha256);
  expectContentAddressed(item.src, published.sha256);
};

const changedManifest = (change) => {
  const manifest = structuredClone(caseStudyPublicationManifest);
  const record = manifest.records.find((item) => item.slug === slug);
  change(record.content, manifest);
  record.approval.sha256 = digest({ id: record.id, slug: record.slug, content: record.content });
  return manifest;
};

const oneVideo = (content) => {
  const videos = content.gallery.filter((item) => typeof item?.src === 'string' && item.src.toLowerCase().endsWith('.mp4'));
  if (videos.length !== 1) throw new Error(`sports gallery must contain one MP4 before a rejection check, found ${videos.length}`);
  return videos[0];
};

const oneChart = (content) => {
  const image = content.gallery.find((item) => typeof item?.src === 'string' && !item.src.toLowerCase().endsWith('.mp4'));
  if (!image) throw new Error('sports gallery must contain a chart image before a rejection check');
  return image;
};

describe('approved article galleries', () => {
  it('delivers the content-addressed cover, tracking video, and both detector charts', () => {
    const story = compileCaseStudyPublication().find((item) => item.slug === slug);
    const media = collectGalleryImages(story);
    expect(media).toHaveLength(4);
    expect(media.every((item) => item.alt && item.caption)).toBe(true);
    expect(story.gallery.map((item) => item.src)).not.toContain(story.image.src);
    expect(story.gallery.map((item) => item.src)).toEqual([media[1].src, media[2].src, media[3].src]);

    const cover = publishedAsset(media[0].src);
    expect(media[0].src).toBe(story.image.src);
    expect(cover.sha256, 'realtime concept cover must be removed').not.toBe(realtimeCover);
    expect([trackingVideo, trackingPoster, ...f1Chart.digests, ...confusionMatrix.digests]).not.toContain(cover.sha256);
    expectContentAddressed(media[0].src, cover.sha256);
    expect(`${media[0].alt} ${media[0].caption}`).not.toMatch(/real-?time|unverified|\bWin\b/i);

    const clip = publishedAsset(media[1].src);
    expect(clip.sha256).toBe(trackingVideo);
    expect(clip.sha256).not.toBe(otherFootballClip);
    expectContentAddressed(media[1].src, clip.sha256);
    expect(videoStreamSize(path.join(repositoryRoot, clip.asset.file))).toEqual({ width: 640, height: 360 });
    expect(media[1]).toMatchObject({ width: 640, height: 360 });
    const poster = publishedAsset(media[1].poster);
    expect(poster.sha256).toBe(trackingPoster);
    expectContentAddressed(media[1].poster, poster.sha256);
    expect(imageSize(poster.bytes)).toMatchObject({ width: 640, height: 360 });
    expect(media[1].caption).toMatch(/tracking IDs/);
    expect(media[1].caption).toMatch(/not a processing-speed result/);
    expect(media[1].caption).not.toMatch(/unverified|\bpose\b|shot|rally/i);

    expectChart(media[2], f1Chart);
    expect(media[2].caption).toMatch(/49-image validation/);
    expect(media[2].caption).toMatch(/0\.90 at confidence 0\.359/);
    expect(media[2].caption).toMatch(/not tracking accuracy/);
    expectChart(media[3], confusionMatrix);
    expect(media[3].caption).toMatch(/missed detections/);
    expect(media[3].caption).toMatch(/not a fifth trained class/);
    expect(media[3].caption).not.toMatch(/unverified/i);
  });

  it.each([
    ['a non-array gallery', (content) => { content.gallery = {}; }, /gallery must be an array/],
    ['missing dimensions', (content) => { delete oneVideo(content).width; }, /requires intrinsic dimensions/],
    ['a missing video poster', (content) => { delete oneVideo(content).poster; }, /requires an approved image poster/],
    ['a video used as a poster', (content) => { const video = oneVideo(content); video.poster = video.src; }, /requires an approved image poster/],
    ['unapproved video bytes', (content, manifest) => { delete manifest.assets[oneVideo(content).src]; }, /unapproved asset/],
    ['an unapproved poster', (content) => { oneVideo(content).poster = '/assets/case-studies/missing-poster.png'; }, /unapproved asset/],
    ['an unsupported media format', (content) => { oneVideo(content).src = '/assets/case-studies/file.html'; }, /approved image or MP4 path/],
    ['a remote video', (content) => { oneVideo(content).src = 'https://example.com/file.mp4'; }, /unsafe case-study asset path/],
    ['incorrect image dimensions', (content) => { oneChart(content).width = 1; }, /dimensions do not match/],
    ['changed asset approval', (content, manifest) => { manifest.assets[oneVideo(content).src].approval.sha256 = '0'.repeat(64); }, /bytes changed without approval/],
  ])('rejects %s before publication', (_, change, expected) => {
    expect(() => compileCaseStudyPublication({ manifest: changedManifest(change) })).toThrow(expected);
  });
});
