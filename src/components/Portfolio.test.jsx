/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { eligibleCaseStudies, eligibleCaseStudyCount, featuredCaseStudies } from '@/data/caseStudies';
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
    expect(screen.getByRole('link', { name: `View all case studies (${eligibleCaseStudyCount})` }).getAttribute('href')).toBe('/case-studies/');

    featuredCaseStudies.forEach((caseStudy) => {
      const links = screen.getAllByRole('link', {
        name: `Read case study: ${caseStudy.title}`,
      });
      const cardLink = links.find((link) => link.getAttribute('href') === `/project/${caseStudy.slug}/`);
      expect(cardLink).toBeDefined();
      expect(cardLink.contains(screen.getByRole('heading', { name: caseStudy.title }))).toBe(true);
      if (caseStudy.image) expect(cardLink.contains(screen.getByAltText(caseStudy.image.alt))).toBe(true);
    });

  });
});
