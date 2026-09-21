// @vitest-environment node
import { caseStudyPublicationBaseline } from './case-study-manifest.js';
import { describe, expect, it } from 'vitest';
import { routeSeo } from '../src/lib/seoConfig.js';
import { compileCaseStudyPublication, renderPublicCaseStudyModule } from './compile-case-studies.js';

describe('retained completed case studies', () => {
  it('includes the approved twelve-story library in the collection and keeps three featured stories', async () => {
    const publication = compileCaseStudyPublication();
    const module = await import(`data:text/javascript;base64,${Buffer.from(renderPublicCaseStudyModule(publication)).toString('base64')}`);
    expect(module.collectionCaseStudies).toHaveLength(12);
    expect(new Set(module.collectionCaseStudies.map((story) => story.slug)).size).toBe(12);
    expect(module.collectionCaseStudies.every((story) => story.projectStatus === 'completed' && /^\d{4}-\d{2}$/.test(story.completedAt))).toBe(true);
    expect(module.featuredCaseStudies).toHaveLength(3);
    expect(module.caseStudySlugs).toContain('healthcare-document-intelligence');
    expect(module.caseStudySlugs).toContain('ai-invoice-processing-automation');
  });

  it('states the sports article is a batch review pipeline, not live scoring', async () => {
    const slug = 'sports-video-analytics-yolo';
    const summary = 'A batch pipeline on recorded match footage produces tracks, event proposals, and JSON and CSV for human review. Not live scoring.';
    const coverSrc = '/assets/case-studies/sports-video-analytics-yolo-9a74c900f91b2c81d095d82ec7b1ca2ccad2d5a09935d88ccdcaaf714d3a5761.png';
    const publication = compileCaseStudyPublication();
    const story = publication.find((record) => record.slug === slug);
    expect(story).toBeDefined();
    expect(story.id).toBe(slug);
    expect(story.title).toBe('Recorded Match Video to Reviewable Tracks and Event Tags');
    expect(story.summary).toBe(summary);
    expect(publication.filter((record) => record.slug === slug)).toHaveLength(1);

    const seo = routeSeo[`/project/${slug}`];
    expect(seo.description).toBe(summary);
    expect(seo.path).toBe(`/project/${slug}`);
    expect(seo.title).toContain(story.title);

    const problem = JSON.stringify(story.sections.find((section) => section.key === 'problem'));
    const built = JSON.stringify(story.sections.find((section) => section.key === 'built'));
    const outcome = JSON.stringify(story.sections.find((section) => section.key === 'outcome'));
    const beforeOutcome = `${story.category} ${story.title} ${story.summary} ${problem} ${built}`;
    expect(beforeOutcome).toMatch(/batch/i);
    expect(beforeOutcome).toMatch(/recorded/i);
    expect(beforeOutcome).toMatch(/human review/i);
    expect(story.summary).toMatch(/Not live scoring/);
    expect(problem).toMatch(/not live scoring/i);

    expect(outcome).toMatch(/not real-time broadcasting or autonomous officiating/i);
    expect(outcome).toContain('No public tracking-accuracy, latency or time-saving figure is claimed.');

    expect(story.title).not.toMatch(/live scoring|60\s*FPS|real-?time/i);
    expect(seo.title).not.toMatch(/live scoring|60\s*FPS|real-?time/i);
    expect(story.summary).not.toMatch(/60\s*FPS|real-?time/i);
    expect(story.image.src).toBe(coverSrc);
    expect(story.image.alt).not.toMatch(/live scoring|60\s*FPS|real-?time/i);
    expect(story.image.caption).not.toMatch(/live scoring|60\s*FPS|real-?time/i);

    const module = await import(`data:text/javascript;base64,${Buffer.from(renderPublicCaseStudyModule(publication)).toString('base64')}`);
    const card = module.collectionCaseStudies.find((record) => record.slug === slug);
    expect(card.summary).toBe(summary);
    expect(card.image.src).toBe(coverSrc);
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
