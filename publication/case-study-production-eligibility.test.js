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
    expect(story).not.toHaveProperty('subtitle');
    expect(publication.filter((record) => record.slug === slug)).toHaveLength(1);
    expect(publication.map((record) => record.slug)).not.toContain('sports-live-scoring');

    const seo = routeSeo[`/project/${slug}`];
    expect(seo.description).toBe(summary);
    expect(seo.path).toBe(`/project/${slug}`);
    expect(seo.title).toContain(story.title);

    const problem = JSON.stringify(story.sections.find((section) => section.key === 'problem'));
    const built = JSON.stringify(story.sections.find((section) => section.key === 'built'));
    const outcomeText = story.sections.find((section) => section.key === 'outcome').nodes[0].children[0].value;
    const beforeOutcome = `${story.category} ${story.title} ${story.summary} ${problem} ${built}`;
    expect(story.sections[0].key).toBe('problem');
    expect(story.sections[2].key).toBe('outcome');
    expect(beforeOutcome).toMatch(/batch/i);
    expect(beforeOutcome).toMatch(/recorded match footage/i);
    expect(beforeOutcome).toMatch(/human review/i);
    expect(story.summary).toContain('Not live scoring.');
    expect(problem).toContain('This is batch review of recorded footage, not live scoring.');

    expect(outcomeText).toBe('The handoff links video analysis to reviewable events and exports. A person still checks the proposed tags before treating them as final. The scope is batch analysis of recorded footage, not real-time broadcasting or autonomous officiating. No public tracking-accuracy, latency or time-saving figure is claimed.');

    const headingMetaCaption = `${story.title} ${story.category} ${seo.title} ${story.image.alt} ${story.image.caption}`;
    expect(headingMetaCaption).not.toMatch(/60\s*FPS/i);
    expect(headingMetaCaption).not.toMatch(/\baccuracy\b/i);
    expect(headingMetaCaption).not.toMatch(/\blatency\b/i);
    expect(headingMetaCaption).not.toMatch(/broadcast/i);
    expect(`${story.title} ${story.summary} ${story.image.alt} ${story.image.caption}`).not.toMatch(/real-?time/i);
    expect(`${headingMetaCaption} ${story.summary} ${problem}`.replace(/not live scoring\.?/gi, '')).not.toMatch(/live scoring/i);
    expect(story.image.src).toBe(coverSrc);
    expect(story.image.alt).toBe('Illustration of match analysis; synthetic example, not a delivered-product screenshot');
    expect(story.image.caption).toBe('Workflow illustration with synthetic data; not a screenshot of the delivered product.');

    const module = await import(`data:text/javascript;base64,${Buffer.from(renderPublicCaseStudyModule(publication)).toString('base64')}`);
    const card = module.collectionCaseStudies.find((record) => record.slug === slug);
    expect(card.summary).toBe(summary);
    expect(card.image.src).toBe(coverSrc);
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
