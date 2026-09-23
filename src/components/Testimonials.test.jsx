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
    
    const slides = container.querySelectorAll('.carousel-slide');
    expect(slides[0].classList.contains('is-active')).toBe(true);
    expect(slides[1].classList.contains('is-active')).toBe(false);
  });

  it('renders correct number of testimonial dots', () => {
    render(<Testimonials />);
    
    const dots = screen.getAllByRole('tab');
    expect(dots.length).toBe(testimonials.length);
  });

  it('advances to next quote on dot click', () => {
    const { container } = render(<Testimonials />);
    
    const dots = screen.getAllByRole('tab');
    const slides = container.querySelectorAll('.carousel-slide');
    
    fireEvent.click(dots[1]);
    
    expect(slides[1].classList.contains('is-active')).toBe(true);
    expect(dots[1].getAttribute('aria-selected')).toBe('true');
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
    
    const slides = container.querySelectorAll('.carousel-slide');
    const dots = screen.getAllByRole('tab');
    
    expect(dots[0].getAttribute('aria-selected')).toBe('true');
    
    vi.advanceTimersByTime(10000);
    
    expect(dots[0].getAttribute('aria-selected')).toBe('true');
    
    vi.useRealTimers();
  });

  it('updates aria-selected when active quote changes', () => {
    render(<Testimonials />);
    
    const dots = screen.getAllByRole('tab');
    
    expect(dots[0].getAttribute('aria-selected')).toBe('true');
    
    fireEvent.click(dots[2]);
    
    expect(dots[2].getAttribute('aria-selected')).toBe('true');
    expect(dots[0].getAttribute('aria-selected')).toBe('false');
  });
});
