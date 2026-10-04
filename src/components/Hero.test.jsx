/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { HERO_DETECTED_FIELD_WINDOWS, HERO_INVOICE_FIELDS } from '@/lib/heroDetectedFields';
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
    expect(rateLabel.closest('.hero-ocr-field').textContent).toContain('€45/hour');
  });

  it('shows the location once, in the invoice LOCATION field (#266)', () => {
    const { container } = renderHero();
    expect(container.textContent.match(/Linz, Austria/g)).toHaveLength(1);
    const locationLabel = screen.getByText('Location', { exact: true });
    expect(locationLabel.closest('.hero-ocr-field').textContent).toContain('Linz, Austria');
    expect(screen.queryByText('Based in Linz, Austria', { exact: true })).toBeNull();
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

  it('renders the invoice header without a document detection badge', () => {
    renderHero();
    const scanLabel = screen.queryByText('doc · extract · 0.97', { exact: true });
    const docId = screen.getByText('INV-VP-0045', { exact: true });
    const title = screen.getByText('Profile Invoice', { exact: true });
    expect(scanLabel).toBeNull();
    expect(docId).toBeTruthy();
    expect(title).toBeTruthy();
  });

  it('hides decorative portrait tracking chips from assistive technology', () => {
    renderHero();

    ['engineer', 'ID 001 · TRACKED', 'REC'].forEach((label) => {
      expect(screen.getByText(label, { exact: true }).closest('[aria-hidden="true"]')).toBeTruthy();
    });
  });

  it('renders Request a Project Estimate link to the contact route', () => {
    renderHero();
    const cta = screen.getByRole('link', { name: 'Request a Project Estimate' });
    expect(cta.getAttribute('href')).toBe('/contact/');
  });

  it('renders View Case Studies secondary CTA', () => {
    renderHero();
    const cta = screen.getByRole('link', { name: 'View Case Studies' });
    expect(cta).toBeTruthy();
  });
});

// jsdom has no layout; tests/qa/qa-responsive.spec.js measures the real gaps.
describe('Hero illustrative OCR labels (#297)', () => {
  const labels = {
    name: ['Name', '0.99'],
    role: ['Role', '0.97'],
    credential: ['Credential', '0.98'],
    success: ['Success', '0.96'],
    rate: ['Rate', '0.95'],
    location: ['Location', '0.94'],
  };

  it('attaches the fixed label and decorative score to each field', () => {
    const { container } = renderHero();
    Object.entries(labels).forEach(([id, [name, score]]) => {
      const field = container.querySelector(`[data-hero-field="${id}"]`);
      const nameLabel = screen.getByText(name, { exact: true });
      const label = nameLabel.closest('.hero-field-label');
      expect(field.contains(nameLabel)).toBe(true);
      expect(label.textContent).toBe(`${name} · ${score}`);
      expect(label.querySelector('[aria-hidden="true"]').textContent).toBe(` · ${score}`);
      expect(label.closest('[tabindex], [aria-live]')).toBeNull();
    });
    expect(container.querySelectorAll('.invoice-field-corners')).toHaveLength(2);
    expect(container.querySelector('[data-hero-field="tags"]')).toBeNull();
    expect(screen.queryByText('Tags', { exact: true })).toBeNull();
    ['OCR', 'CV', 'n8n'].forEach((tag) => expect(screen.getByText(tag, { exact: true })).toBeTruthy());
  });

  it('keeps all scores fixed across pointer interaction and reduced motion', () => {
    let reducedMotion = false;
    const listeners = new Set();
    window.matchMedia = vi.fn((query) => ({
      get matches() { return query === '(prefers-reduced-motion: reduce)' && reducedMotion; },
      addEventListener: (_event, listener) => listeners.add(listener),
      removeEventListener: (_event, listener) => listeners.delete(listener),
    }));
    const { container } = renderHero();
    const getLabels = () => Array.from(container.querySelectorAll('article .hero-field-label'), (label) => label.textContent);
    const before = getLabels();
    expect(before).toHaveLength(6);
    fireEvent.mouseMove(container.querySelector('section'), { clientX: 100, clientY: 100 });
    act(() => {
      reducedMotion = true;
      listeners.forEach((listener) => listener());
    });
    expect(getLabels()).toEqual(before);
    delete window.matchMedia;
  });
});

