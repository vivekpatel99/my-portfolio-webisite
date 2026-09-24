/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { collectionCaseStudies, eligibleCaseStudies, featuredCaseStudies, getCaseStudyBySlug } from '@/data/caseStudies';
import { selectFeaturedCaseStudies } from '@/lib/featuredCaseStudies';
import Portfolio from './Portfolio';

describe('Portfolio', () => {
  it('links portfolio cards to internal case studies', () => {
    render(
      <MemoryRouter>
        <Portfolio />
      </MemoryRouter>,
    );

    expect(screen.queryAllByRole('link', { name: /Read case study:/i })).toHaveLength(featuredCaseStudies.length);
    expect(featuredCaseStudies).toEqual(selectFeaturedCaseStudies(eligibleCaseStudies));
    expect(screen.getByRole('link', { name: `View all case studies (${collectionCaseStudies.length})` }).getAttribute('href')).toBe('/case-studies/');

    ['ai-project-planning-assistant', 'python-ci-workflow-automation'].forEach((slug) => {
      const story = getCaseStudyBySlug(slug);
      if (!story) return;
      expect(screen.queryByRole('heading', { name: story.cardTitle || story.title })).toBeNull();
    });

    featuredCaseStudies.forEach((caseStudy) => {
      const links = screen.getAllByRole('link', {
        name: `Read case study: ${caseStudy.cardTitle || caseStudy.title}`,
      });
      const cardLink = links.find((link) => link.getAttribute('href') === `/project/${caseStudy.slug}/`);
      expect(cardLink).toBeDefined();
      expect(cardLink.contains(screen.getByRole('heading', { name: caseStudy.cardTitle || caseStudy.title }))).toBe(true);
      if (caseStudy.image) expect(cardLink.contains(screen.getByAltText(caseStudy.image.alt))).toBe(true);
    });

  });

  describe('Detection Card design (Option A)', () => {
    it('displays section eyebrow as PORTFOLIO · CASE STUDIES meta line', () => {
      const { container } = render(
        <MemoryRouter>
          <Portfolio />
        </MemoryRouter>,
      );

      const eyebrow = container.querySelector('div[class*="border-b"][class*="border-[#8B5CF6]/35"]');
      expect(eyebrow).toBeTruthy();
      expect(eyebrow.textContent).toContain('PORTFOLIO ·');
      expect(eyebrow.textContent).toContain('CASE STUDIES');
      expect(eyebrow.className).toContain('font-mono');
      expect(eyebrow.className).toContain('tracking-[0.16em]');
      expect(eyebrow.className).toContain('uppercase');
      expect(eyebrow.className).toContain('border-b');
      expect(eyebrow.className).not.toContain('rounded-full');
      const purpleSpan = eyebrow.querySelector('span[class*="text-[#a78bfa]"]');
      expect(purpleSpan).toBeTruthy();
      expect(purpleSpan.textContent).toBe('CASE STUDIES');
    });
  });
});
