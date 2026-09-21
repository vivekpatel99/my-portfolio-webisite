// @vitest-environment node
import { caseStudyPublicationBaseline } from './case-study-manifest.js';
import { describe, expect, it } from 'vitest';
import { compileCaseStudyPublication, renderPublicCaseStudyModule } from './compile-case-studies.js';
import { routeSeo } from '../src/lib/seoConfig.js';

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

  it('keeps the healthcare slug on schedule-PDF copy that is not clinical EHR', () => {
    const slug = 'healthcare-document-intelligence';
    const summary = 'A Python extractor turns color-coded schedule PDFs into Excel rows. Not clinical EHR. Not medical records.';
    const publication = compileCaseStudyPublication();
    const story = publication.find((record) => record.slug === slug);
    expect(story).toBeDefined();
    expect(story.id).toBe(slug);
    expect(story.title).toBe('Color-Coded Schedule PDFs to Reviewable Excel Rows');
    expect(story.summary).toBe(summary);
    expect(publication.map((record) => record.slug)).not.toContain('schedule-pdf-to-excel');
    expect(publication.filter((record) => record.slug === slug)).toHaveLength(1);

    const seo = routeSeo[`/project/${slug}`];
    expect(seo.description).toBe(summary);
    expect(seo.path).toBe(`/project/${slug}`);
    expect(seo.title).toContain(story.title);

    const problem = JSON.stringify(story.sections.find((section) => section.key === 'problem'));
    const outcome = JSON.stringify(story.sections.find((section) => section.key === 'outcome'));
    expect(problem).toMatch(/staff schedule PDFs/i);
    expect(problem).toMatch(/not clinical EHR or medical records/i);
    expect(outcome).toMatch(/scheduling coordinator/i);
    expect(outcome).toMatch(/not clinical EHR or medical records/i);
    expect(outcome).toContain('No measured accuracy figure is claimed.');
    expect(`${story.title} ${story.summary} ${problem} ${outcome}`).not.toMatch(/healthcare document intelligence/i);
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