describe('Hero invoice header spacing (#253)', () => {
  const classesOf = (element) => element.className.split(/\s+/);

  it('spaces the status pill, title, credentials and actions apart', () => {
    const { container } = renderHero();
    const section = container.querySelector('section');
    const pillRow = screen.getByText('Inference online').parentElement.parentElement;
    const invoice = screen.getByRole('article', { name: 'Profile invoice field parse' });
    const credentials = screen.getByRole('group', { name: 'Detected credentials' });
    const actions = screen.getByRole('link', { name: 'Request a Project Estimate' }).parentElement;

    expect(classesOf(section)).toContain('max-md:pt-3');
    expect(classesOf(section)).toContain('[@media(max-height:800px)]:pt-3');
    expect(classesOf(pillRow)).toContain('mb-5');
    expect(classesOf(invoice)).toContain('pt-4');
    expect(classesOf(invoice).some((c) => c.startsWith('max-md:pt-'))).toBe(false);
    expect(classesOf(credentials)).toContain('mb-4');
    expect(classesOf(actions)).toEqual(expect.arrayContaining(['mt-1', 'lg:mt-4', 'max-md:mt-4']));
  });
});

describe('Hero portrait sizing (#252)', () => {
  it('offers candidates sized for the enlarged image inside the unchanged portrait frame', () => {
    renderHero();
    const portrait = screen.getByRole('img', { name: 'Tracked engineer portrait' });
    expect(portrait.getAttribute('src')).toBe('/assets/images/vivek-black-and-white.webp');
    expect(portrait.getAttribute('srcset')).toBe(
      '/assets/images/vivek-black-and-white-480w-3a7a7a1ab19c.webp 480w, /assets/images/vivek-black-and-white-720w-aa13477551ed.webp 720w, /assets/images/vivek-black-and-white.webp 1008w'
    );
    expect(portrait.getAttribute('sizes')).toBe('(min-width: 768px) 425px, 389px');
    expect(portrait.getAttribute('width')).toBe('1008');
    expect(portrait.getAttribute('height')).toBe('1367');
    expect(portrait.getAttribute('loading')).toBeNull();
  });
});

