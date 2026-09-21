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

  it('states the depth article is a lab demo, not a benchmark, and not for proposals', async () => {
    const slug = 'depth-based-distance-estimation';
    const title = "Lab Demo of Depth-Based Spatial Analysis Between Detected Objects";
    const summary = "A Python lab demo overlays object detections and uncalibrated distances on a scene. Not a benchmark. Not for proposals.";
    const caption = "Lab demo showing object detections and estimated distances. Displayed values are demo output, not an accuracy benchmark, and not for proposals.";
    const coverSrc = '/assets/case-studies/depth-based-distance-estimation-6cff31a07362f0483bf43298af0366ffb4c8f40137291202506a8924b0d24957.png';
    const outcomeText = 'The handoff provides a starting point for scene-level spatial analysis. Monocular depth and estimated distances require validation against the intended camera and environment; this case study does not claim calibrated measurement accuracy or safety-critical navigation readiness. The value demonstrated is the integrated processing component, with deployment validation remaining application-specific.';
    const publication = compileCaseStudyPublication();
    const story = publication.find((record) => record.slug === slug);
    expect(story).toBeDefined();
    expect(story.id).toBe(slug);
    expect(story.title).toBe(title);
    expect(story.summary).toBe(summary);
    expect(story).not.toHaveProperty('subtitle');
    expect(publication.filter((record) => record.slug === slug)).toHaveLength(1);

    const seo = routeSeo[`/project/${slug}`];
    expect(seo.description).toBe(summary);
    expect(seo.path).toBe(`/project/${slug}`);
    expect(seo.title).toContain(story.title);

    const problem = JSON.stringify(story.sections.find((section) => section.key === 'problem'));
    const built = JSON.stringify(story.sections.find((section) => section.key === 'built'));
    const beforeOutcome = `${story.category} ${story.title} ${story.summary} ${problem} ${built}`;
    expect(story.sections[0].key).toBe('problem');
    expect(story.sections[2].key).toBe('outcome');
    expect(beforeOutcome).toMatch(/lab demo/i);
    expect(story.summary).toContain('Not a benchmark.');
    expect(story.summary).toContain('Not for proposals.');
    expect(problem).toContain('This is a lab demo, not client-ready evidence and not for proposals.');

    expect(story.sections.find((section) => section.key === 'outcome').nodes[0].children[0].value).toBe(outcomeText);

    const headingMetaCaption = `${story.title} ${story.category} ${seo.title} ${story.image.alt} ${story.image.caption}`;
    expect(story.image.src).toBe(coverSrc);
    expect(story.image.alt).toBe(caption);
    expect(story.image.caption).toBe(caption);
    expect(headingMetaCaption).toMatch(/lab demo/i);
    expect(headingMetaCaption).toMatch(/not an accuracy benchmark/i);
    expect(headingMetaCaption).toMatch(/not for proposals/i);

    const disclaimer = /lab demo|not a benchmark\.?|not an accuracy benchmark|not for proposals\.?|not client-ready evidence/gi;
    const remainder = `${story.title} ${story.summary} ${story.image.alt} ${story.image.caption}`.replace(disclaimer, '');
    expect(remainder).not.toMatch(/\bMAE\b/);
    expect(remainder).not.toMatch(/\b\d+(\.\d+)?\s*%/);
    expect(remainder).not.toMatch(/\bproposals\b/i);

    const module = await import(`data:text/javascript;base64,${Buffer.from(renderPublicCaseStudyModule(publication)).toString('base64')}`);
    const card = module.collectionCaseStudies.find((record) => record.slug === slug);
    expect(card.summary).toBe(summary);
    expect(card.title).toBe(title);
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
