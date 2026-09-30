/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { HERO_INVOICE_FIELDS } from '@/lib/heroDetectedFields';
import Hero from './Hero';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
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
    const credential = screen.getByText('Top Rated Plus', { exact: true });
    const whisper = screen.getByText('Upwork freelancer');
    expect(credential).toBeTruthy();
    expect(whisper).toBeTruthy();
  });

  it('renders 100% Job Success credential in hero invoice', () => {
    renderHero();
    const credential = screen.getByText('100% Job Success', { exact: true });
    const whisper = screen.getByText('Client delivery record');
    expect(credential).toBeTruthy();
    expect(whisper).toBeTruthy();
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
    expect(proofsGroup).not.toBeNull();
    expect(proofsGroup.className).toContain('grid');
    expect(proofsGroup.className).toContain('grid-cols-2');
  });

  it('proofs appear under Role field in invoice structure', () => {
    const { container } = renderHero();
    const roleLabel = screen.getByText('Role');
    const roleField = roleLabel.parentElement;
    const proofsGroup = container.querySelector('[role="group"][aria-label="Detected credentials"]');
    
    expect(roleField).not.toBeNull();
    expect(proofsGroup).not.toBeNull();
    
    const invoice = container.querySelector('article[aria-label="Profile invoice field parse"]');
    const children = Array.from(invoice.children);
    const roleIndex = children.findIndex(el => el.contains(roleLabel));
    const proofsIndex = children.findIndex(el => el === proofsGroup);
    
    expect(proofsIndex).toBeGreaterThan(roleIndex);
  });

  it('renders exact H1: Computer Vision & AI Engineer', () => {
    renderHero();
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.textContent).toBe('Computer Vision & AI Engineer');
  });

  it('displays Euro rate €45/hour only (no dollar or other currencies)', () => {
    const { container } = renderHero();
    const euroRate = screen.getByText('€45/hour', { exact: true });
    expect(euroRate).toBeTruthy();
    expect(container.textContent).not.toMatch(/\$|USD|GBP|£/);
  });

  it('shows the rate once, in the invoice RATE field, without the old hero line (#195)', () => {
    const { container } = renderHero();
    expect(screen.getAllByText('€45/hour', { exact: true })).toHaveLength(1);
    expect(container.textContent.match(/€45/g)).toHaveLength(1);
    expect(screen.queryByText(/Starting at/)).toBeNull();
    const rateLabel = screen.getByText('Rate', { exact: true });
    expect(rateLabel.parentElement.textContent).toContain('€45/hour');
    expect(screen.getByText('Based in Linz, Austria', { exact: true })).toBeTruthy();
  });

  it('displays exact location: Linz, Austria', () => {
    renderHero();
    const location = screen.getByText('Linz, Austria', { exact: true });
    expect(location).toBeTruthy();
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
    const scanLabel = screen.getByText('doc · extract · 0.97', { exact: true });
    const docId = screen.getByText('INV-VP-0045', { exact: true });
    const title = screen.getByText('Profile Invoice', { exact: true });
    expect(scanLabel).toBeTruthy();
    expect(docId).toBeTruthy();
    expect(title).toBeTruthy();
  });

  it('renders Request a Project Estimate CTA', () => {
    renderHero();
    const cta = screen.getByRole('button', { name: 'Request a Project Estimate' });
    expect(cta).toBeTruthy();
  });

  it('renders View Case Studies secondary CTA', () => {
    renderHero();
    const cta = screen.getByRole('link', { name: 'View Case Studies' });
    expect(cta).toBeTruthy();
  });
});

