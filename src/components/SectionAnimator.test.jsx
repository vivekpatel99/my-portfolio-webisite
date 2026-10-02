// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { renderWithMotion as render } from '@/test/renderWithMotion';
import SectionAnimator from './SectionAnimator';

let enterViewport;
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it('keeps section content visible and finishes its entrance when it reaches the viewport', async () => {
  vi.stubGlobal('IntersectionObserver', class {
    constructor(callback) { enterViewport = callback; }
    observe() {}
    unobserve() {}
    disconnect() {}
  });
  const { container } = render(<SectionAnimator className="section"><h2>Services</h2></SectionAnimator>);
  const section = container.querySelector('[data-section-animator]');
  expect(screen.getByRole('heading', { name: 'Services' })).toBeTruthy();
  expect(section.style.opacity).not.toBe('0');
  expect(section.style.transform).toContain('translateY(12px)');
  act(() => enterViewport([{ target: section, isIntersecting: true }]));
  await waitFor(() => expect(section.style.transform).toBe('none'));
});
