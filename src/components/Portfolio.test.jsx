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
});
