import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { caseStudies } from './caseStudies';
import { approvedProof, positioning, proofItems, serviceOffers } from './positioning';
import { defaultSeo, routeSeo } from '../lib/seoConfig';

const source = (file) => readFileSync(resolve(process.cwd(), file), 'utf8');
const documentedLedger = () => JSON.parse(source('docs/claims/gate-1-claim-ledger.json'));
const unsupportedPublicTerms = ['€80', '100% Job Success', '21+ Projects', '300+ Hours', '94% Faster', '40+ hours', '1-2 new projects', '30 days', '24 hours', '37s', '2.5s', 'Real-Time', 'real-time', '5★', '5-star', 'MAGNA', 'Expert', 'priceRange'];
const PUBLIC_CLASSIFICATIONS = new Set(['verified']);
const ledgerById = () => new Map(documentedLedger().map((claim) => [claim.id, claim]));

function assertRenderableClaim(ledger, { claimId, placement }) {
  const claim = ledger.get(claimId);
  if (!claim) throw new Error(`Unknown claim ID: ${claimId}`);
  if (!PUBLIC_CLASSIFICATIONS.has(claim.classification)) throw new Error(`Claim ${claimId} is not public`);
  if (!claim.allowedPlacement.includes(placement)) throw new Error(`Claim ${claimId} is not allowed in ${placement}`);
}

