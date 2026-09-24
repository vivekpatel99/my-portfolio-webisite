/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Hero from './Hero';

vi.mock('framer-motion', () => ({
  motion: new Proxy({}, { get: () => 'div' }),
  useReducedMotion: () => false,
}));

afterEach(() => {
  cleanup();
});

const renderHero = () =>
  render(
    <BrowserRouter>
      <Hero />
    </BrowserRouter>
  );

describe('Hero invoice proof fold', () => {
  it('renders Top Rated Plus credential in hero invoice', () => {
    renderHero();
    expect(screen.getByText('Top Rated Plus')).toBeTruthy();
    expect(screen.getByText('Upwork freelancer')).toBeTruthy();
  });

  it('renders 100% Job Success credential in hero invoice', () => {
    renderHero();
    expect(screen.getByText('100% Job Success')).toBeTruthy();
    expect(screen.getByText('Client delivery record')).toBeTruthy();
  });

  it('does not render Detected total footer', () => {
    renderHero();
    expect(screen.queryByText('Detected total')).toBeNull();
    expect(screen.queryByText(/€45.*\/hr/)).toBeNull();
  });

  it('has accessible proofs region with role=group', () => {
    const { container } = renderHero();
    const proofsGroup = container.querySelector('[role="group"][aria-label="Detected credentials"]');
    expect(proofsGroup).toBeTruthy();
    expect(proofsGroup.className).toContain('grid');
  });

  it('renders Computer Vision & AI Engineer role as H1', () => {
    renderHero();
    const heading = screen.getByRole('heading', { level: 1, name: /Computer Vision & AI Engineer/i });
    expect(heading).toBeTruthy();
  });

  it('displays Euro rate and Linz location in chips', () => {
    renderHero();
    expect(screen.getByText(/Starting at €45\/hour/)).toBeTruthy();
    expect(screen.getByText(/Based in Linz, Austria/)).toBeTruthy();
  });

  it('renders proof icons with aria-hidden', () => {
    const { container } = renderHero();
    const proofsGroup = container.querySelector('[role="group"][aria-label="Detected credentials"]');
    const icons = proofsGroup.querySelectorAll('svg');
    expect(icons.length).toBe(2);
    icons.forEach((icon) => {
      const parent = icon.parentElement;
      expect(parent.getAttribute('aria-hidden')).toBe('true');
    });
  });
});
