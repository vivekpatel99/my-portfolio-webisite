import { describe, it, expect } from 'vitest';
import { caseStudies, getCaseStudyBySlug, caseStudySlugs } from './caseStudies';

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
      expect(caseStudy.image).toHaveProperty('src');
      expect(caseStudy.image).toHaveProperty('alt');
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
});

describe('case study data validation', () => {
  it('should have valid image URLs', () => {
    caseStudies.forEach((caseStudy) => {
      expect(caseStudy.image.src).toBeTruthy();
      expect(typeof caseStudy.image.src).toBe('string');
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
});
