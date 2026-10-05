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

  it('renders one accessible router link containing the cover and title', () => {
    render(
      <MemoryRouter>
        <CaseStudyCard project={project} />
      </MemoryRouter>,
    );

    const cardLink = screen.getByRole('link', { name: `Read case study: ${project.title}` });
    expect(cardLink.getAttribute('href')).toBe(`/project/${project.slug}/`);
    expect(cardLink.getAttribute('href')).not.toContain('from=collection');
    expect(cardLink.contains(screen.getByRole('heading', { level: 3, name: project.title }))).toBe(true);
    expect(cardLink.contains(screen.getByAltText(project.image.alt))).toBe(true);
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  it('uses a bounded display derivative for a published cover', () => {
    const image = {
      alt: 'Published workflow cover',
      src: '/assets/case-studies/ai-invoice-processing-automation-f36fee637d46a13baffb79337b87cb4ac1f7a1a6d29a330be71e4217a1633275.png',
      width: 2448,
      height: 684,
    };
    render(<MemoryRouter><CaseStudyCard project={{ ...project, image }} /></MemoryRouter>);

    const cover = screen.getByAltText(image.alt);
    expect(cover.getAttribute('src')).toBe('/assets/case-studies/case-study-display-f36fee637d46-5ad6c7685bd1.webp');
    expect(cover.getAttribute('src')).not.toBe(image.src);
    expect(cover.getAttribute('width')).toBe(String(image.width));
    expect(cover.getAttribute('height')).toBe(String(image.height));
    expect(cover.getAttribute('loading')).toBe('lazy');
    expect(cover.className).toContain('object-cover');
  });

  it('loads an explicitly prioritized cover eagerly with high fetch priority', () => {
    render(<MemoryRouter><CaseStudyCard project={project} priorityImage /></MemoryRouter>);

    const cover = screen.getByAltText(project.image.alt);
    expect(cover.getAttribute('loading')).toBe('eager');
    expect(cover.getAttribute('fetchpriority')).toBe('high');
  });

  it('keeps the Upwork destination separate from the full-card article link', () => {
    render(<MemoryRouter><CaseStudyCard project={{ ...project, cardTitle: 'Reference card title', externalLinks: [{ label: 'Upwork project', href: 'https://www.upwork.com/example' }] }} /></MemoryRouter>);
    const articleLink = screen.getByRole('link', { name: 'Read case study: Reference card title' });
    const upwork = screen.getByRole('link', { name: 'Upwork project' });
    expect(screen.getByRole('heading', { name: 'Reference card title' })).toBeTruthy();
    expect(articleLink.contains(upwork)).toBe(false);
    expect(upwork.getAttribute('href')).toBe('https://www.upwork.com/example');
    expect(upwork.getAttribute('rel')).toContain('noopener');
    expect(screen.getAllByRole('link')).toHaveLength(2);
  });

  it('renders completion as readable semantic time text' , () => {
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
    expect(screen.getByRole('heading', { level: 3, name: project.title })).toBeTruthy();
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

  describe('Detection Card design (Option A)', () => {
    it('keeps the labeled panel unclipped while its cover remains cropped', () => {
      const { container } = render(
        <MemoryRouter>
          <CaseStudyCard project={project} />
        </MemoryRouter>,
      );

      const article = container.querySelector('article');
      expect(article.className).toContain('detection-panel');
      expect(article.className).not.toContain('overflow-hidden');
      expect(article.querySelector('.media').className).toContain('overflow-hidden');
    });

    it('places category and CASE STUDY once on the panel edge', () => {
      const { container } = render(
        <MemoryRouter>
          <CaseStudyCard project={project} />
        </MemoryRouter>,
      );

      const article = container.querySelector('article');
      const label = article.querySelector('.cat');
      expect(label.parentElement).toBe(article);
      expect(label.textContent).toBe(`${project.category.toUpperCase()} · CASE STUDY`);
      expect(article.querySelector('.media-meta .cat')).toBeNull();
      expect(article.querySelectorAll('.cat')).toHaveLength(1);
    });

    it('preserves a visible focus boundary on the interactive panel', () => {
      const { container } = render(
        <MemoryRouter>
          <CaseStudyCard project={project} />
        </MemoryRouter>,
      );

      const article = container.querySelector('article');
      expect(article.className).toContain('focus-within:outline-2');
      expect(article.className).not.toContain('border-[rgba(139,92,246,0.4)]');
      expect(article.className).not.toContain('rounded-lg');
    });

    it('renders geometric arrow glyph as SVG not filled circle with text', () => {
      const { container } = render(
        <MemoryRouter>
          <CaseStudyCard project={project} />
        </MemoryRouter>,
      );

      const glyphContainer = container.querySelector('.glyph-hit');
      expect(glyphContainer).toBeTruthy();
      const svg = glyphContainer.querySelector('svg');
      expect(svg).toBeTruthy();
      expect(svg.getAttribute('viewBox')).toBe('0 0 16 16');
      expect(svg.getAttribute('stroke')).toBe('currentColor');
      expect(svg.getAttribute('stroke-linecap')).toBe('square');
      const paths = svg.querySelectorAll('path');
      expect(paths.length).toBe(2);
      expect(paths[0].getAttribute('d')).toContain('M5 3H13V11');
      expect(paths[1].getAttribute('d')).toContain('M13 3L4 12');
      expect(glyphContainer.textContent).not.toContain('↗');
    });
  });
});