describe('Hero randomized field bboxes (#206)', () => {
  const FIELD_VALUES = {
    name: 'Vivek Patel',
    role: 'Computer Vision & AI Engineer',
    credential: 'Top Rated Plus',
    success: '100% Job Success',
    rate: '€45/hour',
    location: 'Linz, Austria',
  };

  const loadFreshPageHeroWithRandom = async (randomValue) => {
    vi.resetModules();
    vi.spyOn(Math, 'random').mockReturnValue(randomValue);
    const { default: FreshHero } = await import('./Hero');
    return FreshHero;
  };

  const renderFresh = (Component) =>
    render(
      <BrowserRouter>
        <Component />
      </BrowserRouter>
    );

  const detectedIds = (container) =>
    Array.from(container.querySelectorAll('[data-hero-field].invoice-field-corners'))
      .map((el) => el.getAttribute('data-hero-field'))
      .sort();

  it('frames exactly 3 of the 6 invoice fields', async () => {
    const FreshHero = await loadFreshPageHeroWithRandom(0);
    const { container } = renderFresh(FreshHero);

    const fields = container.querySelectorAll('[data-hero-field]');
    expect(fields).toHaveLength(6);
    expect(Array.from(fields, (el) => el.getAttribute('data-hero-field')).sort()).toEqual(
      [...HERO_INVOICE_FIELDS].sort()
    );
    expect(container.querySelectorAll('.invoice-field-corners')).toHaveLength(3);
    expect(detectedIds(container)).toEqual(['credential', 'role', 'success']);
  });

  it('keeps every label and value visible regardless of selection', async () => {
    const FreshHero = await loadFreshPageHeroWithRandom(0.999999);
    const { container } = renderFresh(FreshHero);

    ['Name', 'Role', 'Credential', 'Success', 'Rate', 'Location'].forEach((label) => {
      expect(screen.getByText(label, { exact: true })).toBeTruthy();
    });
    Object.entries(FIELD_VALUES).forEach(([id, value]) => {
      const field = container.querySelector(`[data-hero-field="${id}"]`);
      expect(field.textContent).toContain(value);
    });
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(FIELD_VALUES.role);
    expect(screen.getByText('doc · extract · 0.97', { exact: true })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Request a Project Estimate' })).toBeTruthy();
  });

  it('keeps the selection stable across rerenders and remounts in one page load', async () => {
    const FreshHero = await loadFreshPageHeroWithRandom(0);
    const { container, rerender, unmount } = renderFresh(FreshHero);
    const initial = detectedIds(container);

    vi.mocked(Math.random).mockReturnValue(0.999999);
    rerender(
      <BrowserRouter>
        <FreshHero />
      </BrowserRouter>
    );
    expect(detectedIds(container)).toEqual(initial);

    unmount();
    const remounted = renderFresh(FreshHero);
    expect(detectedIds(remounted.container)).toEqual(initial);
  });

  it('can pick a different selection after a fresh page load', async () => {
    const first = renderFresh(await loadFreshPageHeroWithRandom(0));
    const firstIds = detectedIds(first.container);
    cleanup();

    const second = renderFresh(await loadFreshPageHeroWithRandom(0.999999));
    const secondIds = detectedIds(second.container);

    expect(firstIds).toHaveLength(3);
    expect(secondIds).toHaveLength(3);
    expect(secondIds).not.toEqual(firstIds);
  });
});

describe('Hero motion lifecycle (#232)', () => {
  const HERO_RECT = { left: 0, top: 0, width: 1000, height: 500, right: 1000, bottom: 500, x: 0, y: 0 };
  const POINTER = { clientX: 750, clientY: 125 };

  let media;
  let observers;
  let frames;
  let nextFrameId;
  let writes;

  const setMedia = (query, matches) => {
    act(() => {
      media[query].matches = matches;
      media[query].listeners.forEach((listener) => listener());
    });
  };

  const setHeroIntersecting = (isIntersecting) => {
    act(() => {
      observers.forEach((observer) => observer.callback([{ isIntersecting }]));
    });
  };

  const deliverIntersectionBatch = (...states) => {
    act(() => {
      observers.forEach((observer) => observer.callback(states.map((isIntersecting) => ({ isIntersecting }))));
    });
  };

  const flushFrame = () => {
    const pending = [...frames.entries()];
    frames.clear();
    pending.forEach(([, callback]) => callback(performance.now()));
    return pending.length;
  };

  const flushUntilIdle = (limit = 500) => {
    let count = 0;
    while (frames.size && count < limit) {
      flushFrame();
      count += 1;
    }
    return count;
  };

  beforeEach(() => {
    media = {
      '(prefers-reduced-motion: reduce)': { matches: false, listeners: new Set() },
      '(pointer: fine)': { matches: true, listeners: new Set() },
    };
    window.matchMedia = vi.fn((query) => {
      const state = media[query];
      return {
        get matches() { return state.matches; },
        media: query,
        addEventListener: (_type, listener) => state.listeners.add(listener),
        removeEventListener: (_type, listener) => state.listeners.delete(listener),
      };
    });

    observers = [];
    vi.stubGlobal('IntersectionObserver', class {
      constructor(callback) {
        this.callback = callback;
        observers.push(this);
      }
      observe() {}
      disconnect() {
        observers = observers.filter((observer) => observer !== this);
      }
    });

    frames = new Map();
    nextFrameId = 1;
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback) => {
      const id = nextFrameId;
      nextFrameId += 1;
      frames.set(id, callback);
      return id;
    }));
    vi.stubGlobal('cancelAnimationFrame', vi.fn((id) => frames.delete(id)));

    writes = 0;
    const setProperty = CSSStyleDeclaration.prototype.setProperty;
    vi.spyOn(CSSStyleDeclaration.prototype, 'setProperty').mockImplementation(function (name, ...rest) {
      if (name === '--px' || name === '--py') writes += 1;
      return setProperty.call(this, name, ...rest);
    });
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(HERO_RECT);
  });

  afterEach(() => {
    cleanup();
    delete window.matchMedia;
    vi.unstubAllGlobals();
  });

  const renderMotionHero = () => {
    const utils = renderHero();
    const hero = utils.container.querySelector('section');
    const boxes = Array.from(hero.querySelectorAll('[data-depth]'));
    return { ...utils, hero, boxes };
  };

  const positions = (boxes) => boxes.map((box) => [
    box.style.getPropertyValue('--px'),
    box.style.getPropertyValue('--py'),
  ]);

  const expectedPositions = (boxes, x, y) => boxes.map((box) => {
    const depth = Number(box.getAttribute('data-depth'));
    return [`${(x * depth).toFixed(2)}px`, `${(y * depth).toFixed(2)}px`];
  });

  const neutral = (boxes) => boxes.map(() => ['0.00px', '0.00px']);

  const namedAnimationCounts = (container) => ({
    drift: container.querySelectorAll('[style*="bg-drift"]').length,
    ghosts: container.querySelectorAll('[style*="ghost-trail"]').length,
    scan: container.querySelectorAll('[style*="photo-scan"]').length,
  });

  it('schedules no frames and writes no positions at mount', () => {
    const { hero, boxes } = renderMotionHero();
    expect(boxes).toHaveLength(8);
    expect(frames.size).toBe(0);
    expect(writes).toBe(0);
    expect(hero.getAttribute('data-hero-motion')).toBe('running');
    expect(namedAnimationCounts(hero)).toEqual({ drift: 8, ghosts: 4, scan: 1 });
  });

  it('eases toward a fine-pointer target, settles exactly on it, then stops writing', () => {
    const { hero, boxes } = renderMotionHero();
    const target = expectedPositions(boxes, 10, -10);
    const getAttribute = vi.spyOn(Element.prototype, 'getAttribute');

    fireEvent.mouseMove(hero, POINTER);
    fireEvent.mouseMove(hero, POINTER);
    expect(frames.size).toBe(1);

    flushFrame();
    const firstFrame = positions(boxes);
    expect(firstFrame).not.toEqual(neutral(boxes));
    expect(firstFrame).not.toEqual(target);

    const frameCount = flushUntilIdle();
    expect(frameCount).toBeGreaterThan(10);
    expect(frameCount).toBeLessThan(200);
    expect(getAttribute.mock.calls.some(([name]) => name === 'data-depth')).toBe(false);
    getAttribute.mockRestore();
    expect(positions(boxes)).toEqual(target);

    const settledWrites = writes;
    flushFrame();
    fireEvent.mouseMove(hero, POINTER);
    expect(frames.size).toBe(0);
    expect(writes).toBe(settledWrites);
  });

  it('returns to neutral on pointer leave and stops', () => {
    const { hero, boxes } = renderMotionHero();
    fireEvent.mouseMove(hero, POINTER);
    flushUntilIdle();

    fireEvent.mouseLeave(hero);
    expect(frames.size).toBe(1);
    flushUntilIdle();
    expect(positions(boxes)).toEqual(neutral(boxes));
    expect(frames.size).toBe(0);
  });

  it('offscreen cancels the pending frame, pauses CSS animations, and resumes without a frame', () => {
    const { hero, boxes } = renderMotionHero();
    fireEvent.mouseMove(hero, POINTER);
    flushFrame();
    flushFrame();
    expect(frames.size).toBe(1);

    setHeroIntersecting(false);
    expect(frames.size).toBe(0);
    expect(hero.getAttribute('data-hero-motion')).toBe('paused');
    expect(positions(boxes)).toEqual(neutral(boxes));

    const offscreenWrites = writes;
    fireEvent.mouseMove(hero, POINTER);
    expect(frames.size).toBe(0);
    expect(writes).toBe(offscreenWrites);

    setHeroIntersecting(true);
    expect(hero.getAttribute('data-hero-motion')).toBe('running');
    expect(frames.size).toBe(0);
    expect(writes).toBe(offscreenWrites);
    expect(namedAnimationCounts(hero)).toEqual({ drift: 8, ghosts: 4, scan: 1 });

    fireEvent.mouseMove(hero, POINTER);
    flushUntilIdle();
    expect(positions(boxes)).toEqual(expectedPositions(boxes, 10, -10));
  });

  it('uses the latest entry when one observer callback batches several visibility changes', () => {
    const { hero, boxes } = renderMotionHero();
    fireEvent.mouseMove(hero, POINTER);
    flushFrame();
    expect(frames.size).toBe(1);

    deliverIntersectionBatch(false, true);
    expect(hero.getAttribute('data-hero-motion')).toBe('running');
    expect(frames.size).toBe(1);

    deliverIntersectionBatch(true, false);
    expect(hero.getAttribute('data-hero-motion')).toBe('paused');
    expect(frames.size).toBe(0);
    expect(positions(boxes)).toEqual(neutral(boxes));

    const offscreenWrites = writes;
    fireEvent.mouseMove(hero, POINTER);
    expect(frames.size).toBe(0);
    expect(writes).toBe(offscreenWrites);
  });

  it('has no parallax loop or named animations with reduced motion at load', () => {
    media['(prefers-reduced-motion: reduce)'].matches = true;
    const { hero } = renderMotionHero();
    fireEvent.mouseMove(hero, POINTER);
    expect(frames.size).toBe(0);
    expect(writes).toBe(0);
    expect(namedAnimationCounts(hero)).toEqual({ drift: 0, ghosts: 0, scan: 0 });
  });

  it('follows reduced-motion changes after load', () => {
    const { hero, boxes } = renderMotionHero();
    fireEvent.mouseMove(hero, POINTER);
    flushFrame();

    setMedia('(prefers-reduced-motion: reduce)', true);
    expect(frames.size).toBe(0);
    expect(positions(boxes)).toEqual(neutral(boxes));
    expect(namedAnimationCounts(hero)).toEqual({ drift: 0, ghosts: 0, scan: 0 });
    fireEvent.mouseMove(hero, POINTER);
    expect(frames.size).toBe(0);

    setMedia('(prefers-reduced-motion: reduce)', false);
    expect(frames.size).toBe(0);
    expect(namedAnimationCounts(hero)).toEqual({ drift: 8, ghosts: 4, scan: 1 });
    fireEvent.mouseMove(hero, POINTER);
    expect(frames.size).toBe(1);
  });

  it('has no parallax loop on a coarse primary pointer and follows pointer changes', () => {
    media['(pointer: fine)'].matches = false;
    const { hero, boxes } = renderMotionHero();
    fireEvent.mouseMove(hero, POINTER);
    expect(frames.size).toBe(0);
    expect(writes).toBe(0);
    expect(namedAnimationCounts(hero)).toEqual({ drift: 8, ghosts: 4, scan: 1 });

    setMedia('(pointer: fine)', true);
    fireEvent.mouseMove(hero, POINTER);
    flushFrame();
    expect(frames.size).toBe(1);

    setMedia('(pointer: fine)', false);
    expect(frames.size).toBe(0);
    expect(positions(boxes)).toEqual(neutral(boxes));
  });

  it('cancels the pending frame on unmount', () => {
    const { hero, unmount } = renderMotionHero();
    fireEvent.mouseMove(hero, POINTER);
    expect(frames.size).toBe(1);
    unmount();
    expect(frames.size).toBe(0);
    expect(observers).toHaveLength(0);
    expect(Object.values(media).every((state) => state.listeners.size === 0)).toBe(true);
  });

  it('does not start the loop from keyboard focus on the hero CTAs', () => {
    renderMotionHero();
    screen.getByRole('button', { name: 'Request a Project Estimate' }).focus();
    screen.getByRole('link', { name: 'View Case Studies' }).focus();
    expect(frames.size).toBe(0);
    expect(writes).toBe(0);
  });
});
