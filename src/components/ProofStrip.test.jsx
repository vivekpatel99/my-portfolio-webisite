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

  it('should render all 5 proof items', () => {
    const { container } = render(<ProofStrip />);
    const items = container.querySelectorAll('li.flex');
    expect(items).toHaveLength(5);
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

  it('should display 21+ Projects label', () => {
    render(<ProofStrip />);
    expect(screen.getByText('21+ Projects')).toBeTruthy();
    expect(screen.getByText('AI and automation work')).toBeTruthy();
  });

  it('should display 300+ Hours label', () => {
    render(<ProofStrip />);
    expect(screen.getByText('300+ Hours')).toBeTruthy();
    expect(screen.getByText('Solutions delivered')).toBeTruthy();
  });

  it('should display 94% Faster label', () => {
    render(<ProofStrip />);
    expect(screen.getByText('94% Faster')).toBeTruthy();
    expect(screen.getByText('Inference improvement')).toBeTruthy();
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

  it('should render icons with aria-hidden attribute', () => {
    const { container } = render(<ProofStrip />);
    const icons = container.querySelectorAll('svg[aria-hidden="true"]');
    expect(icons.length).toBe(5);
  });

  it('should have proper grid layout classes', () => {
    const { container } = render(<ProofStrip />);
    const list = container.querySelector('ul');
    expect(list.className).toContain('grid');
    expect(list.className).toContain('grid-cols-2');
    expect(list.className).toContain('md:grid-cols-5');
  });

  it('should have consistent styling on all proof items', () => {
    const { container } = render(<ProofStrip />);
    const items = container.querySelectorAll('li.flex');
    
    expect(items.length).toBe(5);
    items.forEach((item) => {
      expect(item.className).toContain('flex');
      expect(item.className).toContain('min-h-[112px]');
      expect(item.className).toContain('rounded-lg');
    });
  });

  it('should have proper text hierarchy with bold labels', () => {
    const { container } = render(<ProofStrip />);
    const labels = container.querySelectorAll('.font-bold');
    expect(labels.length).toBeGreaterThan(0);
  });

  it('should have accent-purple color on icons', () => {
    const { container } = render(<ProofStrip />);
    const icons = container.querySelectorAll('svg');
    
    expect(icons.length).toBe(5);
    icons.forEach((icon) => {
      expect(icon.className.baseVal).toContain('text-accent-purple');
    });
  });
});
