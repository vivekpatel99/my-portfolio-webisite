/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { clearBrowsingState } from '../lib/caseStudyBrowsing.js';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import CaseStudies from './CaseStudies';

describe('CaseStudies', () => {
  afterEach(() => {
    cleanup();
    clearBrowsingState({ storage: sessionStorage });
    history.replaceState(null, '');
  });

  it('provides a navigable collection page heading', () => {
    render(
      <MemoryRouter>
        <CaseStudies />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /selected case studies/i })).toBeTruthy();
  });

  it('loads all twelve collection cards with return links and no separate Other Work section', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><CaseStudies /></MemoryRouter>);
    expect(screen.queryByRole('heading', { name: 'OTHER WORK' })).toBeNull();
    expect(screen.queryByRole('region', { name: /other work/i })).toBeNull();
    expect(screen.getByRole('status').textContent).toBe('Showing 6 of 12 case studies');
    await user.click(screen.getByRole('button', { name: 'Load more' }));
    expect(screen.getByRole('status').textContent).toBe('Showing 12 of 12 case studies');
    const grid = document.querySelector('[id^="case-study-grid-"]');
    const hrefs = within(grid).getAllByRole('link', { name: /Read case study:/ }).map((link) => link.getAttribute('href'));
    expect(hrefs).toHaveLength(12);
    expect(hrefs.every((href) => href.endsWith('/?from=collection'))).toBe(true);
    for (const slug of ['ai-project-planning-assistant', 'python-ci-workflow-automation']) {
      expect(hrefs.filter((href) => href === `/project/${slug}/?from=collection`)).toHaveLength(1);
    }
  });
});
