/**
 * @vitest-environment jsdom
 */
import React from 'react';
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
vi.mock('framer-motion', () => {
  const MotionDiv = React.forwardRef(({ children, initial, animate, exit, transition, ...props }, ref) => (
    <div ref={ref} {...props}>{children}</div>
  ));
  return { AnimatePresence: ({ children }) => <>{children}</>, motion: { div: MotionDiv } };
});

const BANNER_HEIGHT = 77;
const SETTINGS_HEIGHT = 240;

function renderLayout() {
  return render(
    <MemoryRouter initialEntries={['/contact']}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/contact" element={<p>Contact page</p>} />
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

  const advancePastBannerDelay = () => act(async () => {
    vi.advanceTimersByTime(1500);
  });

  it.each([
    ['rejected', false],
    ['accepted', true],
  ])('reserves no space after a %s decision is reloaded', async (_label, analytics) => {
    storage.set(COOKIE_CONSENT_KEY, JSON.stringify({ necessary: true, analytics }));
    renderLayout();
    await advancePastBannerDelay();

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(spacerHeight()).toBe('0px');
    expect(lastConsent('analytics')).toBe(analytics);
    expect(lastConsent('sentry')).toBe(analytics);
  });

  it('reserves the banner space only once the delayed first-visit banner is visible', async () => {
    renderLayout();
    expect(spacerHeight()).toBe('0px');

    await advancePastBannerDelay();

    expect(screen.getByRole('dialog', { name: /we value your privacy/i })).toBeTruthy();
    expect(spacerHeight()).toBe(`${72 + BANNER_HEIGHT}px`);
  });

  it.each([
    ['Reject', () => screen.getByRole('button', { name: /^reject$/i })],
    ['close', () => screen.getByRole('button', { name: /close cookie consent banner/i })],
  ])('releases the space and keeps telemetry off after %s', async (_label, getControl) => {
    renderLayout();
    await advancePastBannerDelay();

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
    expect(spacerHeight()).toBe(`${72 + BANNER_HEIGHT}px`);

    fireEvent.click(screen.getByRole('button', { name: /options/i }));
    expect(spacerHeight()).toBe(`${72 + BANNER_HEIGHT + SETTINGS_HEIGHT}px`);

    fireEvent.click(screen.getByRole('checkbox', { name: /analytics/i }));
    fireEvent.click(screen.getByRole('button', { name: /save preferences/i }));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(spacerHeight()).toBe('0px');
    expect(lastConsent('analytics')).toBe(false);
    expect(lastConsent('sentry')).toBe(false);
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
    expect(bannerBottom()).toBe(`${72 + BANNER_HEIGHT}px`);
    fireEvent.click(screen.getByRole('button', { name: /options/i }));
    expect(bannerBottom()).toBe(`${72 + BANNER_HEIGHT + SETTINGS_HEIGHT}px`);

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
    expect(spacerHeight()).toBe(`${72 + BANNER_HEIGHT}px`);
  });
});
