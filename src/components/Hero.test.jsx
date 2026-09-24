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

describe('Hero invoice proof fold (#176)', () => {
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

  it('does not render Detected total footer (removed per #176)', () => {
    renderHero();
    expect(screen.queryByText('Detected total')).toBeNull();
    expect(screen.queryByText(/€45.*\/hr/)).toBeNull();
    expect(screen.queryByText(/ok/i)).toBeNull();
  });

  it('has accessible proofs region with role=group', () => {
    const { container } = renderHero();
    const proofsGroup = container.querySelector('[role="group"][aria-label="Detected credentials"]');
    expect(proofsGroup).toBeTruthy();
    expect(proofsGroup.className).toContain('grid');
    expect(proofsGroup.className).toContain('grid-cols-2');
  });

  it('proofs appear under Role field in invoice structure', () => {
    const { container } = renderHero();
    const roleLabel = screen.getByText('Role');
    const roleField = roleLabel.parentElement;
    const proofsGroup = container.querySelector('[role="group"][aria-label="Detected credentials"]');
    
    expect(roleField).toBeTruthy();
    expect(proofsGroup).toBeTruthy();
    
    const invoice = container.querySelector('article[aria-label="Profile invoice field parse"]');
    const children = Array.from(invoice.children);
    const roleIndex = children.findIndex(el => el.contains(roleLabel));
    const proofsIndex = children.findIndex(el => el === proofsGroup);
    
    expect(proofsIndex).toBeGreaterThan(roleIndex);
  });

  it('renders Computer Vision & AI Engineer role as H1', () => {
    renderHero();
    const heading = screen.getByRole('heading', { level: 1, name: /Computer Vision & AI Engineer/i });
    expect(heading).toBeTruthy();
  });

  it('displays Euro rate only (not dollar or other currencies)', () => {
    const { container } = renderHero();
    const euroRates = screen.getAllByText(/€45\/hour/);
    expect(euroRates.length).toBeGreaterThanOrEqual(1);
    expect(container.textContent).not.toMatch(/\$|USD|GBP|£/);
  });

  it('displays Linz, Austria location', () => {
    renderHero();
    expect(screen.getByText('Linz, Austria')).toBeTruthy();
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

  it('renders bio after proofs and rate/location per invoice fold design', () => {
    renderHero();
    const bio = screen.getByText(/I build detectors, document extractors, and n8n workflows/);
    expect(bio).toBeTruthy();
  });

  it('renders invoice detection chrome and scan label', () => {
    renderHero();
    expect(screen.getByText('doc · extract · 0.97')).toBeTruthy();
    expect(screen.getByText('INV-VP-0045')).toBeTruthy();
    expect(screen.getByText('Profile Invoice')).toBeTruthy();
  });

  it('uses purple accent color #8B5CF6 on detection elements', () => {
    const { container } = renderHero();
    const proofsGroup = container.querySelector('[role="group"][aria-label="Detected credentials"]');
    const fields = proofsGroup.querySelectorAll('[class*="border-[#8B5CF6]"]');
    expect(fields.length).toBeGreaterThanOrEqual(2);
  });

  it('renders Request a Project Estimate CTA', () => {
    renderHero();
    const cta = screen.getByRole('button', { name: /Request a Project Estimate/i });
    expect(cta).toBeTruthy();
  });

  it('renders View Case Studies secondary CTA', () => {
    renderHero();
    const cta = screen.getByRole('link', { name: /View Case Studies/i });
    expect(cta).toBeTruthy();
  });
});
