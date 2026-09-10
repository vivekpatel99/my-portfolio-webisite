/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { caseStudies } from '@/data/caseStudies';
import Portfolio from './Portfolio';

describe('Portfolio', () => {
  it('links portfolio cards to internal case studies', () => {
    render(
      <MemoryRouter>
        <Portfolio />
      </MemoryRouter>,
    );

    caseStudies.forEach((caseStudy) => {
      const links = screen.getAllByRole('link', {
        name: `Read case study: ${caseStudy.title}`,
      });
      const cardLink = links.find((link) => link.getAttribute('href') === `/project/${caseStudy.slug}/`);
      expect(cardLink).toBeDefined();
      expect(cardLink.contains(screen.getByRole('heading', { name: caseStudy.title }))).toBe(true);
      if (caseStudy.image) expect(cardLink.contains(screen.getByAltText(caseStudy.image.alt))).toBe(true);
    });

    if (caseStudies.length === 0) expect(screen.queryAllByRole('link', { name: /read case study:/i })).toHaveLength(0);
  });
});
