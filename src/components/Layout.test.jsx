/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { m } from 'framer-motion';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Layout from './Layout';
import { COOKIE_CONSENT_KEY } from '@/lib/consent';

const storage = new Map();
const telemetryConsent = vi.fn();

vi.mock('@/components/Header', () => ({ default: () => <header>Header</header> }));
vi.mock('@/components/Footer', () => ({ default: () => <footer>Footer</footer> }));
vi.mock('@/components/CustomCursor', () => ({ default: () => null }));
vi.mock('@/components/ui/toaster', () => ({ Toaster: () => null }));
vi.mock('@/components/ui/use-toast', () => ({ toast: vi.fn() }));
vi.mock('@/components/GoogleAnalytics', () => ({
  default: ({ hasConsent }) => {
    telemetryConsent('analytics', hasConsent);
    return null;
  },
}));
vi.mock('@/components/SentryTelemetry', () => ({
  default: ({ hasConsent }) => {
    telemetryConsent('sentry', hasConsent);
    return null;
  },
}));

const HEADER_HEIGHT = 69;
const BANNER_HEIGHT = 77;
let scrollPosition;
const SETTINGS_HEIGHT = 240;

function MotionConfiguration() {
  return <m.div aria-label="Animated route" initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ duration: 0.01 }}>Contact animation</m.div>;
}

