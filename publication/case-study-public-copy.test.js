// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { compileCaseStudyPublication } from './compile-case-studies.js';
import { containsCaseStudyCopyLeak } from '../tests/case-study-copy.js';

describe('buyer-facing case-study copy', () => {
  const publication = compileCaseStudyPublication();

  it('excludes draft history and proposal instructions from public stories', () => {
    expect(publication.filter((story) => containsCaseStudyCopyLeak(JSON.stringify(story))).map((story) => story.slug)).toEqual([]);
  });

  it('keeps the depth demo uncalibrated and preserves its measurement limits', () => {
    const depth = publication.find((story) => story.slug === 'depth-based-distance-estimation');
    expect(depth.title).toContain('Lab Demo');
    expect(depth.summary).toContain('uncalibrated');
    expect(JSON.stringify(depth.sections)).toContain('does not claim calibrated measurement accuracy or safety-critical navigation readiness');
    expect(depth.image.alt).toContain('uncalibrated lab demo');
    expect(depth.image.caption).toContain('uncalibrated lab demo');
    const original = depth.sections.flatMap((section) => section.nodes.flatMap((node) => node.children ?? []))
      .find((node) => node.type === 'image');
    expect(original.alt).toContain('not an accuracy benchmark');
    expect(original.caption).toContain('not an accuracy benchmark');
  });

  it('describes all six representative n8n images without identifying the client', () => {
    const story = publication.find((record) => record.slug === 'n8n-python-ai-agents');
    const images = story.sections.flatMap((section) => section.nodes.flatMap((node) => node.children ?? [])).filter((node) => node.type === 'image');
    const representativeImages = images.filter((image) => image.alt.startsWith('Representative '));
    expect(representativeImages).toHaveLength(6);
    for (const image of representativeImages) {
      expect(image.alt).toMatch(/^Representative (n8n|invoice) .+ from other portfolio work$/);
      expect(image.caption).toContain(image.alt);
    }
  });

  it.each([
    'browser-search-to-spreadsheet', 'resumable-listing-data-extraction',
    'healthcare-document-intelligence', 'ai-project-planning-assistant',
    'python-ci-workflow-automation', 'n8n-python-ai-agents',
  ])('identifies the authored output example in %s as fictional', (slug) => {
    const story = publication.find((record) => record.slug === slug);
    const examples = story.sections.flatMap((section) => section.nodes.flatMap((node) => node.children ?? []))
      .filter((node) => node.type === 'image' && node.src.endsWith('-sample-output.png'));
    expect(examples).toHaveLength(1);
    expect(examples[0].alt).toMatch(/^Fictional /);
    expect(examples[0].caption).toMatch(/^Illustrative /);
    expect(examples[0].caption).toContain('fictional');
    expect(examples[0].caption).toContain('not ');
  });

  it.each(['ai-invoice-processing-automation', 'n8n-python-ai-agents'])('qualifies historical invoice screenshot metrics in %s', (slug) => {
    const story = publication.find((record) => record.slug === slug);
    const images = story.sections.flatMap((section) => section.nodes.flatMap((node) => node.children ?? []))
      .filter((node) => node.type === 'image' && /Original M[12]|Representative invoice (orchestrator|extractor)/.test(node.alt));
    expect(images).toHaveLength(2);
    for (const image of images) {
      expect(image.caption).toContain('97.9%');
      expect(image.caption).toContain('18-invoice golden dataset');
      expect(image.caption).toMatch(/historical screenshot annotations?/);
      expect(image.caption).toMatch(/not (an )?independently verified benchmarks? for this case study/);
      if (/Original M1|invoice extractor/.test(image.alt)) {
        expect(image.caption).toContain('#1 on OCR Arena');
      }
    }
  });

  it('keeps combined multi-invoice PDFs outside the verified scope beside the splitting screenshot', () => {
    const story = publication.find((record) => record.slug === 'ai-invoice-processing-automation');
    const image = story.sections.flatMap((section) => section.nodes.flatMap((node) => node.children ?? []))
      .find((node) => node.type === 'image' && node.alt === 'Original PDF splitting subworkflow');
    expect(image.caption).toContain('Combined multi-invoice PDF processing');
    expect(image.caption).toContain('outside the verified scope');
  });

  it('separates supplied football media from the delivered pose, shot and rally package', () => {
    const story = publication.find((record) => record.slug === 'sports-video-analytics-yolo');
    for (const media of [story.image, ...story.gallery]) {
      expect(media.caption).toMatch(/^Supplied /);
      expect(media.caption).toMatch(/(?:relationship|connection) to the (?:described delivery|delivered package) (?:is|are) unverified/);
    }
    expect(story.image.caption).toContain('Real-time wording is not a delivery claim');
    const video = story.gallery.find((media) => media.src.endsWith('.mp4'));
    expect(video.caption).toContain('not verified pose, shot or rally output');
    const prose = JSON.stringify(story.sections);
    expect(prose).toContain('any shared model or evaluation run, has not been established');
    expect(prose).toContain('batch analysis of recorded footage');
    expect(prose).toContain('A person still checks the proposed tags');
  });

  it('explains the detector reference metrics and their unverified evaluation context', () => {
    const story = publication.find((record) => record.slug === 'sports-video-analytics-yolo');
    const f1 = story.gallery.find((media) => media.src.endsWith('/sports-football-f1-confidence.png'));
    const matrix = story.gallery.find((media) => media.src.endsWith('/sports-football-confusion-matrix.png'));
    for (const chart of [f1, matrix]) {
      expect(chart.caption).toMatch(/model, dataset, evaluation run.+unverified/);
    }
    expect(f1.caption).toContain('precision and recall');
    expect(f1.caption).toContain('0.90 at confidence 0.359');
    expect(f1.caption).toContain('weaker ball-class curve');
    expect(f1.caption).toContain('do not measure tracking or event-tagging accuracy');
    expect(matrix.caption).toContain('raw counts');
    expect(matrix.caption).toContain('background row marks missed detections');
    expect(matrix.caption).toContain('background column marks unmatched predictions');
    expect(matrix.caption).toContain('not a trained background class');
    expect(matrix.alt).toMatch(/background row.+missed detections.+background column.+unmatched predictions/);
    expect(matrix.alt).not.toMatch(/background classes?/);
  });
});
