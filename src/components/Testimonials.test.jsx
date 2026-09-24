/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, afterEach } from 'vitest';
import Testimonials from './Testimonials';
import { testimonials } from '@/data/testimonials';

describe('Testimonials Carousel', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders first quote visible by default', () => {
    const { container } = render(<Testimonials />);
    
    const quoteArea = container.querySelector('.quote-area');
    expect(quoteArea).toBeTruthy();
    expect(quoteArea.textContent).toContain(testimonials[0].content);
  });

  it('renders correct number of testimonial dots', () => {
    render(<Testimonials />);
    
    const dots = screen.getAllByRole('button', { name: /Slide \d+/ });
    expect(dots.length).toBe(testimonials.length);
  });

  it('advances to next quote on dot click', () => {
    const { container } = render(<Testimonials />);
    
    const dots = screen.getAllByRole('button', { name: /Slide \d+/ });
    const quoteArea = container.querySelector('.quote-area');
    
    fireEvent.click(dots[1]);
    
    expect(quoteArea.textContent).toContain(testimonials[1].content);
  });

  it('respects prefers-reduced-motion and does not auto-advance', () => {
    vi.useFakeTimers();
    
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    
    const { container } = render(<Testimonials />);
    
    const quoteArea = container.querySelector('.quote-area');
    const firstContent = testimonials[0].content;
    
    expect(quoteArea.textContent).toContain(firstContent);
    
    vi.advanceTimersByTime(10000);
    
    expect(quoteArea.textContent).toContain(firstContent);
    
    vi.useRealTimers();
  });

  it('changes displayed testimonial when different dot is clicked', () => {
    const { container } = render(<Testimonials />);
    
    const dots = screen.getAllByRole('button', { name: /Slide \d+/ });
    const quoteArea = container.querySelector('.quote-area');
    
    expect(quoteArea.textContent).toContain(testimonials[0].content);
    
    fireEvent.click(dots[2]);
    
    expect(quoteArea.textContent).toContain(testimonials[2].content);
    expect(quoteArea.textContent).not.toContain(testimonials[0].content);
  });

  it('renders source chip for testimonials with source field', () => {
    const { container } = render(<Testimonials />);
    
    const sourceChips = container.querySelectorAll('.source');
    expect(sourceChips.length).toBeGreaterThan(0);
    
    const firstChip = sourceChips[0];
    expect(['Upwork', 'Fiverr', 'Direct']).toContain(firstChip.textContent);
  });

  it('displays correct source for first testimonial', () => {
    const { container } = render(<Testimonials />);
    
    const quoteArea = container.querySelector('.quote-area');
    const sourceChip = quoteArea?.querySelector('.source');
    
    expect(sourceChip).toBeTruthy();
    expect(sourceChip.textContent).toBe(testimonials[0].source);
  });
});
