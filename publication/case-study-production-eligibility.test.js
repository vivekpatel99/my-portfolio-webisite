// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { compileCaseStudyPublication, renderPublicCaseStudyModule } from './compile-case-studies.js';

// ponytail: pins the known empty-collection state until issue #80 supplies real
// completion months (no invented dates). Fails loudly when dates land so this
// expectation gets updated alongside the manifest.
describe('production manifest eligibility (issue #80 pending)', () => {
  it('documents that no published record is collection-eligible without real completion months', async () => {
    const publication = compileCaseStudyPublication();
    expect(publication.length).toBeGreaterThan(0);
    expect(publication.every((record) => record.projectStatus === undefined && record.completedAt === undefined)).toBe(true);
    const rendered = renderPublicCaseStudyModule(publication);
    const module = await import(`data:text/javascript;base64,${Buffer.from(rendered).toString('base64')}`);
    expect(module.eligibleCaseStudyCount).toBe(0);
    expect(module.collectionCaseStudies).toHaveLength(0);
  });
});
