/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { CASE_STUDY_BROWSING_STORAGE_KEY } from '../lib/caseStudyBrowsing.js';
import OngoingCaseStudies from './OngoingCaseStudies.js';

const zeta = {
  slug: 'zeta-prototype',
  title: 'Zeta prototype',
  summary: 'A later prototype.',
  projectStatus: 'ongoing',
  completedAt: '1999-01',
};
const alpha = {
  slug: 'alpha-prototype',
  title: 'Alpha prototype',
  projectStatus: 'ongoing',
};

afterEach(() => {
  cleanup();
  sessionStorage.clear();
});

describe('OngoingCaseStudies', () => {
  it('renders nothing when there are no ongoing stories', () => {
    const { container } = render(<OngoingCaseStudies stories={[]} />);
    expect(container.firstChild).toBeNull();
    expect(screen.queryByRole('heading', { name: 'In progress' })).toBeNull();
    expect(document.getElementById('in-progress')).toBeNull();
    expect(screen.queryByRole('link', { name: /in progress/i })).toBeNull();
  });

  it('handles an empty list becoming populated and empty again', () => {
    const { container, rerender } = render(<MemoryRouter><OngoingCaseStudies stories={[]} /></MemoryRouter>);
    expect(container.textContent).toBe('');
    rerender(<MemoryRouter><OngoingCaseStudies stories={[zeta]} /></MemoryRouter>);
    expect(screen.getByRole('link', { name: /Zeta prototype/ }).getAttribute('href')).toBe('/project/zeta-prototype/');
    rerender(<MemoryRouter><OngoingCaseStudies stories={[]} /></MemoryRouter>);
    expect(container.textContent).toBe('');
  });

  it('links each title with a visible In progress label and an optional summary', () => {
    const { container } = render(
      <MemoryRouter>
        <OngoingCaseStudies stories={[zeta, alpha]} />
      </MemoryRouter>,
    );
    const region = document.getElementById('in-progress');
    expect(screen.getByRole('heading', { level: 2, name: 'In progress' }).id).toBe('ongoing-case-studies-heading');
    expect(region.getAttribute('aria-labelledby')).toBe('ongoing-case-studies-heading');
    expect(region.querySelector('.detection-label').textContent).toBe('WORK IN PROGRESS');
    expect(region.querySelector('.detection-label').getAttribute('aria-hidden')).toBe('true');
    expect(region.textContent).toContain('Prototype work with unfinished features.');

    const links = within(region).getAllByRole('link');
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/project/zeta-prototype/',
      '/project/alpha-prototype/',
    ]);
    expect(links[0].textContent).toContain('Zeta prototype');
    expect(links[0].textContent).toContain('In progress');
    expect(links[0].textContent).toContain('A later prototype.');
    expect(links[1].textContent).toContain('Alpha prototype');
    expect(links[1].textContent).toContain('In progress');
    expect(links[1].textContent).not.toContain('A later prototype.');
    for (const link of links) {
      expect(link.getAttribute('href')).not.toContain('from=');
      expect(link.getAttribute('aria-label')).toBeNull();
      expect(link.textContent).not.toMatch(/Read case study:/);
    }
    expect(screen.queryByRole('link', { name: /^Read case study:/ })).toBeNull();
    expect(region.querySelector('article')).toBeNull();
    expect(region.querySelector('time')).toBeNull();
    expect(container.textContent).not.toMatch(/1999|Jan|January|Completed/);
  });

  it('does not write collection browsing state when a link is activated', () => {
    render(
      <MemoryRouter>
        <OngoingCaseStudies stories={[alpha]} />
      </MemoryRouter>,
    );
    const link = screen.getByRole('link', { name: /Alpha prototype/ });
    link.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(sessionStorage.getItem(CASE_STUDY_BROWSING_STORAGE_KEY)).toBeNull();
  });

  it('keeps a plain project href in static markup', () => {
    const markup = renderToStaticMarkup(<OngoingCaseStudies stories={[alpha]} />);
    expect(markup).toContain('href="/project/alpha-prototype/"');
    expect(markup).toContain('In progress');
    expect(markup).not.toContain('from=collection');
    expect(markup).not.toContain('<article');
    expect(markup).not.toContain('<time');
  });
});
