/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { StaticRouter } from 'react-router-dom/server';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import CaseStudyCollection from './CaseStudyCollection.js';

const stories = [
  { slug: 'newer', title: 'Newer synthetic story', summary: 'Newer summary', completedAt: '2026-08' },
  { slug: 'older', title: 'Older synthetic story', summary: 'Older summary', completedAt: '2024-01' },
];

describe('CaseStudyCollection', () => {
  afterEach(cleanup);

  it('renders the supplied stories in completion order in a responsive grid', () => {
    const { container } = render(
      <MemoryRouter>
        <CaseStudyCollection stories={stories} />
      </MemoryRouter>,
    );

    const cards = screen.getAllByRole('article');
    expect(cards.map((card) => card.querySelector('h3').textContent)).toEqual(['Newer synthetic story', 'Older synthetic story']);
    expect(container.querySelector('.grid.grid-cols-1')).toBeTruthy();
    expect(container.querySelector('.md\\:grid-cols-2.lg\\:grid-cols-3')).toBeTruthy();
  });

  it('renders a readable empty state', () => {
    render(
      <MemoryRouter>
        <CaseStudyCollection stories={[]} />
      </MemoryRouter>,
    );

    expect(screen.getByText('No case studies are available yet.')).toBeTruthy();
    expect(screen.getByRole('status').textContent).toBe('Showing 0 of 0 case studies');
    expect(screen.queryAllByRole('article')).toHaveLength(0);
  });

  it.each([3, 4, 6])('shows all %i stories without a redundant loading control', (count) => {
    const smallStories = Array.from({ length: count }, (_, index) => ({
      slug: `small-${index}`,
      title: `Small synthetic story ${index}`,
      summary: 'Synthetic summary',
      completedAt: '2025-01',
    }));
    render(<MemoryRouter><CaseStudyCollection stories={smallStories} /></MemoryRouter>);

    expect(screen.getAllByRole('article')).toHaveLength(count);
    expect(screen.getByRole('status').textContent).toBe(`Showing ${count} of ${count} case studies`);
    expect(screen.queryByRole('button', { name: /load more|all case studies shown/i })).toBeNull();
  });

  it('loads twenty stories in 6, 12, 18, 20 increments and retains button focus', async () => {
    const user = userEvent.setup();
    const manyStories = Array.from({ length: 20 }, (_, index) => ({
      slug: `many-${index}`,
      title: `Many synthetic story ${index}`,
      summary: 'Synthetic summary',
      completedAt: '2025-01',
    }));
    render(<MemoryRouter><CaseStudyCollection stories={manyStories} /></MemoryRouter>);
    const button = screen.getByRole('button', { name: 'Load more' });

    for (const expected of [6, 12, 18]) {
      expect(screen.getAllByRole('article')).toHaveLength(expected);
      expect(screen.getByRole('status').textContent).toBe(`Showing ${expected} of 20 case studies`);
      await user.click(button);
      expect(document.activeElement).toBe(button);
    }

    expect(screen.getAllByRole('article')).toHaveLength(20);
    expect(screen.getByRole('status').textContent).toBe('Showing 20 of 20 case studies');
    expect(screen.getByRole('button', { name: 'All case studies shown' })).toBe(button);
    expect(button.disabled).toBe(true);
    expect(document.activeElement).toBe(button);
  });

  it('loads thirty stories in six-card increments until exhausted', async () => {
    const user = userEvent.setup();
    const stories30 = Array.from({ length: 30 }, (_, index) => ({
      slug: `thirty-${index}`,
      title: `Thirty synthetic story ${index}`,
      summary: 'Synthetic summary',
      completedAt: '2025-01',
    }));
    render(<MemoryRouter><CaseStudyCollection stories={stories30} /></MemoryRouter>);
    const button = screen.getByRole('button', { name: 'Load more' });

    for (const expected of [12, 18, 24, 30]) {
      await user.click(button);
      expect(screen.getAllByRole('article')).toHaveLength(expected);
    }
    expect(screen.getByRole('button', { name: 'All case studies shown' }).disabled).toBe(true);
  });

  it('keeps a numeric history snapshot across collection rerenders', async () => {
    const user = userEvent.setup();
    const stories20 = Array.from({ length: 20 }, (_, index) => ({
      slug: `snapshot-${index}`,
      title: `Snapshot synthetic story ${index}`,
      summary: 'Synthetic summary',
      completedAt: '2025-01',
    }));
    render(<MemoryRouter><CaseStudyCollection stories={stories20} /></MemoryRouter>);

    expect(window.history.state.caseStudyCollection).toEqual({ loadedCount: 6, scrollY: 0 });
    await user.click(screen.getByRole('button', { name: 'Load more' }));
    expect(window.history.state.caseStudyCollection).toEqual({ loadedCount: 6, scrollY: 0 });
  });

  it('renders through a StaticRouter for server generated markup', () => {
    const markup = renderToStaticMarkup(
      <StaticRouter location="/case-studies">
        <CaseStudyCollection stories={[stories[0]]} />
      </StaticRouter>,
    );

    expect(markup).toContain('Newer synthetic story');
    expect(markup).toContain('href="/project/newer/"');
  });
});
