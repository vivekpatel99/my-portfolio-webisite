/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import CaseStudyCard from './CaseStudyCard.js';

const LocationState = () => {
  const location = useLocation();
  return React.createElement('pre', null, JSON.stringify(location.state));
};

const project = {
  slug: 'synthetic-case-study',
  title: 'A deliberately long synthetic case-study title that should wrap safely',
  category: 'Automation',
  summary: 'A synthetic summary used to exercise the shared card.',
  completedAt: '2026-08',
  image: {
    alt: 'Synthetic case-study cover',
    src: '/synthetic-cover.png',
    width: 1280,
    height: 769,
  },
};

describe('CaseStudyCard', () => {
  afterEach(cleanup);

  it('renders one accessible router link with an unobstructed cover and aligned footer', () => {
    render(
      <MemoryRouter>
        <CaseStudyCard project={project} />
      </MemoryRouter>,
    );

    const cardLink = screen.getByRole('link', { name: `Read case study: ${project.title}` });
    expect(cardLink.getAttribute('href')).toBe(`/project/${project.slug}/`);
    expect(cardLink.getAttribute('href')).not.toContain('from=collection');
    expect(cardLink.contains(screen.getByRole('heading', { name: project.title }))).toBe(true);
    expect(cardLink.contains(screen.getByAltText(project.image.alt))).toBe(true);
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(screen.getByText('Read case study →')).toBeTruthy();
  });

  it('renders completion as readable semantic time text', () => {
    render(
      <MemoryRouter>
        <CaseStudyCard project={project} />
      </MemoryRouter>,
    );

    const completion = screen.getByRole('time', { name: 'Completed Aug 2026' });
    expect(completion.getAttribute('dateTime')).toBe('2026-08');
    expect(completion.textContent).toContain('Completed');
    expect(completion.textContent).toContain('Aug 2026');
  });

  it('uses the same abbreviated month format for other valid months', () => {
    render(
      <MemoryRouter>
        <CaseStudyCard project={{ ...project, completedAt: '2025-03' }} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('time', { name: 'Completed Mar 2025' }).textContent).toContain('Mar 2025');
  });

  it('marks collection-origin navigation in the href and history state', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<CaseStudyCard project={project} fromCollection />} />
          <Route path="/project/:projectId/" element={<LocationState />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: `Read case study: ${project.title}` }).getAttribute('href')).toBe(
      `/project/${project.slug}/?from=collection`,
    );
    await user.click(screen.getByRole('link', { name: `Read case study: ${project.title}` }));
    expect(JSON.parse(screen.getByText(/fromCollection/).textContent)).toEqual({ fromCollection: true });
  });

  it('leaves homepage cards unmarked so they keep the default article return', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<CaseStudyCard project={project} />} />
          <Route path="/project/:projectId/" element={<LocationState />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('link', { name: `Read case study: ${project.title}` }));
    expect(screen.getByText('null')).toBeTruthy();
  });

  it('omits the completion date when content does not provide one', () => {
    render(
      <MemoryRouter>
        <CaseStudyCard project={{ ...project, completedAt: undefined }} />
      </MemoryRouter>,
    );

    expect(screen.queryByRole('time')).toBeNull();
    expect(screen.queryByText(/Completed|unavailable|approx/i)).toBeNull();
  });
});
