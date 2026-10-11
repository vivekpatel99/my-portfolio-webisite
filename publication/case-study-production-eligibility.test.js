// @vitest-environment node
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { caseStudyPublicationBaseline, caseStudyPublicationManifest } from './case-study-manifest.js';
import { describe, expect, it } from 'vitest';
import { routeSeo } from '../src/lib/seoConfig.js';
import { compileCaseStudyPublication, renderPublicCaseStudyModule, repositoryRoot } from './compile-case-studies.js';
import { digest } from './case-study-evidence.js';
import { collectGalleryImages } from '../src/components/CaseStudyGallery.js';

const footballEstimatedCompletionMonth = '2025-04';
const completionMonths = {
  'ai-invoice-processing-automation': '2026-09',
  'ai-project-planning-assistant': '2025-09',
  'browser-search-to-spreadsheet': '2026-04',
  'depth-based-distance-estimation': '2025-09',
  'healthcare-document-intelligence': '2026-09',
  'invoice-ocr-extraction': '2025-08',
  'n8n-openai-data-extraction': '2025-10',
  'n8n-python-ai-agents': '2026-05',
  'python-ci-workflow-automation': '2025-09',
  'resumable-listing-data-extraction': '2025-11',
  'sports-video-analytics-yolo': footballEstimatedCompletionMonth,
  'yolo-computer-vision-optimization': '2025-09',
};

const storyText = (story) => {
  const parts = [];
  const walk = (node) => {
    if (!node || typeof node !== 'object') return;
    for (const key of ['value', 'alt', 'caption', 'href', 'title', 'summary', 'category']) {
      if (typeof node[key] === 'string') parts.push(node[key]);
    }
    node.children?.forEach(walk);
    node.items?.forEach(walk);
    node.nodes?.forEach(walk);
    node.gallery?.forEach(walk);
    node.sections?.forEach(walk);
    if (node.image) walk(node.image);
  };
  walk(story);
  return parts.join('\n');
};

const publishedAsset = (src) => {
  const asset = caseStudyPublicationManifest.assets?.[src];
  expect(asset?.file, src).toBe(`public${src}`);
  const bytes = readFileSync(path.join(repositoryRoot, asset.file));
  const sha256 = digest(bytes);
  expect(asset.approval.sha256, src).toBe(sha256);
  return { bytes, sha256 };
};

const monthsOf = (stories) => Object.fromEntries(stories.map((story) => [story.slug, story.completedAt]));

