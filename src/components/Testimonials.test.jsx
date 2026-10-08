/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react';
import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest';
import Testimonials from './Testimonials';
import { testimonials } from '@/data/testimonials';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

// Controllable matchMedia stub so tests can flip the motion preference at runtime.
function installMotionPreference(initiallyReduced) {
  const listeners = new Set();
  const query = {
    matches: initiallyReduced,
    media: REDUCED_MOTION_QUERY,
    onchange: null,
    addEventListener: (_type, listener) => listeners.add(listener),
    removeEventListener: (_type, listener) => listeners.delete(listener),
    addListener: (listener) => listeners.add(listener),
    removeListener: (listener) => listeners.delete(listener),
    dispatchEvent: () => true,
  };
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((media) => (
      media === REDUCED_MOTION_QUERY ? query : { ...query, media, matches: false }
    )),
  });
  return {
    setReduced(reduced) {
      query.matches = reduced;
      listeners.forEach((listener) => listener({ matches: reduced, media: REDUCED_MOTION_QUERY }));
    },
  };
}

const INTERVAL_MS = 6000;
const quoteText = () => document.querySelector('#testimonials blockquote').textContent;
const expectShowing = (index) => expect(quoteText()).toContain(testimonials[index].content);
const advance = (ms) => act(() => { vi.advanceTimersByTime(ms); });
const slideButtons = () => screen.getAllByRole('button', { name: /^Slide \d+$/ });
const PLAYBACK_NAME = /(pause|play) testimonials/i;
const queryPauseToggle = () => screen.queryByRole('button', { name: PLAYBACK_NAME });
const slideRegion = () => screen.getByRole('group', { name: /of \d+/ });
const interactionBoundary = () => screen.getByRole('region', { name: 'Client testimonials' });
// Real mouse hover arrives as pointer events typed 'mouse'; touch taps emit touch-typed
// pointer events followed by a compatibility mouseenter that never gets a matching leave.
const hoverWithMouse = (el) => fireEvent.pointerEnter(el, { pointerType: 'mouse' });
const unhoverWithMouse = (el) => fireEvent.pointerLeave(el, { pointerType: 'mouse' });
const tapWithTouch = (boundary, target, { emitCompatMouseEnter }) => {
  fireEvent.pointerEnter(boundary, { pointerType: 'touch' });
  fireEvent.pointerLeave(boundary, { pointerType: 'touch' });
  if (emitCompatMouseEnter) fireEvent.mouseEnter(boundary);
  fireEvent.focus(target);
  fireEvent.click(target);
};