describe('Hero rotating annotations', () => {
  let reducedMotion;
  let visibility;
  let mediaListeners;
  let viewportCallback;
  let readOriginalStyle;

  beforeEach(() => {
    vi.useFakeTimers();
    reducedMotion = false;
    visibility = 'visible';
    mediaListeners = new Set();
    readOriginalStyle = window.getComputedStyle.bind(window);
    // jsdom does not render CSS transitions. Timer tests model completed fades;
    // the delayed-fade cases below override this measured opacity explicitly.
    vi.spyOn(window, 'getComputedStyle').mockImplementation((element) => element.classList.contains('hero-field-label')
      ? { opacity: '0' }
      : readOriginalStyle(element));
    vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visibility);
    window.matchMedia = vi.fn((query) => ({
      get matches() { return query === '(prefers-reduced-motion: reduce)' && reducedMotion; },
      addEventListener: (_type, listener) => mediaListeners.add(listener),
      removeEventListener: (_type, listener) => mediaListeners.delete(listener),
    }));
    vi.stubGlobal('IntersectionObserver', class {
      constructor(callback) { viewportCallback = callback; }
      observe() {}
      disconnect() {}
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    delete window.matchMedia;
  });

  const advance = (ms) => act(() => vi.advanceTimersByTime(ms));
  const ids = (container) => Array.from(container.querySelectorAll('[data-hero-field].invoice-field-corners'), (field) => field.dataset.heroField).sort();
  const expected = (index) => [...HERO_DETECTED_FIELD_WINDOWS[index]].sort();
  const phase = (container) => container.querySelector('section').dataset.heroHighlightPhase;
  const opacity = (container, id) => container.querySelector(`[data-hero-field="${id}"]`).style.getPropertyValue('--hero-annotation-opacity');
  const changeReducedMotion = (matches) => act(() => {
    reducedMotion = matches;
    mediaListeners.forEach((listener) => listener());
  });
  const changeVisibility = (state) => act(() => {
    visibility = state;
    document.dispatchEvent(new Event('visibilitychange'));
  });
  const changeViewport = (isIntersecting) => act(() => viewportCallback([{ isIntersecting }]));

  it('starts with two annotations while every factual value and all label rows remain mounted', () => {
    const { container } = renderHero();
    expect(ids(container)).toEqual(expected(0));
    expect(container.querySelectorAll('[data-hero-field]')).toHaveLength(6);
    expect(container.querySelectorAll('article .hero-field-label')).toHaveLength(6);
    const values = ['Vivek Patel', 'Computer Vision & AI Engineer', 'Top Rated Plus', '100% Job Success', '€45/hour', 'Linz, Austria'];
    values.forEach((value) => expect(screen.getByText(value, { exact: true }).closest('.hero-field-value').style.opacity).toBe(''));
    HERO_INVOICE_FIELDS.forEach((id) => expect(opacity(container, id)).toBe(HERO_DETECTED_FIELD_WINDOWS[0].includes(id) ? '1' : '0'));
    expect(container.querySelector('[data-hero-field="tags"]')).toBeNull();
    expect(container.querySelector('[data-hero-field="rate"]').classList.contains('hero-rotating-annotation')).toBe(true);
    expect(vi.getTimerCount()).toBe(1);
  });

  it('fades both outgoing annotations for 100ms before both incoming annotations, on a 2 second start cadence', () => {
    const { container } = renderHero();
    advance(1999);
    expect(phase(container)).toBe('initial');
    advance(1);
    expect(phase(container)).toBe('leaving');
    expect(ids(container)).toEqual(expected(0));
    expect(opacity(container, 'name')).toBe('0');
    expect(opacity(container, 'role')).toBe('0');
    expect(opacity(container, 'credential')).toBe('0');
    expect(opacity(container, 'success')).toBe('0');
    advance(100);
    expect(phase(container)).toBe('entering');
    expect(ids(container)).toEqual(expected(1));
    expect(opacity(container, 'credential')).toBe('1');
    expect(opacity(container, 'success')).toBe('1');
    expect(opacity(container, 'name')).toBe('0');
    expect(opacity(container, 'role')).toBe('0');
    advance(100);
    expect(phase(container)).toBe('steady');
    advance(1799);
    expect(phase(container)).toBe('steady');
    advance(1);
    expect(phase(container)).toBe('leaving');
    expect(vi.getTimerCount()).toBe(1);
  });

  it('cycles through all three row pairs and preserves fixed scores, mounted labels and values', () => {
    const { container } = renderHero();
    const labels = [...container.querySelectorAll('article .hero-field-label')];
    const values = [...container.querySelectorAll('.hero-field-value')];
    const scores = labels.map((label) => label.textContent);
    for (let step = 1; step <= 3; step += 1) {
      advance(step === 1 ? 2000 : 1800);
      advance(100);
      advance(100);
      expect(ids(container)).toEqual(expected(step % 3));
      expect([...container.querySelectorAll('article .hero-field-label')]).toEqual(labels);
      expect([...container.querySelectorAll('.hero-field-value')]).toEqual(values);
      expect(labels.map((label) => label.textContent)).toEqual(scores);
      expect(container.querySelectorAll('.invoice-field-corners')).toHaveLength(2);
    }
  });

  it('keeps the next pair hidden until a delayed outgoing fade actually finishes', () => {
    const { container } = renderHero();
    let labelOpacity = '0.25';
    vi.spyOn(window, 'getComputedStyle').mockImplementation((element) => element.classList.contains('hero-field-label')
      ? { opacity: labelOpacity }
      : readOriginalStyle(element));
    advance(2000);
    advance(100);
    expect(phase(container)).toBe('leaving');
    expect(ids(container)).toEqual(expected(0));
    advance(32);
    expect(ids(container)).toEqual(expected(0));
    labelOpacity = '0';
    advance(32);
    expect(phase(container)).toBe('entering');
    expect(ids(container)).toEqual(expected(1));
  });

  it.each(['hidden', 'offscreen', 'reduced motion', 'unmount'])('cancels a pending fade frame on %s', (reason) => {
    const { container, unmount } = renderHero();
    vi.spyOn(window, 'getComputedStyle').mockImplementation((element) => element.classList.contains('hero-field-label')
      ? { opacity: '0.25' }
      : readOriginalStyle(element));
    advance(2000);
    advance(100);
    expect(phase(container)).toBe('leaving');
    expect(vi.getTimerCount()).toBe(1);
    if (reason === 'hidden') changeVisibility('hidden');
    if (reason === 'offscreen') changeViewport(false);
    if (reason === 'reduced motion') changeReducedMotion(true);
    if (reason === 'unmount') unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each(['leaving', 'entering'])('hidden tabs settle %s and resume without catch-up', (targetPhase) => {
    const { container } = renderHero();
    advance(2000);
    if (targetPhase === 'entering') advance(100);
    const current = ids(container);
    changeVisibility('hidden');
    expect(vi.getTimerCount()).toBe(0);
    expect(ids(container)).toEqual(current);
    current.forEach((id) => expect(opacity(container, id)).toBe('1'));
    advance(10000);
    changeVisibility('visible');
    advance(1999);
    expect(phase(container)).toBe('initial');
    advance(1);
    expect(phase(container)).toBe('leaving');
  });

  it.each(['leaving', 'entering'])('offscreen settles %s, then resumes from a full dwell', (targetPhase) => {
    const { container } = renderHero();
    advance(2000);
    if (targetPhase === 'entering') advance(100);
    const currentIndex = targetPhase === 'leaving' ? 0 : 1;
    changeViewport(false);
    expect(ids(container)).toEqual(expected(currentIndex));
    expected(currentIndex).forEach((id) => expect(opacity(container, id)).toBe('1'));
    expect(vi.getTimerCount()).toBe(0);
    changeViewport(true);
    expect(vi.getTimerCount()).toBe(1);
    advance(1999);
    expect(ids(container)).toEqual(expected(currentIndex));
    expect(phase(container)).toBe('initial');
    advance(1);
    expect(phase(container)).toBe('leaving');
  });

  it('uses the first window without any timer when reduced motion is enabled at load', () => {
    reducedMotion = true;
    const { container } = renderHero();
    expect(ids(container)).toEqual(expected(0));
    expect(vi.getTimerCount()).toBe(0);
    advance(10000);
    expect(ids(container)).toEqual(expected(0));
  });

  it.each(['leaving', 'entering'])('honors live reduced motion during %s and restarts from the first window', (targetPhase) => {
    const { container } = renderHero();
    advance(2000);
    if (targetPhase === 'entering') advance(100);
    changeReducedMotion(true);
    expect(ids(container)).toEqual(expected(0));
    expect(vi.getTimerCount()).toBe(0);
    changeReducedMotion(false);
    advance(1999);
    expect(phase(container)).toBe('initial');
    advance(1);
    expect(phase(container)).toBe('leaving');
  });

  it('does not schedule rotation when the document starts hidden', () => {
    visibility = 'hidden';
    const { container } = renderHero();
    expect(ids(container)).toEqual(expected(0));
    expect(vi.getTimerCount()).toBe(0);
    changeVisibility('visible');
    expect(vi.getTimerCount()).toBe(1);
    advance(1999);
    expect(phase(container)).toBe('initial');
  });

  it.each(['initial', 'leaving', 'entering'])('cleans up the single timer and listeners on unmount during %s', (targetPhase) => {
    const removeListener = vi.spyOn(document, 'removeEventListener');
    const { unmount } = renderHero();
    if (targetPhase !== 'initial') advance(2000);
    if (targetPhase === 'entering') advance(100);
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
    expect(mediaListeners.size).toBe(0);
    expect(removeListener.mock.calls.some(([event]) => event === 'visibilitychange')).toBe(true);
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
    screen.getByRole('link', { name: 'Request a Project Estimate' }).focus();
    screen.getByRole('link', { name: 'View Case Studies' }).focus();
    expect(frames.size).toBe(0);
    expect(writes).toBe(0);
  });
});
