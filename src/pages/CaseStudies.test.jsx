/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import CaseStudies from './CaseStudies';

describe('CaseStudies', () => {
  afterEach(cleanup);

  it('provides a navigable collection page heading', () => {
    render(
      <MemoryRouter>
        <CaseStudies />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /selected case studies/i })).toBeTruthy();
  });

  it('renders other-work cards with collection return links', () => {
    render(
      <MemoryRouter>
        <CaseStudies />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'OTHER WORK' })).toBeTruthy();
    expect(screen.getByText('Published work outside the main extraction, OCR, and computer vision collection.')).toBeTruthy();

    expect(screen.getByRole('status').textContent).toMatch(/of 10 case studies/i);

    const section = screen.getByRole('region', { name: /other work/i });
    const hrefs = within(section).getAllByRole('link', { name: /Read case study:/ }).map((link) => link.getAttribute('href'));
    expect(hrefs).toHaveLength(2);
    expect(hrefs).toEqual(expect.arrayContaining([
      '/project/ai-project-planning-assistant/?from=collection',
      '/project/python-ci-workflow-automation/?from=collection',
    ]));

    const otherWorkHrefs = new Set(hrefs);
    const leaked = screen.getAllByRole('link', { name: /Read case study:/ }).filter((link) => (
      otherWorkHrefs.has(link.getAttribute('href')) && !section.contains(link)
    ));
    expect(leaked).toHaveLength(0);
  });
});
