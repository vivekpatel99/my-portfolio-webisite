/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
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
    expect(screen.queryAllByRole('article')).toHaveLength(0);
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
