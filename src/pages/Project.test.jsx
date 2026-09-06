/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from '@/components/ui/use-toast';
import Project from './Project';

const caseStudyFixture = {
  id: 'published-case-study',
  slug: 'published-case-study',
  title: 'Published case study',
  cardTitle: 'Published case study',
  category: 'Workflow Automation',
  summary: 'A bounded public summary.',
  image: {
    kind: 'schematic',
    alt: 'Illustrative workflow schematic.',
    label: 'Input → review',
    caption: 'Illustrative workflow schematic — not client source material.',
  },
  stack: ['n8n'],
  challenge: 'A defined workflow needed reviewable output.',
  solution: 'The public approach uses explicit review steps.',
  outcome: 'The result remains limited to the approved record.',
  story: {
    situation: 'A defined workflow needed reviewable output.',
    constraints: ['The story excludes private client material.'],
    decisions: ['Keep exceptions visible for review.'],
    approach: ['Map inputs to explicit fields.'],
    evidence: ['The public record documents the implementation scope.'],
    result: ['The result remains limited to the approved record.'],
    limitations: ['No accuracy or savings result is claimed.'],
    interpretationNotice: 'Engineering interpretation, not a record of client decisions.',
    relatedExperience: {
      status: 'not-provided',
      text: 'No approved case-specific credential is provided for this case study.',
      links: [],
    },
  },
  links: {
    service: [{ label: 'Discuss a similar workflow', href: '/contact/' }],
    clientFeedback: [],
    proof: [{ label: 'Public Upwork project record', href: 'https://www.upwork.com/freelancers/example?p=1' }],
  },
};

vi.mock('@/data/caseStudies', () => ({
  caseStudies: [],
  getCaseStudyBySlug: (slug) => (slug === caseStudyFixture.slug ? caseStudyFixture : undefined),
}));

vi.mock('@/components/ui/use-toast', () => ({ toast: vi.fn() }));
vi.mock('react-helmet', () => ({ Helmet: ({ children }) => <>{children}</> }));
vi.mock('@/components/SectionAnimator', () => ({ default: ({ children }) => <div>{children}</div> }));
vi.mock('framer-motion', () => {
  const motion = new Proxy({}, { get: (_, tag) => ({ children, ...props }) => React.createElement(String(tag), props, children) });
  return { motion, useReducedMotion: () => false };
});

const renderProject = (path) => render(
  <MemoryRouter initialEntries={[path]}>
    <Routes><Route path="/project/:projectId" element={<Project />} /></Routes>
  </MemoryRouter>,
);

describe('Project', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders all deep story sections from a published data API fixture', () => {
    renderProject('/project/published-case-study');

    ['Situation', 'Constraints', 'Design decisions', 'Approach', 'Evidence', 'Result', 'Limitations', 'Related experience'].forEach((heading) => {
      expect(screen.getByRole('heading', { name: heading })).toBeTruthy();
    });
    expect(screen.getByRole('navigation', { name: 'Case study sections' }).querySelector('a[href="#evidence"]')).toBeTruthy();
    expect(screen.getByText(/engineering interpretation, not a record of client decisions/i)).toBeTruthy();
    expect(screen.getByText(/does not independently verify the technical claims/i)).toBeTruthy();
    expect(screen.getByText(/client feedback is linked from the homepage/i)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Explore services' }).getAttribute('href')).toBe('/#services');
    expect(screen.getByRole('link', { name: 'View client feedback' }).getAttribute('href')).toBe('/#testimonials');
  });

  it('keeps an unavailable unpublished slug on a 404 page without a redirect toast', () => {
    renderProject('/project/withheld-case-study');
    expect(screen.getByRole('heading', { name: 'Page Not Found' })).toBeTruthy();
    expect(toast).not.toHaveBeenCalled();
  });
});
