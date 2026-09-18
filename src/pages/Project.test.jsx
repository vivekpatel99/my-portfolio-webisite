/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import { toast } from '@/components/ui/use-toast';
import { caseStudies } from '@/data/caseStudies';
import Project from './Project';

vi.mock('@/components/ui/use-toast', () => ({
  toast: vi.fn(),
}));

vi.mock('react-helmet', () => ({
  Helmet: ({ children }) => <>{children}</>,
}));

vi.mock('@/components/SectionAnimator', () => ({
  default: ({ children }) => <div>{children}</div>,
}));

vi.mock('framer-motion', () => {
  const motion = new Proxy(
    {},
    {
      get: (_, tag) =>
        function MotionComponent({ children, ...props }) {
          return React.createElement(String(tag), props, children);
        },
    },
  );
  return { motion };
});

const LocationSearch = () => {
  const location = useLocation();
  return <pre>{location.search || '(empty)'}</pre>;
};

const renderProject = (entry) =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/project/:projectId" element={<><Project /><LocationSearch /></>} />
      </Routes>
    </MemoryRouter>,
  );

describe('Project unknown slugs', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('keeps an unknown slug on a 404 page without a redirect toast', () => {
    renderProject('/project/nonexistent-slug');
    expect(screen.getByRole('heading', { name: 'Page Not Found' })).toBeTruthy();
    expect(toast).not.toHaveBeenCalled();
  });

  it('treats an uppercase valid slug as unknown', () => {
    const slug = caseStudies[0]?.slug ?? 'unpublished-case-study';
    renderProject(`/project/${slug.toUpperCase()}`);
    expect(screen.getByRole('heading', { name: 'Page Not Found' })).toBeTruthy();
  });
});

describe('Project collection return link', () => {
  beforeEach(() => {
    cleanup();
    window.sessionStorage.clear();
  });

  it('keeps the default collection entry for direct article visits', () => {
    const project = caseStudies[0];
    if (!project) return;

    window.sessionStorage.setItem('case-studies-browsing', JSON.stringify({ loadedCount: 18, scrollY: 900 }));
    renderProject(`/project/${project.slug}`);
    expect(screen.getByRole('link', { name: '← View case studies' }).getAttribute('href')).toBe('/case-studies/');
  });

  it('resumes the collection when history state marks a collection origin', () => {
    const project = caseStudies[0];
    if (!project) return;

    renderProject({ pathname: `/project/${project.slug}`, state: { fromCollection: true } });
    expect(screen.getByRole('link', { name: '← View case studies' }).getAttribute('href')).toBe('/case-studies/?resume=1');
  });

  it('consumes the collection query into history state and cleans the URL', async () => {
    const project = caseStudies[0];
    if (!project) return;

    renderProject(`/project/${project.slug}?from=collection`);
    expect(screen.getByRole('link', { name: '← View case studies' }).getAttribute('href')).toBe('/case-studies/?resume=1');
    await waitFor(() => expect(screen.getByText('(empty)')).toBeTruthy());
    expect(screen.getByRole('link', { name: '← View case studies' }).getAttribute('href')).toBe('/case-studies/?resume=1');
  });
});
