// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { compileCaseStudyPublication } from './compile-case-studies.js';

describe('buyer-facing case-study copy', () => {
  const publication = compileCaseStudyPublication();

  it('excludes draft history and proposal instructions from public stories', () => {
    const editorialCopy = /not for proposals|not client-ready evidence|this story replaces|temporary stand-in|engagement screenshots/i;
    expect(publication.filter((story) => editorialCopy.test(JSON.stringify(story))).map((story) => story.slug)).toEqual([]);
  });

  it('keeps the depth demo uncalibrated and preserves its measurement limits', () => {
    const depth = publication.find((story) => story.slug === 'depth-based-distance-estimation');
    expect(depth.title).toContain('Lab Demo');
    expect(depth.summary).toContain('uncalibrated');
    expect(JSON.stringify(depth.sections)).toContain('does not claim calibrated measurement accuracy or safety-critical navigation readiness');
    expect(depth.image.alt).toContain('not an accuracy benchmark');
    expect(depth.image.caption).toContain('not an accuracy benchmark');
  });

  it('describes all six representative n8n images without identifying the client', () => {
    const story = publication.find((record) => record.slug === 'n8n-python-ai-agents');
    const images = story.sections.flatMap((section) => section.nodes.flatMap((node) => node.children ?? [])).filter((node) => node.type === 'image');
    expect(images).toHaveLength(6);
    for (const image of images) {
      expect(image.alt).toMatch(/^Representative (n8n|invoice) .+ from other portfolio work$/);
    }
  });
});
