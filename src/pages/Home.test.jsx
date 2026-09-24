/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Home from './Home';

vi.mock('@/components/Hero', () => ({
  default: () => <div data-testid="hero-mock">Hero</div>,
}));

vi.mock('@/components/Portfolio', () => ({
  default: () => <div data-testid="portfolio-mock">Portfolio</div>,
}));

vi.mock('@/components/Services', () => ({
  default: () => <div data-testid="services-mock">Services</div>,
}));

vi.mock('@/components/Testimonials', () => ({
  default: () => <div data-testid="testimonials-mock">Testimonials</div>,
}));

vi.mock('@/components/About', () => ({
  default: () => <div data-testid="about-mock">About</div>,
}));

vi.mock('@/components/CTA', () => ({
  default: () => <div data-testid="cta-mock">CTA</div>,
}));

vi.mock('@/components/SectionAnimator', () => ({
  default: ({ children }) => <div>{children}</div>,
}));

vi.mock('@/lib/seo', () => ({
  Seo: () => null,
  defaultSeo: {},
}));

afterEach(() => {
  cleanup();
});

const renderHome = () =>
  render(
    <BrowserRouter>
      <Home />
    </BrowserRouter>
  );

describe('Home page structure (#176 proof fold)', () => {
  it('renders Hero component', () => {
    renderHome();
    expect(screen.getByTestId('hero-mock')).toBeTruthy();
  });

  it('does not render ProofStrip section (removed per #176)', () => {
    const { container } = renderHome();
    expect(screen.queryByTestId('proofstrip-mock')).toBeNull();
    expect(container.textContent).not.toContain('PROOF · DETECTED');
    expect(container.textContent).not.toContain('fields · 2');
  });

  it('renders Portfolio section immediately after Hero', () => {
    renderHome();
    expect(screen.getByTestId('portfolio-mock')).toBeTruthy();
  });

  it('renders Services section', () => {
    renderHome();
    expect(screen.getByTestId('services-mock')).toBeTruthy();
  });

  it('renders Testimonials section', () => {
    renderHome();
    expect(screen.getByTestId('testimonials-mock')).toBeTruthy();
  });

  it('renders About section', () => {
    renderHome();
    expect(screen.getByTestId('about-mock')).toBeTruthy();
  });

  it('renders CTA section', () => {
    renderHome();
    expect(screen.getByTestId('cta-mock')).toBeTruthy();
  });

  it('renders sections in correct order per #176: Hero → Portfolio → Services → Testimonials → About → CTA', () => {
    const { container } = renderHome();
    const sections = Array.from(container.querySelectorAll('[data-testid]')).map(el => 
      el.getAttribute('data-testid').replace('-mock', '')
    );
    
    expect(sections).toEqual([
      'hero',
      'portfolio',
      'services',
      'testimonials',
      'about',
      'cta',
    ]);
  });
});