describe('Testimonials Carousel', () => {
  beforeEach(() => {
    installMotionPreference(false);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders first quote visible by default', () => {
    const { container } = render(<Testimonials />);
    
    const quoteArea = container.querySelector('.quote-area');
    expect(quoteArea).toBeTruthy();
    expect(quoteArea.textContent).toContain(testimonials[0].content);
  });

  it('keeps the slide counter in the footer after the quote without a decorative rail', () => {
    const { container } = render(<Testimonials />);
    const quote = container.querySelector('blockquote');
    const footer = container.querySelector('footer');
    const counter = footer.querySelector('.count b');
    const total = String(testimonials.length).padStart(2, '0');

    expect(footer.textContent).toContain('Field');
    expect(counter.textContent.trim()).toBe(`01 / ${total}`);
    expect(quote.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(container.querySelector('.rail, .glyph')).toBeNull();
    expect(screen.queryByRole('complementary')).toBeNull();

    fireEvent.click(slideButtons().at(-1));
    expect(counter.textContent.trim()).toBe(`${total} / ${total}`);
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

describe('Testimonials carousel controls (#225)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('auto-advances with normal motion when nothing stops it', () => {
    installMotionPreference(false);
    render(<Testimonials />);
    expectShowing(0);
    advance(INTERVAL_MS);
    expectShowing(1);
  });

  it('offers slide selection without a playback button', () => {
    installMotionPreference(false);
    render(<Testimonials />);
    expect(queryPauseToggle()).toBeNull();
    expect(slideButtons()).toHaveLength(testimonials.length);
  });

  it('keeps a chosen slide for 20s after focus and hover leave the controls', () => {
    installMotionPreference(false);
    render(<Testimonials />);
    const boundary = interactionBoundary();
    const target = slideButtons()[1];

    hoverWithMouse(boundary);
    fireEvent.focus(target);
    fireEvent.click(target);
    expectShowing(1);

    fireEvent.blur(target, { relatedTarget: null });
    unhoverWithMouse(boundary);
    advance(20_000);
    expectShowing(1);
  });

  it('focusing the quote stops rotation and leaving it resumes', () => {
    installMotionPreference(false);
    render(<Testimonials />);
    const quote = slideRegion();
    expect(quote.tabIndex).toBe(0);

    fireEvent.focus(quote);
    advance(20_000);
    expectShowing(0);

    fireEvent.blur(quote, { relatedTarget: null });
    advance(INTERVAL_MS);
    expectShowing(1);
  });

  it('focusing a slide control stops rotation because controls share the boundary', () => {
    installMotionPreference(false);
    render(<Testimonials />);
    const boundary = interactionBoundary();
    for (const control of slideButtons()) {
      expect(boundary.contains(control)).toBe(true);
    }
    expect(boundary.contains(slideRegion())).toBe(true);

    fireEvent.focus(slideButtons()[3]);
    advance(20_000);
    expectShowing(0);
  });

  it('moving focus between quote and controls does not resume rotation', () => {
    installMotionPreference(false);
    render(<Testimonials />);
    const quote = slideRegion();
    const control = slideButtons()[0];

    fireEvent.focus(quote);
    fireEvent.blur(quote, { relatedTarget: control });
    fireEvent.focus(control);
    advance(20_000);
    expectShowing(0);
  });

  it('hover leaving while focus remains inside keeps rotation stopped', () => {
    installMotionPreference(false);
    render(<Testimonials />);
    const boundary = interactionBoundary();
    const quote = slideRegion();

    hoverWithMouse(boundary);
    fireEvent.focus(quote);
    unhoverWithMouse(boundary);
    advance(20_000);
    expectShowing(0);

    fireEvent.blur(quote, { relatedTarget: null });
    advance(INTERVAL_MS);
    expectShowing(1);
  });

  it('focus leaving while hover remains keeps rotation stopped', () => {
    installMotionPreference(false);
    render(<Testimonials />);
    const boundary = interactionBoundary();
    const quote = slideRegion();

    fireEvent.focus(quote);
    hoverWithMouse(boundary);
    fireEvent.blur(quote, { relatedTarget: null });
    advance(20_000);
    expectShowing(0);

    unhoverWithMouse(boundary);
    advance(INTERVAL_MS);
    expectShowing(1);
  });

  it('keeps touch-selected slides readable and allows another selection', () => {
    installMotionPreference(false);
    render(<Testimonials />);
    const boundary = interactionBoundary();
    const target = slideButtons()[1];

    tapWithTouch(boundary, target, { emitCompatMouseEnter: true });
    fireEvent.blur(target, { relatedTarget: null });
    advance(20_000);
    expectShowing(1);

    tapWithTouch(boundary, slideButtons()[2], { emitCompatMouseEnter: false });
    expectShowing(2);
  });

  it('real mouse hover alone stops rotation and mouse leave resumes it', () => {
    installMotionPreference(false);
    render(<Testimonials />);
    const boundary = interactionBoundary();

    hoverWithMouse(boundary);
    advance(20_000);
    expectShowing(0);

    unhoverWithMouse(boundary);
    advance(INTERVAL_MS);
    expectShowing(1);
  });

  it('shows an autoplay-off status instead of a playback control with reduced motion', () => {
    installMotionPreference(true);
    render(<Testimonials />);
    expect(screen.getByText('Autoplay off · Reduced motion')).toBeTruthy();
    expect(queryPauseToggle()).toBeNull();

    advance(20_000);
    expectShowing(0);

    fireEvent.click(slideButtons()[2]);
    expectShowing(2);
    expect(slideButtons()[2].getAttribute('aria-current')).toBe('true');
    fireEvent.blur(slideButtons()[2], { relatedTarget: null });
    advance(20_000);
    expectShowing(2);
  });

  it('stops rotating when reduced motion turns on and resumes when it turns off', () => {
    const preference = installMotionPreference(false);
    render(<Testimonials />);
    act(() => preference.setReduced(true));
    expect(screen.getByText('Autoplay off · Reduced motion')).toBeTruthy();
    expect(queryPauseToggle()).toBeNull();
    advance(20_000);
    expectShowing(0);

    act(() => preference.setReduced(false));
    expect(screen.queryByText('Autoplay off · Reduced motion')).toBeNull();
    expect(queryPauseToggle()).toBeNull();
    advance(INTERVAL_MS);
    expectShowing(1);
  });

  it('keeps a manually selected slide across a reduced-motion round trip', () => {
    const preference = installMotionPreference(false);
    render(<Testimonials />);
    fireEvent.click(slideButtons()[2]);
    fireEvent.blur(slideButtons()[2], { relatedTarget: null });

    act(() => preference.setReduced(true));
    act(() => preference.setReduced(false));
    advance(20_000);
    expectShowing(2);
  });

  it('keeps genuine quote focus holding rotation across a preference round trip', () => {
    const preference = installMotionPreference(false);
    render(<Testimonials />);
    act(() => slideRegion().focus());

    act(() => preference.setReduced(true));
    act(() => preference.setReduced(false));
    expect(document.activeElement).toBe(slideRegion());
    advance(20_000);
    expectShowing(0);

    act(() => slideRegion().blur());
    advance(INTERVAL_MS);
    expectShowing(1);
  });
});
