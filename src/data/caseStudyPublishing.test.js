import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  PUBLISHING_STATUS,
  publishCaseStudies,
  validateCaseStudyPublishing,
  validatePublishedClaimReferences,
} from './caseStudyPublishing';
import { caseStudies, caseStudyPublicationRecords } from './caseStudies';

const recordsFixture = () => structuredClone(caseStudyPublicationRecords);
const ledgerFixture = () => JSON.parse(readFileSync(resolve(process.cwd(), 'docs/claims/gate-1-claim-ledger.json'), 'utf8'));

describe('case-study publishing boundary', () => {
  it('exports only approved published portfolio-safe content', () => {
    const published = publishCaseStudies(recordsFixture());
    expect(published).toEqual(caseStudies);
    expect(published.map((study) => study.id)).not.toContain('withheld-case-study');
    expect(published.every((study) => study.story.relatedExperience.status === 'not-provided')).toBe(true);
    expect(published.every((study) => study.links.clientFeedback)).toBe(true);
    expect(published.every((study) => study.image.caption && study.image.label)).toBe(true);
  });

  it('keeps each unpublished browser record metadata-only', () => {
    const unpublished = caseStudyPublicationRecords.filter((record) => record.publishingStatus !== PUBLISHING_STATUS.PUBLISHED);
    expect(unpublished).toEqual([
      { id: 'withheld-case-study', publishingStatus: PUBLISHING_STATUS.DRAFT, publicationApproved: false },
    ]);
  });

  it('publishes no routes or cards when every record is withheld', () => {
    expect(publishCaseStudies([
      { id: 'withheld-case-study', publishingStatus: PUBLISHING_STATUS.DRAFT, publicationApproved: false },
    ])).toEqual([]);
  });

  it.each([
    ['a missing publishing status', (records) => { delete records[0].publishingStatus; }, /publishingStatus/],
    ['an unknown publishing status', (records) => { records[0].publishingStatus = 'reviewing'; }, /publishingStatus/],
    ['false publication approval', (records) => { records[0].publicationApproved = false; }, /publicationApproved/],
    ['private top-level published data', (records) => { records[0].privateClientData = 'do not bundle'; }, /published portfolio-safe envelope/],
    ['a missing portfolio-safe content envelope', (records) => { delete records[0].portfolioSafeContent; }, /portfolioSafeContent/],
    ['a missing story section', (records) => { delete records[0].portfolioSafeContent.story.evidence; }, /story.evidence/],
    ['unsafe media', (records) => { records[0].portfolioSafeContent.image = { ...records[0].portfolioSafeContent.image, kind: 'image', src: 'https://unsafe.example/visual.webp' }; }, /safe first-party asset path/],
    ['an unsafe link URL', (records) => { records[0].portfolioSafeContent.links.service[0].href = 'javascript:alert(1)'; }, /safe first-party path/],
    ['duplicate ids', (records) => { records[1].id = records[0].id; }, /duplicates another record/],
    ['duplicate published slugs', (records) => { records[1].portfolioSafeContent.slug = records[0].portfolioSafeContent.slug; }, /duplicates another published record/],
    ['draft content', (records) => { records[3].portfolioSafeContent = { secret: 'draft text' }; }, /metadata only/],
  ])('rejects %s', (_label, mutate, expectedMessage) => {
    const records = recordsFixture();
    mutate(records);
    expect(() => validateCaseStudyPublishing(records)).toThrow(expectedMessage);
  });

  it('rejects unknown, withheld, and wrong-placement published claim references', () => {
    const unknown = recordsFixture();
    unknown[0].portfolioSafeContent.claims[0].id = 'unknown-claim';
    expect(() => validatePublishedClaimReferences(unknown, ledgerFixture())).toThrow(/unknown claim/);

    const withheld = recordsFixture();
    withheld[0].portfolioSafeContent.claims[0].id = 'rate-eur-80';
    expect(() => validatePublishedClaimReferences(withheld, ledgerFixture())).toThrow(/non-public claim/);

    const wrongPlacement = recordsFixture();
    wrongPlacement[0].portfolioSafeContent.claims[0].placement = 'services';
    expect(() => validatePublishedClaimReferences(wrongPlacement, ledgerFixture())).toThrow(/not allowed/);
  });

  it('binds every published claim to the authoritative ledger without importing it into the browser schema', () => {
    expect(() => validatePublishedClaimReferences(recordsFixture(), ledgerFixture())).not.toThrow();
    const browserSchema = readFileSync(resolve(process.cwd(), 'src/data/caseStudyPublishing.js'), 'utf8');
    expect(browserSchema).not.toContain('gate-1-claim-ledger');
    expect(browserSchema).not.toContain('rate-eur-80');
  });
});
