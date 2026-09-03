/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

vi.mock('@/components/Stats', () => ({
  default: () => null,
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

const renderProject = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/project/:projectId" element={<Project />} />
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
    renderProject(`/project/${caseStudies[0].slug.toUpperCase()}`);
    expect(screen.getByRole('heading', { name: 'Page Not Found' })).toBeTruthy();
  });
});