describe('retained completed case studies', () => {
  it('includes the approved twelve-story library in the collection and keeps three featured stories', async () => {
    const publication = compileCaseStudyPublication();
    const module = await import(`data:text/javascript;base64,${Buffer.from(renderPublicCaseStudyModule(publication)).toString('base64')}`);
    const migratedSlugs = ['ai-project-planning-assistant', 'python-ci-workflow-automation'];
    expect(module.collectionCaseStudies).toHaveLength(12);
    expect(module.otherWorkCaseStudies).toEqual([]);
    migratedSlugs.forEach((slug) => expect(module.collectionCaseStudies.filter((story) => story.slug === slug)).toHaveLength(1));
    expect(new Set(module.collectionCaseStudies.map((story) => story.slug)).size).toBe(12);
    expect(module.collectionCaseStudies.every((story) => story.projectStatus === 'completed' && /^\d{4}-\d{2}$/.test(story.completedAt))).toBe(true);
    expect(monthsOf(publication)).toEqual(completionMonths);
    expect(monthsOf(module.collectionCaseStudies)).toEqual(completionMonths);
    expect(module.eligibleCaseStudies).toHaveLength(12);
    expect(module.eligibleCaseStudyCount).toBe(module.eligibleCaseStudies.length);
    expect(module.featuredCaseStudies).toHaveLength(3);
    expect(module.featuredCaseStudies.filter((story) => migratedSlugs.includes(story.slug))).toEqual([]);
    expect(module.getCaseStudyBySlug('ai-project-planning-assistant')?.slug).toBe('ai-project-planning-assistant');
    expect(module.getCaseStudyBySlug('python-ci-workflow-automation')?.slug).toBe('python-ci-workflow-automation');
    expect(module.caseStudySlugs).toEqual(expect.arrayContaining(migratedSlugs));
    expect(module.caseStudySlugs).toHaveLength(12);
    expect(module.caseStudySlugs).toContain('healthcare-document-intelligence');
    expect(module.caseStudySlugs).toContain('ai-invoice-processing-automation');
  });

  it('keeps the healthcare slug on schedule-PDF copy that is not clinical EHR', () => {
    const slug = 'healthcare-document-intelligence';
    const title = 'Color-Coded Schedule PDF Extraction to Excel';
    const summary = 'A Python extractor turns staff schedule PDF grids into Excel rows, preserving dates, shifts and color-coded request values for coordinator review.';
    const publication = compileCaseStudyPublication();
    const story = publication.find((record) => record.slug === slug);
    expect(story).toBeDefined();
    expect(story.id).toBe(slug);
    expect(story.title).toBe(title);
    expect(story.summary).toBe(summary);
    expect(story.completedAt).toBe(completionMonths[slug]);
    expect(publication.map((record) => record.slug)).not.toContain('schedule-pdf-to-excel');
    expect(publication.filter((record) => record.slug === slug)).toHaveLength(1);

    const seo = routeSeo[`/project/${slug}`];
    expect(seo.description).toBe(story.summary);
    expect(seo.path).toBe(`/project/${slug}`);
    expect(seo.title).toContain(story.title);

    const text = storyText(story);
    expect(text).toMatch(/staff schedules/i);
    expect(text).toMatch(/rather than clinical records/i);
    expect(text).toMatch(/coordinator/i);
    expect(text).not.toMatch(/healthcare document intelligence/i);
    expect(`${story.title} ${story.summary}`).not.toMatch(/\b\d+(\.\d+)?\s*%/);
  });

  it('states the sports article is football tracking with detector validation, not padel events', async () => {
    const slug = 'sports-video-analytics-yolo';
    const title = 'Football Player Tracking with YOLO and Team Colors';
    const summary = 'A Python football-video pipeline combines YOLO detection, jersey-based team colors and ByteTrack IDs to produce annotated match footage for visual analysis.';
    const publication = compileCaseStudyPublication();
    const story = publication.find((record) => record.slug === slug);
    expect(story).toBeDefined();
    expect(story.id).toBe(slug);
    expect(story.title).toBe(title);
    expect(story.summary).toBe(summary);
    expect(story.completedAt).toBe(footballEstimatedCompletionMonth);
    expect(story.projectStatus).toBe('completed');
    expect(story).not.toHaveProperty('subtitle');
    expect(publication.filter((record) => record.slug === slug)).toHaveLength(1);
    expect(publication.map((record) => record.slug)).not.toContain('sports-live-scoring');

    const seo = routeSeo[`/project/${slug}`];
    expect(seo.description).toBe(story.summary);
    expect(seo.path).toBe(`/project/${slug}`);
    expect(seo.title).toContain(story.title);

    expect(story.sections[0].key).toBe('problem');
    expect(story.sections[2].key).toBe('outcome');
    const text = storyText(story);
    expect(text).toMatch(/49 validation images/);
    expect(text).toMatch(/mAP50 0\.916/);
    expect(text).toMatch(/ball recall is 0\.618/);
    expect(text).toMatch(/not measurements of tracking identity consistency, team assignment or processing speed/);
    expect(text).toContain('https://github.com/vivekpatel99/football-players-tracking-yolo');
    expect(text).toContain('/services/computer-vision-production-optimization/');
    expect(text).not.toMatch(/\bpose\b|near-side|shot proposals?|rally grouping|event tags?|event proposals?|proposed events|\bJSON\b|\bCSV\b|live scoring|real-?time|real time|padel|Lars-smashly/i);
    expect(`${story.title} ${story.summary} ${seo.title}`).not.toMatch(/real-?time|\bFPS\b|\blatency\b|\baccuracy\b|live scoring/i);
    expect(story.image.src).toMatch(/^\/assets\/case-studies\/sports-video-analytics-yolo-[a-f0-9]{64}\.[a-z0-9]+$/);
    expect(story.image.src).not.toContain('sports-football-workflow');

    const module = await import(`data:text/javascript;base64,${Buffer.from(renderPublicCaseStudyModule(publication)).toString('base64')}`);
    const card = module.collectionCaseStudies.find((record) => record.slug === slug);
    expect(card.summary).toBe(story.summary);
    expect(card.title).toBe(story.title);
    expect(card.completedAt).toBe(footballEstimatedCompletionMonth);
    expect(card.image).toEqual(story.image);
    expect(module.featuredCaseStudies.map((record) => record.slug)).not.toContain(slug);
  });

  it('states the depth article is a webcam overlay with a reference scale, not a validated measurement', async () => {
    const slug = 'depth-based-distance-estimation';
    const title = 'Webcam Distance Estimation with Depth Anything V2';
    const summary = 'A Python computer vision prototype combines object detection and depth estimation to display approximate distances between detected objects in a webcam view.';
    const oldDiagram = '6f27eac0ad723f3f4efd36a0ad81d7893a8410409f1cb841d61cc39c6c0f436e';
    const webcamStill = '6cff31a07362f0483bf43298af0366ffb4c8f40137291202506a8924b0d24957';
    const publication = compileCaseStudyPublication();
    const story = publication.find((record) => record.slug === slug);
    expect(story).toBeDefined();
    expect(story.id).toBe(slug);
    expect(story.title).toBe(title);
    expect(story.summary).toBe(summary);
    expect(story.completedAt).toBe('2025-09');
    expect(story).not.toHaveProperty('subtitle');
    expect(publication.filter((record) => record.slug === slug)).toHaveLength(1);

    const seo = routeSeo[`/project/${slug}`];
    expect(seo.description).toBe(story.summary);
    expect(seo.path).toBe(`/project/${slug}`);
    expect(seo.title).toContain(story.title);

    expect(story.sections[0].key).toBe('problem');
    expect(story.sections[2].key).toBe('outcome');
    const text = storyText(story);
    expect(text).toMatch(/RT-DETR/);
    expect(text).toMatch(/Depth Anything V2/);
    expect(text).toMatch(/webcam/i);
    expect(text).toMatch(/stored reference scale/);
    expect(text).toMatch(/assumed camera geometry/);
    expect(text).toMatch(/is not called/);
    expect(text).toMatch(/not a validated measurement system/);
    expect(text).not.toMatch(/uncalibrated/i);
    expect(text).not.toMatch(/navigation-zone/i);
    expect(text).not.toMatch(/SAFEST_DISTANCE|safety distance of/i);

    const cover = publishedAsset(story.image.src);
    expect(cover.sha256, 'depth cover must be the corrected diagram').not.toBe(oldDiagram);
    expect(cover.sha256).not.toBe(webcamStill);
    expect(story.image.src).toBe(`/assets/case-studies/${slug}-${cover.sha256}${path.posix.extname(story.image.src)}`);
    expect(story.image.alt).toBeTruthy();
    expect(story.image.caption).toBeTruthy();
    expect(`${story.image.alt} ${story.image.caption}`).not.toMatch(/uncalibrated|navigation-zone/i);

    const still = collectGalleryImages(story).find((item) => item.src !== story.image.src && publishedAsset(item.src).sha256 === webcamStill);
    expect(still?.src).toBe(`/assets/case-studies/${slug}-${webcamStill}.png`);
    expect(`${still.alt} ${still.caption}`).toMatch(/reference scale/);
    expect(`${still.alt} ${still.caption}`).toMatch(/assumed camera geometry/);
    expect(`${still.alt} ${still.caption}`).not.toMatch(/accuracy benchmark/i);

    const cardText = `${story.title} ${story.summary} ${story.image.alt} ${story.image.caption} ${still.alt} ${still.caption}`;
    expect(cardText).not.toMatch(/\bMAE\b/);
    expect(cardText).not.toMatch(/\b\d+(\.\d+)?\s*%/);

    const module = await import(`data:text/javascript;base64,${Buffer.from(renderPublicCaseStudyModule(publication)).toString('base64')}`);
    const card = module.collectionCaseStudies.find((record) => record.slug === slug);
    expect(card.summary).toBe(story.summary);
    expect(card.title).toBe(story.title);
    expect(card.completedAt).toBe('2025-09');
    expect(card.image.src).toBe(story.image.src);
    expect(module.featuredCaseStudies.map((record) => record.slug)).not.toContain(slug);
  });

  it('makes all three owner-confirmed stories discoverable without inventing completion months', async () => {
    const publication = compileCaseStudyPublication({ manifest: caseStudyPublicationBaseline });
    expect(publication).toHaveLength(3);
    expect(publication.every((record) => record.projectStatus === 'completed' && record.completedAt === undefined)).toBe(true);
    const rendered = renderPublicCaseStudyModule(publication);
    const module = await import(`data:text/javascript;base64,${Buffer.from(rendered).toString('base64')}`);
    expect(module.eligibleCaseStudyCount).toBe(3);
    expect(module.collectionCaseStudies).toHaveLength(3);
    expect(module.featuredCaseStudies).toHaveLength(3);
    for (const story of module.featuredCaseStudies) {
      expect(story.cardTitle).toBeTruthy();
      expect(story.externalLinks.find((link) => link.label === 'Upwork project').href).toMatch(/^https:\/\/www.upwork.com\//);
    }
  });
});
