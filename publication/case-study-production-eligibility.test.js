// @vitest-environment node
import { caseStudyPublicationBaseline } from './case-study-manifest.js';
import { describe, expect, it } from 'vitest';
import { compileCaseStudyPublication, renderPublicCaseStudyModule } from './compile-case-studies.js';

describe('retained completed case studies', () => {
  it('includes the approved twelve-story library in the collection and keeps three featured stories', async () => {
    const publication = compileCaseStudyPublication();
    const module = await import(`data:text/javascript;base64,${Buffer.from(renderPublicCaseStudyModule(publication)).toString('base64')}`);
    const otherWorkSlugs = ['ai-project-planning-assistant', 'python-ci-workflow-automation'];
    expect(module.collectionCaseStudies).toHaveLength(10);
    expect(module.otherWorkCaseStudies).toHaveLength(2);
    expect(module.otherWorkCaseStudies.map((story) => story.slug).sort()).toEqual([...otherWorkSlugs].sort());
    expect(new Set(module.collectionCaseStudies.map((story) => story.slug)).size).toBe(10);
    expect(module.collectionCaseStudies.every((story) => story.projectStatus === 'completed' && /^\d{4}-\d{2}$/.test(story.completedAt))).toBe(true);
    expect(module.otherWorkCaseStudies.every((story) => story.projectStatus === 'completed')).toBe(true);
    expect(module.eligibleCaseStudies).toHaveLength(12);
    expect(module.eligibleCaseStudyCount).toBe(module.eligibleCaseStudies.length);
    expect(module.featuredCaseStudies).toHaveLength(3);
    expect(module.featuredCaseStudies.filter((story) => otherWorkSlugs.includes(story.slug))).toEqual([]);
    expect(module.getCaseStudyBySlug('ai-project-planning-assistant')?.slug).toBe('ai-project-planning-assistant');
    expect(module.getCaseStudyBySlug('python-ci-workflow-automation')?.slug).toBe('python-ci-workflow-automation');
    expect(module.caseStudySlugs).toEqual(expect.arrayContaining(otherWorkSlugs));
    expect(module.caseStudySlugs).toHaveLength(12);
    expect(module.caseStudySlugs).toContain('healthcare-document-intelligence');
    expect(module.caseStudySlugs).toContain('ai-invoice-processing-automation');
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
