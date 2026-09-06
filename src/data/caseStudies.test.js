import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { caseStudies, caseStudyPublicationRecords, getCaseStudyBySlug, caseStudySlugs, primaryContactHref } from './caseStudies';
import { routeSeo } from '../lib/seoConfig';

describe('caseStudies data structure', () => {
  it('should have at least one case study', () => {
    expect(caseStudies.length).toBeGreaterThan(0);
  });

  it('should have required fields for each case study', () => {
    caseStudies.forEach((caseStudy) => {
      expect(caseStudy).toHaveProperty('id');
      expect(caseStudy).toHaveProperty('slug');
      expect(caseStudy).toHaveProperty('cardTitle');
      expect(caseStudy).toHaveProperty('image');
      expect(caseStudy.image).toHaveProperty('alt');
      expect(caseStudy.image).toHaveProperty('label');
      expect(caseStudy.image).toHaveProperty('caption');
      expect(['image', 'schematic']).toContain(caseStudy.image.kind);
      if (caseStudy.image.kind === 'image') {
        expect(caseStudy.image).toHaveProperty('src');
      }
      expect(caseStudy).toHaveProperty('claimIds');
      expect(caseStudy).toHaveProperty('claimPlacement');
      expect(caseStudy).toHaveProperty('story');
      ['situation', 'constraints', 'interpretationNotice', 'decisions', 'approach', 'evidence', 'result', 'limitations', 'relatedExperience'].forEach((section) => {
        expect(caseStudy.story).toHaveProperty(section);
      });
      expect(caseStudy.story.relatedExperience.status).toBe('not-provided');
      expect(caseStudy).toHaveProperty('links');
    });
  });

  it('should have unique slugs', () => {
    const slugs = caseStudies.map(cs => cs.slug);
    const uniqueSlugs = new Set(slugs);
    expect(uniqueSlugs.size).toBe(slugs.length);
  });

  it('should have unique ids', () => {
    const ids = caseStudies.map(cs => cs.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});

describe('getCaseStudyBySlug', () => {
  it('should return the correct case study for a valid slug', () => {
    const firstSlug = caseStudies[0].slug;
    const result = getCaseStudyBySlug(firstSlug);
    expect(result).toBeDefined();
    expect(result.slug).toBe(firstSlug);
  });

  it('should return undefined for an invalid slug', () => {
    const result = getCaseStudyBySlug('non-existent-slug-12345');
    expect(result).toBeUndefined();
  });

  it('should return undefined for empty string', () => {
    const result = getCaseStudyBySlug('');
    expect(result).toBeUndefined();
  });

  it('should return undefined for null', () => {
    const result = getCaseStudyBySlug(null);
    expect(result).toBeUndefined();
  });

  it('should be case-sensitive', () => {
    const firstSlug = caseStudies[0].slug;
    const uppercaseSlug = firstSlug.toUpperCase();
    
    if (firstSlug !== uppercaseSlug) {
      const result = getCaseStudyBySlug(uppercaseSlug);
      expect(result).toBeUndefined();
    }
  });

  it('should return the exact object from the array', () => {
    const firstCaseStudy = caseStudies[0];
    const result = getCaseStudyBySlug(firstCaseStudy.slug);
    expect(result).toBe(firstCaseStudy);
  });
});

describe('caseStudySlugs', () => {
  it('should be an array of all slugs', () => {
    expect(Array.isArray(caseStudySlugs)).toBe(true);
    expect(caseStudySlugs.length).toBe(caseStudies.length);
  });

  it('should contain all case study slugs', () => {
    caseStudies.forEach((caseStudy) => {
      expect(caseStudySlugs).toContain(caseStudy.slug);
    });
  });

  it('matches the Apache project allowlist and routeSeo keys', () => {
    const htaccess = readFileSync(resolve(process.cwd(), 'public/.htaccess'), 'utf8');
    const match = htaccess.match(/RewriteRule \^project\/\(([^)]+)\)/);
    expect(match).toBeTruthy();
    expect(match[1].split('|').sort()).toEqual([...caseStudySlugs].sort());
    expect(htaccess).not.toContain('social-media-app');

    const projectKeys = Object.keys(routeSeo)
      .filter((key) => key.startsWith('/project/'))
      .map((key) => key.replace('/project/', ''))
      .sort();
    expect(projectKeys).toEqual([...caseStudySlugs].sort());
  });

  it('keeps routeSeo path in sync with its route key', () => {
    Object.entries(routeSeo)
      .filter(([key]) => key.startsWith('/project/'))
      .forEach(([key, seo]) => {
        expect(seo.path).toBe(key);
      });
  });

  it('does not mention social-media-app in data or SEO', () => {
    expect(caseStudySlugs).not.toContain('social-media-app');
    expect(Object.keys(routeSeo).join(' ')).not.toContain('social-media-app');
  });

  it('does not expose unpublished records through cards, routes, SEO, or public slugs', () => {
    const unpublishedIds = caseStudyPublicationRecords
      .filter((record) => record.publishingStatus !== 'published')
      .map((record) => record.id);
    expect(unpublishedIds).toContain('withheld-case-study');
    expect(caseStudies.map((study) => study.id)).not.toEqual(expect.arrayContaining(unpublishedIds));
    expect(caseStudySlugs).not.toContain('withheld-case-study');
    expect(Object.keys(routeSeo)).not.toContain('/project/withheld-case-study');
  });

  it('allows an optional trailing slash in the Apache project rule', () => {
    const htaccess = readFileSync(resolve(process.cwd(), 'public/.htaccess'), 'utf8');
    expect(htaccess).toMatch(/RewriteRule \^project\/\([^)]+\)\/\?\$/);
  });

  it('uses a trailing slash on the primary contact href', () => {
    expect(primaryContactHref).toBe('/contact/');
  });
});

describe('case study data validation', () => {
  it('should have valid image URLs', () => {
    caseStudies.forEach((caseStudy) => {
      if (caseStudy.image.kind === 'image') {
        expect(caseStudy.image.src).toBeTruthy();
        expect(typeof caseStudy.image.src).toBe('string');
      }
    });
  });

  it('should have non-empty alt text for images', () => {
    caseStudies.forEach((caseStudy) => {
      expect(caseStudy.image.alt).toBeTruthy();
      expect(typeof caseStudy.image.alt).toBe('string');
      expect(caseStudy.image.alt.length).toBeGreaterThan(0);
    });
  });

  it('should have gallery items if gallery exists', () => {
    caseStudies.forEach((caseStudy) => {
      if (caseStudy.gallery) {
        expect(Array.isArray(caseStudy.gallery)).toBe(true);
        caseStudy.gallery.forEach((item) => {
          expect(item).toHaveProperty('src');
          expect(item).toHaveProperty('alt');
          expect(item.alt).toBeTruthy();
        });
      }
    });
  });

  it('should have valid stack array', () => {
    caseStudies.forEach((caseStudy) => {
      if (caseStudy.stack) {
        expect(Array.isArray(caseStudy.stack)).toBe(true);
        expect(caseStudy.stack.length).toBeGreaterThan(0);
        caseStudy.stack.forEach((tech) => {
          expect(typeof tech).toBe('string');
          expect(tech.length).toBeGreaterThan(0);
        });
      }
    });
  });

  it('uses only evidence-backed claim IDs and no unsupported metric grid', () => {
    const ledger = JSON.parse(readFileSync(resolve(process.cwd(), 'docs/claims/gate-1-claim-ledger.json'), 'utf8'));
    const ledgerIds = new Set(ledger.filter((claim) => claim.classification === 'verified').map((claim) => claim.id));
    caseStudies.forEach((caseStudy) => {
      expect(caseStudy.stats).toBeUndefined();
      caseStudy.claimIds.forEach((id) => expect(ledgerIds.has(id)).toBe(true));
    });
  });
});
