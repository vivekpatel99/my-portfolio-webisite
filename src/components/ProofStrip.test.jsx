/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import ProofStrip from './ProofStrip';

afterEach(() => {
  cleanup();
});

describe('ProofStrip component', () => {
  it('should render without crashing', () => {
    render(<ProofStrip />);
    const section = screen.getByRole('region', { name: /professional credentials and achievements/i });
    expect(section).toBeTruthy();
  });

  it('should render two sourced proof items', () => {
    const { container } = render(<ProofStrip />);
    const items = container.querySelectorAll('li');
    expect(items).toHaveLength(2);
  });

  it('should display Top Rated Plus label', () => {
    render(<ProofStrip />);
    expect(screen.getByText('Top Rated Plus')).toBeTruthy();
    expect(screen.getByText('Upwork freelancer')).toBeTruthy();
  });

  it('should display 100% Job Success label', () => {
    render(<ProofStrip />);
    expect(screen.getByText('100% Job Success')).toBeTruthy();
    expect(screen.getByText('Client delivery record')).toBeTruthy();
  });

  it('should not display unsourced metric chips', () => {
    render(<ProofStrip />);
    expect(screen.queryByText('21+ Projects')).toBeNull();
    expect(screen.queryByText('300+ Hours')).toBeNull();
    expect(screen.queryByText('94% Faster')).toBeNull();
    expect(screen.queryByText('AI and automation work')).toBeNull();
    expect(screen.queryByText('Solutions delivered')).toBeNull();
    expect(screen.queryByText('Inference improvement')).toBeNull();
  });

  it('should have proper semantic structure with ul/li', () => {
    render(<ProofStrip />);
    const list = screen.getByRole('list');
    expect(list).toBeTruthy();
    expect(list.tagName).toBe('UL');
  });

  it('should have accessible heading', () => {
    render(<ProofStrip />);
    const heading = screen.getByRole('heading', { level: 2, name: /professional credentials and achievements/i });
    expect(heading).toBeTruthy();
  });

  it('should have sr-only class on heading', () => {
    render(<ProofStrip />);
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading.className).toContain('sr-only');
  });

  it('should have proper aria-labelledby on section', () => {
    const { container } = render(<ProofStrip />);
    const section = container.querySelector('section');
    expect(section.getAttribute('aria-labelledby')).toBe('proof-heading');
  });

  it('should render glyphs with aria-hidden attribute', () => {
    const { container } = render(<ProofStrip />);
    const glyphs = container.querySelectorAll('svg[aria-hidden="true"]');
    expect(glyphs.length).toBe(2);
  });

  it('should have a responsive grid layout', () => {
    const { container } = render(<ProofStrip />);
    const list = container.querySelector('ul');
    expect(list.className).toContain('grid');
    expect(list.className).toContain('grid-cols-1');
    expect(list.className).toContain('sm:grid-cols-2');
    expect(list.className).not.toContain('md:grid-cols-5');
  });

  it('should display field labels for detected credentials', () => {
    render(<ProofStrip />);
    expect(screen.getByText(/credential\.rating \/ field · 0\.99/)).toBeTruthy();
    expect(screen.getByText(/credential\.success \/ field · 0\.99/)).toBeTruthy();
  });

  it('should display confidence chips', () => {
    const { container } = render(<ProofStrip />);
    const chips = Array.from(container.querySelectorAll('span')).filter(
      el => el.textContent === '0.99' && el.className.includes('font-mono')
    );
    expect(chips.length).toBeGreaterThanOrEqual(2);
  });

  it('should display meta row with PROOF DETECTED label', () => {
    render(<ProofStrip />);
    expect(screen.getByText(/PROOF ·/)).toBeTruthy();
    expect(screen.getByText(/DETECTED/)).toBeTruthy();
  });

  it('should display field count in meta row', () => {
    render(<ProofStrip />);
    expect(screen.getByText(/fields · 2/)).toBeTruthy();
  });

  it('should have thin purple bounding boxes not filled cards', () => {
    const { container } = render(<ProofStrip />);
    const bboxes = container.querySelectorAll('[class*="border-[#8B5CF6]"]');
    expect(bboxes.length).toBeGreaterThan(0);
    const items = container.querySelectorAll('li');
    items.forEach((item) => {
      expect(item.className).not.toContain('rounded-lg');
      expect(item.className).not.toContain('min-h-[112px]');
    });
  });

  it('should have background grid and radial gradient', () => {
    const { container } = render(<ProofStrip />);
    const decorativeElements = container.querySelectorAll('[aria-hidden="true"]');
    expect(decorativeElements.length).toBeGreaterThan(0);
  });

  it('should have L-bracket anchors', () => {
    const { container } = render(<ProofStrip />);
    const anchors = container.querySelectorAll('[class*="before:border"]');
    expect(anchors.length).toBeGreaterThanOrEqual(2);
  });
});
