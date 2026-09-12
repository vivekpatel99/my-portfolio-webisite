import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { caseStudies, eligibleCaseStudies, eligibleCaseStudyCount, getCaseStudyBySlug, caseStudySlugs, primaryContactHref } from './caseStudies';
import { routeSeo } from '../lib/seoConfig';
import { deploymentHtaccess } from '../../plugins/vite-plugin-case-study-publication.js';

describe('caseStudies data structure', () => {
  it('is an array, including when publication has no published records', () => {
    expect(Array.isArray(caseStudies)).toBe(true);
  });

  it('derives the collection set and count from completed project status', () => {
    expect(eligibleCaseStudyCount).toBe(eligibleCaseStudies.length);
    expect(eligibleCaseStudies).toEqual(caseStudies.filter((caseStudy) => caseStudy.projectStatus === 'completed'));
    expect(eligibleCaseStudies.every((caseStudy) => caseStudy.projectStatus === 'completed')).toBe(true);
  });

  it('should have required fields for each case study', () => {
    caseStudies.forEach((caseStudy) => {
      expect(caseStudy).toHaveProperty('id');
      expect(caseStudy).toHaveProperty('slug');
      expect(caseStudy).toHaveProperty('title');
      expect(caseStudy).toHaveProperty('summary');
      expect(caseStudy.sections).toHaveLength(3);
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
  it('should return the correct case study for every valid slug', () => {
    caseStudies.forEach((caseStudy) => {
      const result = getCaseStudyBySlug(caseStudy.slug);
      expect(result).toBeDefined();
      expect(result.slug).toBe(caseStudy.slug);
    });
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
    caseStudies.forEach((caseStudy) => {
      const uppercaseSlug = caseStudy.slug.toUpperCase();
      if (caseStudy.slug !== uppercaseSlug) expect(getCaseStudyBySlug(uppercaseSlug)).toBeUndefined();
    });
  });

  it('should return the exact object from the array', () => {
    caseStudies.forEach((caseStudy) => expect(getCaseStudyBySlug(caseStudy.slug)).toBe(caseStudy));
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

  it('matches the generated Apache project allowlist and routeSeo keys', () => {
    const template = readFileSync(resolve(process.cwd(), 'public/.htaccess'), 'utf8');
    const htaccess = deploymentHtaccess(template, caseStudySlugs);
    const match = htaccess.match(/RewriteRule \^project\/\(([^)]+)\)/);
    if (caseStudySlugs.length === 0) {
      expect(htaccess).toContain('RewriteRule ^project/ - [R=404,L]');
    } else {
      expect(match).toBeTruthy();
      expect(match[1].split('|').sort()).toEqual([...caseStudySlugs].sort());
    }
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

  it('generates an optional trailing slash in the Apache project rule', () => {
    const htaccess = deploymentHtaccess(readFileSync(resolve(process.cwd(), 'public/.htaccess'), 'utf8'), caseStudySlugs);
    if (caseStudySlugs.length === 0) expect(htaccess).toContain('RewriteRule ^project/ - [R=404,L]');
    else expect(htaccess).toMatch(/RewriteRule \^project\/\([^)]+\)\/\?\$/);
  });

  it('uses a trailing slash on the primary contact href', () => {
    expect(primaryContactHref).toBe('/contact/');
  });
});

describe('case study data validation', () => {
  it('should have valid image URLs', () => {
    caseStudies.forEach((caseStudy) => {
      if (caseStudy.image) {
        expect(caseStudy.image.src).toBeTruthy();
        expect(typeof caseStudy.image.src).toBe('string');
      }
    });
  });

  it('should have non-empty alt text for images', () => {
    caseStudies.forEach((caseStudy) => {
      if (caseStudy.image) expect(caseStudy.image.alt).toBeTruthy();
    });
  });
});
