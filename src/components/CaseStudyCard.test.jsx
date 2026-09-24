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
    expect(cardLink.contains(screen.getByRole('heading', { name: project.title }))).toBe(true);
    expect(cardLink.contains(screen.getByAltText(project.image.alt))).toBe(true);
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(screen.getByText('Read case study →')).toBeTruthy();
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
    it('renders L-brackets TL purple and BR white corner registration marks', () => {
      const { container } = render(
        <MemoryRouter>
          <CaseStudyCard project={project} />
        </MemoryRouter>,
      );

      const article = container.querySelector('article');
      expect(article).toBeTruthy();
      const brackets = article.querySelectorAll('span[aria-hidden="true"]');
      const tlBracket = Array.from(brackets).find((el) =>
        el.className.includes('top-1.5') && el.className.includes('left-1.5'),
      );
      const brBracket = Array.from(brackets).find((el) =>
        el.className.includes('bottom-1.5') && el.className.includes('right-1.5'),
      );

      expect(tlBracket).toBeTruthy();
      expect(brBracket).toBeTruthy();
      expect(tlBracket.className).toContain('border-[#8B5CF6]/85');
      expect(brBracket.className).toContain('border-white/45');
      expect(tlBracket.className).toContain('border-t-[1.5px]');
      expect(tlBracket.className).toContain('border-l-[1.5px]');
      expect(brBracket.className).toContain('border-b-[1.5px]');
      expect(brBracket.className).toContain('border-r-[1.5px]');
    });

    it('displays category as CATEGORY · CASE STUDY meta line not rounded pill', () => {
      const { container } = render(
        <MemoryRouter>
          <CaseStudyCard project={project} />
        </MemoryRouter>,
      );

      const metaLine = container.querySelector('div[class*="border-b"][class*="border-[#8B5CF6]/45"]');
      expect(metaLine).toBeTruthy();
      expect(metaLine.textContent).toContain(`${project.category} ·`);
      expect(metaLine.textContent).toContain('CASE STUDY');
      expect(metaLine.className).toContain('font-mono');
      expect(metaLine.className).toContain('tracking-[0.12em]');
      expect(metaLine.className).toContain('uppercase');
      expect(metaLine.className).toContain('border-b');
      expect(metaLine.className).not.toContain('rounded-full');
      const purpleSpan = metaLine.querySelector('span[class*="text-[#a78bfa]"]');
      expect(purpleSpan).toBeTruthy();
      expect(purpleSpan.textContent).toBe('CASE STUDY');
    });

    it('applies square corners and purple craft border to card frame', () => {
      const { container } = render(
        <MemoryRouter>
          <CaseStudyCard project={project} />
        </MemoryRouter>,
      );

      const article = container.querySelector('article');
      expect(article.className).toContain('rounded-none');
      expect(article.className).toContain('border-[#8B5CF6]/40');
      expect(article.className).toContain('bg-[#0C0D0D]');
      expect(article.className).toContain('hover:border-[#8B5CF6]');
      expect(article.className).not.toContain('rounded-lg');
      expect(article.className).not.toContain('border-white/10');
    });

    it('renders geometric arrow glyph as SVG not filled circle with text', () => {
      const { container } = render(
        <MemoryRouter>
          <CaseStudyCard project={project} />
        </MemoryRouter>,
      );

      const glyphContainer = Array.from(container.querySelectorAll('span[aria-hidden="true"]')).find((el) =>
        el.className.includes('h-11') && el.className.includes('w-11'),
      );
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
      expect(glyphContainer.className).toContain('border-[#8B5CF6]/35');
      expect(glyphContainer.textContent).not.toContain('↗');
    });
  });
});