describe('Gate 1 claim ledger', () => {
  it('gives every retained claim a source, scope, placement, and disposition', () => {
    const ids = new Set();
    documentedLedger().forEach((claim) => {
      expect(ids.has(claim.id)).toBe(false);
      ids.add(claim.id);
      expect(['verified', 'related-credential', 'target-estimate', 'unsupported', 'approval-required']).toContain(claim.classification);
      expect(claim.provenance).toBeTruthy();
      expect(claim.scope).toBeTruthy();
      expect(claim.allowedPlacement.length).toBeGreaterThan(0);
      expect(claim.disposition).toBeTruthy();
    });
  });

  it('keeps published case-study claims tied to ledger entries and omits unapproved media', () => {
    const ledger = ledgerById();
    caseStudies.forEach((caseStudy) => {
      expect(caseStudy.claimIds.length).toBeGreaterThan(0);
      caseStudy.claimIds.forEach((id) => {
        expect(ledger.has(id)).toBe(true);
        expect(ledger.get(id)?.classification).toBe('verified');
        expect(ledger.get(id)?.allowedPlacement).toContain(caseStudy.claimPlacement);
      });
      expect(caseStudy.image?.src ?? '').not.toMatch(/invoice-ocr|planning-graph|football-tracking/);
      expect(caseStudy.gallery ?? []).not.toEqual(expect.arrayContaining([
        expect.objectContaining({ src: expect.stringMatching(/invoice-ocr|planning-graph|football-tracking/) }),
      ]));
    });
  });

  it('does not let unsupported performance, rate, SLA, or rating terms re-enter public consumers', () => {
    const publicSources = [
      'src/components/Hero.jsx', 'src/components/ProofStrip.jsx', 'src/components/Services.jsx',
      'src/components/About.jsx', 'src/components/Testimonials.jsx', 'src/components/CTA.jsx',
      'src/components/Footer.jsx', 'src/components/Portfolio.jsx', 'src/pages/Contact.jsx',
      'src/pages/Project.jsx',
      'src/components/ProjectFitDiagnostic.jsx', 'src/lib/projectFitDiagnostic.js',
      'src/data/positioning.js', 'src/data/caseStudies.js', 'src/lib/seoConfig.js', 'index.html',
    ].map(source).join('\n');

    unsupportedPublicTerms.forEach((term) => expect(publicSources).not.toContain(term));
  });

  it('keeps dynamic SEO and static root metadata aligned to the approved positioning', () => {
    const staticIndex = source('index.html');
    expect(staticIndex).toContain(defaultSeo.description);
    expect(staticIndex).toContain('AI Automation Engineer');
    expect(staticIndex).not.toContain('priceRange');
    expect(routeSeo['/contact'].description).toContain('documents, web data, or workflow');
    Object.values(routeSeo).forEach((seo) => {
      expect(unsupportedPublicTerms.some((term) => `${seo.title} ${seo.description}`.includes(term))).toBe(false);
    });

    const jsonLd = [...staticIndex.matchAll(/<script\s+type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g)]
      .map(([, payload]) => JSON.parse(payload));
    const professionalService = jsonLd.find((item) => item['@type'] === 'ProfessionalService');
    const person = jsonLd.find((item) => item['@type'] === 'Person');
    expect(professionalService?.areaServed).toBeUndefined();
    expect(person?.workLocation).toMatchObject({ '@type': 'Place', name: 'Europe' });
  });

  it('keeps a complete machine-readable inventory for withheld claims and their prior consumers', () => {
    const entries = documentedLedger();
    const ids = new Set(entries.map((entry) => entry.id));
    [
      'hero-quote', 'quote-card-1', 'quote-card-2', 'quote-card-3', 'quote-card-4',
      'five-star-presentation', 'rate-eur-80', 'n8n-hours-saved-target',
      'related-performance-94', 'related-performance-37s', 'related-performance-2-5s',
      'invoice-media-provenance', 'planning-graph-attribution', 'football-media-attribution',
      'professional-service-area-served-europe',
    ].forEach((id) => expect(ids.has(id)).toBe(true));
    entries.forEach((entry) => {
      expect(entry.priorAssertion).toBeTruthy();
      expect(entry.provenance).toBeTruthy();
      expect(entry.checkedOn).toBe('2026-09-06');
      expect(entry.allowedPlacement.length).toBeGreaterThan(0);
      expect(entry.consumers.length).toBeGreaterThan(0);
      expect(entry.disposition).toBeTruthy();
    });
  });

  it('uses the JSON ledger as the sole canonical record with complete neutral provenance', () => {
    expect(existsSync(resolve(process.cwd(), 'src/data/claimLedger.js'))).toBe(false);
    const ledger = ledgerById();
    for (const id of ['hero-quote', 'quote-card-1', 'quote-card-2', 'quote-card-3', 'quote-card-4']) {
      expect(ledger.get(id)?.priorAssertion).toContain('f410a04dfc8815223470d9f355f18ed4402dcdb3');
      expect(ledger.get(id)?.priorAssertion).toContain('src/components/');
    }
    const operatorRecord = source('docs/claims/gate-1-evidence-operations.md');
    for (const hash of [
      '4639366cabb8338538fa9ddc82eb182abf84e664df4f04fd12da3f9fa7a2b4be',
      '7fc40747358ec5e6d0c5b35ae4cbeeafca01e20457eba8ac1d52b5d2a53ac075',
      'abb26e0f346120c00553b010c572dea5885d925f53fff6ed6274262889699ba5',
      'e7032a2a1fe99f9cf30c77b7c570896e2e4d6fa2bde4cc73bd664c83846eef1b',
    ]) expect(operatorRecord).toContain(hash);
    expect(operatorRecord.match(/\b[a-f0-9]{64}\b/g)).toHaveLength(5);
  });

  it('rejects unknown, withheld, and wrong-placement claim references', () => {
    const ledger = ledgerById();
    expect(() => assertRenderableClaim(ledger, { claimId: 'missing-claim', placement: 'services' })).toThrow(/Unknown claim ID/);
    expect(() => assertRenderableClaim(ledger, { claimId: 'rate-eur-80', placement: 'hero credential' })).toThrow(/not public/);
    expect(() => assertRenderableClaim(ledger, { claimId: 'yolo-still-image-pose-estimation', placement: 'services' })).toThrow(/not allowed/);
    expect(() => assertRenderableClaim(ledger, { claimId: 'offer-workflow-automation', placement: 'services' })).not.toThrow();
  });

  it('maps every shared proof and service reference to an allowed canonical placement', () => {
    const ledger = ledgerById();
    assertRenderableClaim(ledger, { claimId: positioning.claimId, placement: 'services' });
    assertRenderableClaim(ledger, { claimId: positioning.claimId, placement: 'CTA' });
    assertRenderableClaim(ledger, { claimId: positioning.claimId, placement: 'footer' });
    assertRenderableClaim(ledger, { claimId: approvedProof.upwork.claimId, placement: 'hero credential' });
    proofItems.forEach((item) => assertRenderableClaim(ledger, {
      claimId: item.claimId,
      placement: item.claimId === approvedProof.upwork.claimId ? 'proof strip' : 'proof strip',
    }));
    serviceOffers.forEach((item) => assertRenderableClaim(ledger, { claimId: item.claimId, placement: 'services' }));
  });
});