function renderLayout() {
  return render(
    <MemoryRouter initialEntries={['/contact']}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/contact" element={<><p>Contact page</p><MotionConfiguration /></>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

const spacerHeight = () => screen.getByTestId('cookie-consent-spacer').style.height;
const lastConsent = (kind) => telemetryConsent.mock.calls.filter(([name]) => name === kind).at(-1)?.[1];

describe('Layout consent spacer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    storage.clear();
    scrollPosition = 0;
    vi.spyOn(window, 'scrollY', 'get').mockImplementation(() => scrollPosition);
    vi.spyOn(window, 'scrollTo').mockImplementation(({ top }) => { scrollPosition = top; });
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function bounds() {
      const top = this.dataset.testid === 'cookie-consent-spacer' ? HEADER_HEIGHT - scrollPosition : 0;
      return { top, bottom: top, height: 0, width: 0, left: 0, right: 0 };
    });
    const computedStyle = window.getComputedStyle;
    vi.spyOn(window, 'getComputedStyle').mockImplementation((element) => {
      const style = computedStyle(element);
      if (element.getAttribute('role') === 'dialog') Object.defineProperty(style, 'top', { value: `${HEADER_HEIGHT}px` });
      return style;
    });
    telemetryConsent.mockClear();
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        clear: () => storage.clear(),
        getItem: (key) => storage.get(key) ?? null,
        removeItem: (key) => storage.delete(key),
        setItem: (key, value) => storage.set(key, String(value)),
      },
    });
    // jsdom has no layout: give the banner and its settings panel real heights.
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function offsetHeight() {
      if (this.getAttribute('role') === 'dialog') return BANNER_HEIGHT;
      if (this.id && this.getAttribute('data-state') === 'open') return SETTINGS_HEIGHT;
      return 0;
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('provides animation features to routed content', async () => {
    renderLayout();
    await act(async () => vi.advanceTimersByTime(1000));
    expect(screen.getByLabelText('Animated route').style.transform).toBe('none');
  });

  it.each([
    ['rejected', false],
    ['accepted', true],
  ])('reserves no space after a %s decision is reloaded', async (_label, analytics) => {
    storage.set(COOKIE_CONSENT_KEY, JSON.stringify({ necessary: true, analytics }));
    renderLayout();

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(spacerHeight()).toBe('0px');
    expect(lastConsent('analytics')).toBe(analytics);
    expect(lastConsent('sentry')).toBe(analytics);
  });

  it('reserves the delayed first-visit banner as soon as it becomes visible', async () => {
    renderLayout();
    expect(spacerHeight()).toBe('0px');
    expect(screen.queryByRole('dialog')).toBeNull();
    await act(async () => vi.advanceTimersByTime(1500));

    expect(screen.getByRole('dialog', { name: /we value your privacy/i })).toBeTruthy();
    expect(spacerHeight()).toBe(`${BANNER_HEIGHT}px`);
  });

  it.each([
    ['Reject', () => screen.getByRole('button', { name: /^reject$/i })],
    ['close', () => screen.getByRole('button', { name: /close cookie consent banner/i })],
  ])('releases the space and keeps telemetry off after %s', async (_label, getControl) => {
    renderLayout();
    await act(async () => vi.advanceTimersByTime(1500));

    fireEvent.click(getControl());

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(spacerHeight()).toBe('0px');
    expect(lastConsent('analytics')).toBe(false);
    expect(lastConsent('sentry')).toBe(false);
    expect(JSON.parse(storage.get(COOKIE_CONSENT_KEY))).toEqual({ necessary: true, analytics: false });
  });

  it('reserves reopened-manager and expanded-settings space, then releases it on save', async () => {
    storage.set(COOKIE_CONSENT_KEY, JSON.stringify({ necessary: true, analytics: true }));
    renderLayout();
    expect(lastConsent('sentry')).toBe(true);

    act(() => {
      window.dispatchEvent(new CustomEvent('manage-cookies'));
    });
    expect(spacerHeight()).toBe(`${BANNER_HEIGHT}px`);

    fireEvent.click(screen.getByRole('button', { name: /options/i }));
    expect(spacerHeight()).toBe(`${BANNER_HEIGHT + SETTINGS_HEIGHT}px`);

    fireEvent.click(screen.getByRole('checkbox', { name: /analytics/i }));
    fireEvent.click(screen.getByRole('button', { name: /save preferences/i }));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(spacerHeight()).toBe('0px');
    expect(lastConsent('analytics')).toBe(false);
    expect(lastConsent('sentry')).toBe(false);
  });

  it('preserves a scrolled reading position through manager, settings and dismissal', () => {
    storage.set(COOKIE_CONSENT_KEY, JSON.stringify({ necessary: true, analytics: false }));
    renderLayout();
    scrollPosition = 500;
    const readingTop = () => HEADER_HEIGHT + parseFloat(spacerHeight()) + 700 - scrollPosition;
    const originalTop = readingTop();

    act(() => window.dispatchEvent(new CustomEvent('manage-cookies')));
    expect(readingTop()).toBe(originalTop);
    fireEvent.click(screen.getByRole('button', { name: /options/i }));
    expect(readingTop()).toBe(originalTop);
    fireEvent.click(screen.getByRole('button', { name: /options/i }));
    expect(readingTop()).toBe(originalTop);
    fireEvent.click(screen.getByRole('button', { name: /^accept$/i }));
    expect(readingTop()).toBe(originalTop);
    expect(spacerHeight()).toBe('0px');
    expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 500, behavior: 'instant' });
  });

  it('preserves reading when updating scroll padding itself changes the browser scroll position', () => {
    storage.set(COOKIE_CONSENT_KEY, JSON.stringify({ necessary: true, analytics: false }));
    renderLayout();
    scrollPosition = 500;
    const rootStyle = document.documentElement.style;
    const setProperty = rootStyle.setProperty.bind(rootStyle);
    vi.spyOn(rootStyle, 'setProperty').mockImplementation((name, value) => {
      const previousPadding = Math.max(128, parseFloat(rootStyle.getPropertyValue(name)) || 0);
      setProperty(name, value);
      if (name === '--consent-banner-bottom') {
        scrollPosition -= Math.max(128, parseFloat(value)) - previousPadding;
      }
    });
    const readingTop = () => HEADER_HEIGHT + parseFloat(spacerHeight()) + 700 - scrollPosition;
    const originalTop = readingTop();
    act(() => window.dispatchEvent(new CustomEvent('manage-cookies')));
    expect(readingTop()).toBe(originalTop);
    fireEvent.click(screen.getByRole('button', { name: /options/i }));
    expect(readingTop()).toBe(originalTop);
  });

  it('preserves an already scrolled first visit when the delayed banner arrives', async () => {
    scrollPosition = 500;
    renderLayout();
    await act(async () => vi.advanceTimersByTime(1500));
    expect(spacerHeight()).toBe(`${BANNER_HEIGHT}px`);
    expect(scrollPosition).toBe(500 + BANNER_HEIGHT);
    fireEvent.click(screen.getByRole('button', { name: /^accept$/i }));
    expect(scrollPosition).toBe(500);
  });

  it('does not scroll a visitor at the top when the banner opens or closes', async () => {
    renderLayout();
    await act(async () => vi.advanceTimersByTime(1500));
    expect(spacerHeight()).toBe(`${BANNER_HEIGHT}px`);
    fireEvent.click(screen.getByRole('button', { name: /^reject$/i }));
    expect(window.scrollTo).not.toHaveBeenCalled();
    expect(scrollPosition).toBe(0);
  });

  it('restores an existing native-anchoring style after reservation and on unmount', async () => {
    const root = document.documentElement;
    root.style.overflowAnchor = 'auto';
    const { unmount } = renderLayout();
    await act(async () => vi.advanceTimersByTime(1500));
    expect(root.style.overflowAnchor).toBe('none');
    await act(async () => vi.advanceTimersByTime(20));
    expect(root.style.overflowAnchor).toBe('auto');
    fireEvent.click(screen.getByRole('button', { name: /options/i }));
    expect(root.style.overflowAnchor).toBe('none');
    unmount();
    expect(root.style.overflowAnchor).toBe('auto');
    root.style.removeProperty('overflow-anchor');
  });

  it('mirrors the visible banner bottom into root scroll padding and removes it when hidden or unmounted', async () => {
    const root = document.documentElement;
    root.style.setProperty('color-scheme', 'dark');
    const bannerBottom = () => root.style.getPropertyValue('--consent-banner-bottom');
    storage.set(COOKIE_CONSENT_KEY, JSON.stringify({ necessary: true, analytics: false }));
    const { unmount } = renderLayout();
    expect(bannerBottom()).toBe('');

    act(() => {
      window.dispatchEvent(new CustomEvent('manage-cookies'));
    });
    expect(bannerBottom()).toBe(`${HEADER_HEIGHT + BANNER_HEIGHT}px`);
    fireEvent.click(screen.getByRole('button', { name: /options/i }));
    expect(bannerBottom()).toBe(`${HEADER_HEIGHT + BANNER_HEIGHT + SETTINGS_HEIGHT}px`);

    fireEvent.click(screen.getByRole('button', { name: /^reject$/i }));
    expect(bannerBottom()).toBe('');

    act(() => {
      window.dispatchEvent(new CustomEvent('manage-cookies'));
    });
    expect(bannerBottom()).not.toBe('');
    unmount();
    expect(bannerBottom()).toBe('');
    expect(root.style.getPropertyValue('color-scheme')).toBe('dark');
    root.style.removeProperty('color-scheme');
  });

  it('opens the manager with settings collapsed after an earlier expanded session', async () => {
    storage.set(COOKIE_CONSENT_KEY, JSON.stringify({ necessary: true, analytics: false }));
    renderLayout();

    act(() => {
      window.dispatchEvent(new CustomEvent('manage-cookies'));
    });
    fireEvent.click(screen.getByRole('button', { name: /options/i }));
    fireEvent.click(screen.getByRole('button', { name: /^reject$/i }));
    act(() => {
      window.dispatchEvent(new CustomEvent('manage-cookies'));
    });

    expect(screen.queryByRole('button', { name: /save preferences/i })).toBeNull();
    expect(spacerHeight()).toBe(`${BANNER_HEIGHT}px`);
  });
});
