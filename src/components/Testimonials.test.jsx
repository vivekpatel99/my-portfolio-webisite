/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen, cleanup, fireEvent, createEvent, act } from '@testing-library/react';
import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest';
import Testimonials from './Testimonials';
import { testimonials } from '@/data/testimonials';
import { socialLinks } from '@/config/links';

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

  it('shows the profile source and recorded month/year for each Upwork quote', () => {
    render(<Testimonials />);
    const dates = ['September 2026', 'June 2026', 'May 2026', 'April 2026', 'March 2026', 'January 2026', 'January 2026'];
    dates.forEach((date, index) => {
      fireEvent.click(slideButtons()[index]);
      const link = screen.getByRole('link', { name: 'View my Upwork profile (opens in a new tab)' });
      expect(link.getAttribute('href')).toBe(socialLinks.upwork);
      expect(link.textContent).toBe('View my Upwork profile (opens in a new tab)');
      expect(document.querySelector('.source').textContent).toBe('Upwork');
      expect(link.tabIndex).toBe(0);
      const time = document.querySelector('#testimonials time');
      expect(time.textContent).toBe(date);
      expect(time.getAttribute('datetime')).toBe(testimonials[index].feedbackDate.slice(0, 7));
      expectShowing(index);
      expect(screen.getByRole('img', { name: 'Rated 5 out of 5' })).toBeTruthy();
    });
  });

  it('gives every slide one short native footer link with independently readable quote and metadata', () => {
    render(<Testimonials />);
    testimonials.forEach((review, index) => {
      fireEvent.click(slideButtons()[index]);
      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(1);
      const link = screen.getByRole('link', { name: 'View my Upwork profile (opens in a new tab)' });
      expect(link.getAttribute('href')).toBe(socialLinks.upwork);
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
      expect(link.textContent).toBe('View my Upwork profile (opens in a new tab)');
      expect(link.hasAttribute('aria-labelledby')).toBe(false);
      expect(link.tabIndex).toBe(0);
      const card = slideRegion();
      expect(card.querySelector('blockquote').textContent).toContain(review.content);
      expect(card.querySelector('.source').textContent).toBe(review.source);
      for (const content of card.querySelectorAll('blockquote, .source, time, article, [role=img]')) {
        expect(link.contains(content)).toBe(false);
      }
      expect(link.querySelector('a, button, [tabindex]')).toBeNull();
      slideButtons().forEach((button) => expect(link.contains(button)).toBe(false));
    });
  });

  it('cancels selected, moved and cancelled pointer clicks anywhere in the card, then consumes the gesture state', () => {
    render(<Testimonials />);
    const link = screen.getByRole('link');
    const quote = slideRegion().querySelector('blockquote');
    const cue = link;
    vi.spyOn(link, 'click').mockImplementation(() => {});
    const pointer = (type, target, x = 20, y = 20) => {
      // Supply coordinates even on jsdom versions without a native PointerEvent.
      const event = new Event(type, { bubbles: true });
      Object.assign(event, { clientX: x, clientY: y, pointerType: 'touch' });
      fireEvent(target, event);
    };
    const clickWasCancelled = (target, detail = 1) => {
      const event = createEvent.click(target, { detail, cancelable: true });
      // Inspect cancellation after React's handler, then prevent jsdom navigation.
      let cancelled;
      const observe = (click) => { cancelled = click.defaultPrevented; click.preventDefault(); };
      document.addEventListener('click', observe, { once: true });
      fireEvent(target, event);
      return cancelled;
    };

    for (const target of [quote, cue]) {
      pointer('pointerdown', target);
      const range = document.createRange();
      range.selectNodeContents(quote);
      window.getSelection().addRange(range);
      expect(clickWasCancelled(target)).toBe(true);
      expect(clickWasCancelled(target, 0)).toBe(false);
      window.getSelection().removeAllRanges();

      pointer('pointerdown', target);
      pointer('pointermove', target, 40);
      pointer('pointerup', target); // Returning to the start does not erase the drag.
      expect(clickWasCancelled(target)).toBe(true);

      pointer('pointerdown', target);
      pointer('pointerup', target, 20, 40);
      expect(clickWasCancelled(target)).toBe(true);

      pointer('pointerdown', target);
      pointer('pointercancel', target);
      expect(clickWasCancelled(target)).toBe(true);
      expect(clickWasCancelled(target)).toBe(false); // Cancelled state was consumed.
      expect(clickWasCancelled(target, 0)).toBe(false); // Native keyboard activation.

      pointer('pointerdown', target);
      pointer('pointerup', target, 25);
      expect(clickWasCancelled(target)).toBe(false);
    }
  });

  it('forwards ordinary card clicks once, while footer activation stays native', () => {
    render(<Testimonials />);
    const link = screen.getByRole('link');
    const nativeClick = vi.spyOn(link, 'click');
    const activations = vi.fn();
    link.addEventListener('click', activations);
    // Cancel navigation after React handles the event so the native-link branch is exercised.
    const preventNavigation = (event) => event.preventDefault();
    document.addEventListener('click', preventNavigation);
    try {
      fireEvent.click(slideRegion().querySelector('blockquote'), { detail: 1 });
      expect(nativeClick).toHaveBeenCalledTimes(1);
      expect(activations).toHaveBeenCalledTimes(1);
      fireEvent.click(link.querySelector('.sr-only'), { detail: 1 });
      expect(nativeClick).toHaveBeenCalledTimes(1);
      expect(activations).toHaveBeenCalledTimes(2);
    } finally {
      document.removeEventListener('click', preventNavigation);
    }
  });

  it('does not forward default-prevented, modified, middle or keyboard clicks on the group', () => {
    render(<Testimonials />);
    const link = screen.getByRole('link');
    const forward = vi.spyOn(link, 'click').mockImplementation(() => {});
    const quote = slideRegion().querySelector('blockquote');
    const prevented = createEvent.click(quote, { detail: 1 });
    prevented.preventDefault();
    fireEvent(quote, prevented);
    for (const modifier of ['metaKey', 'ctrlKey', 'shiftKey', 'altKey']) {
      fireEvent.click(quote, { detail: 1, [modifier]: true });
    }
    fireEvent.click(quote, { detail: 1, button: 1 });
    fireEvent.click(slideRegion(), { detail: 0 });
    expect(forward).not.toHaveBeenCalled();
  });

  it('exposes only the named native profile link as the card action, keeping the slide readable', () => {
    render(<Testimonials />);
    const card = slideRegion();
    const link = screen.getByRole('link', { name: 'View my Upwork profile (opens in a new tab)' });
    expect(card.tabIndex).toBe(-1);
    expect(link.tabIndex).toBe(0);
    expect(link.getAttribute('href')).toBe(socialLinks.upwork);
    expect(link.contains(card.querySelector('blockquote'))).toBe(false);
    expect(card.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
  });

  it('keeps Direct sources separate and omits missing dates', () => {
    render(<Testimonials />);
    fireEvent.click(slideButtons()[7]);
    expect(screen.getByRole('link').getAttribute('href')).toBe(socialLinks.upwork);
    expect(screen.getByText('Direct')).toBeTruthy();
    expect(document.querySelector('#testimonials time').textContent).toBe('October 2025');
    for (const index of [8, 9]) {
      fireEvent.click(slideButtons()[index]);
      expect(screen.getByRole('link').getAttribute('href')).toBe(socialLinks.upwork);
      expect(document.querySelector('#testimonials time')).toBeNull();
      expect(screen.getByText('Direct')).toBeTruthy();
    }
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

  it('focusing the profile link stops rotation and leaving it resumes', () => {
    installMotionPreference(false);
    render(<Testimonials />);
    const quote = slideRegion();
    expect(quote.tabIndex).toBe(-1);

    fireEvent.focus(quote.querySelector('a'));
    advance(20_000);
    expectShowing(0);

    fireEvent.blur(quote.querySelector('a'), { relatedTarget: null });
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

  it('holds rotation and enables polite announcements while the source link has focus', () => {
    installMotionPreference(false);
    render(<Testimonials />);
    const link = screen.getByRole('link', { name: 'View my Upwork profile (opens in a new tab)' });
    fireEvent.focus(link);
    expect(slideRegion().getAttribute('aria-live')).toBe('polite');
    advance(20_000);
    expectShowing(0);
    fireEvent.blur(link, { relatedTarget: null });
    expect(slideRegion().getAttribute('aria-live')).toBe('off');
    advance(INTERVAL_MS);
    expectShowing(1);
  });

  it('moving focus between profile link and controls does not resume rotation', () => {
    installMotionPreference(false);
    render(<Testimonials />);
    const quote = slideRegion();
    const control = slideButtons()[0];

    fireEvent.focus(quote.querySelector('a'));
    fireEvent.blur(quote.querySelector('a'), { relatedTarget: control });
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
    fireEvent.focus(quote.querySelector('a'));
    unhoverWithMouse(boundary);
    advance(20_000);
    expectShowing(0);

    fireEvent.blur(quote.querySelector('a'), { relatedTarget: null });
    advance(INTERVAL_MS);
    expectShowing(1);
  });

  it('focus leaving while hover remains keeps rotation stopped', () => {
    installMotionPreference(false);
    render(<Testimonials />);
    const boundary = interactionBoundary();
    const quote = slideRegion();

    fireEvent.focus(quote.querySelector('a'));
    hoverWithMouse(boundary);
    fireEvent.blur(quote.querySelector('a'), { relatedTarget: null });
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

  it('keeps genuine profile-link focus holding rotation across a preference round trip', () => {
    const preference = installMotionPreference(false);
    render(<Testimonials />);
    act(() => slideRegion().querySelector('a').focus());

    act(() => preference.setReduced(true));
    act(() => preference.setReduced(false));
    expect(document.activeElement).toBe(slideRegion().querySelector('a'));
    advance(20_000);
    expectShowing(0);

    act(() => slideRegion().querySelector('a').blur());
    advance(INTERVAL_MS);
    expectShowing(1);
  });
});
