/**
 * @vitest-environment jsdom
 */
import React, { lazy, useEffect } from 'react';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Seo } from '@/lib/seo';
import ErrorBoundary from './ErrorBoundary';
import Layout from './Layout';
import { ROUTE_ERROR_HEADING } from './RouteErrorBoundary';
import ScrollToTop from './ScrollToTop';

const shell = vi.hoisted(() => ({ headerThrows: false }));

vi.mock('@/components/Header', () => ({
  default: () => {
    if (shell.headerThrows) throw new Error('header failure');
    return <header><a href="/">Site home</a></header>;
  },
}));
vi.mock('@/components/Footer', () => ({ default: () => <footer id="site-footer">Footer</footer> }));
vi.mock('@/components/ui/toaster', () => ({ Toaster: () => null }));
vi.mock('@/components/CustomCursor', () => ({ default: () => null }));
vi.mock('@/components/GoogleAnalytics', () => ({ default: () => null }));
vi.mock('@/components/SentryTelemetry', () => ({ default: () => null }));
vi.mock('@/components/CookieConsentBanner', () => ({ default: () => null }));

const FailingChunk = lazy(() => Promise.reject(new Error('Failed to fetch dynamically imported module')));
const ThrowingRoute = () => { throw new Error('render failure'); };
const HealthyRoute = () => (
  <>
    <Seo
      title="Healthy route | Vivek Patel"
      description="A healthy route used to verify route metadata recovery."
      path="/healthy"
    />
    <h1>Healthy page</h1>
  </>
);
let homeMounts = 0;
const StatefulHome = () => {
  useEffect(() => { homeMounts += 1; }, []);
  return <h1>Home page</h1>;
};

let navigate;
const NavigateProbe = () => {
  navigate = useNavigate();
  return null;
};

const renderApp = (entry) => render(
  <ErrorBoundary>
    <MemoryRouter initialEntries={[entry]}>
      <ScrollToTop />
      <NavigateProbe />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<StatefulHome />} />
          <Route path="lazy-broken" element={<FailingChunk />} />
          <Route path="render-broken" element={<ThrowingRoute />} />
          <Route path="healthy" element={<HealthyRoute />} />
        </Route>
      </Routes>
    </MemoryRouter>
  </ErrorBoundary>,
);

const expectShellIntact = () => {
  expect(screen.getByRole('banner')).toBeTruthy();
  expect(screen.getByRole('contentinfo')).toBeTruthy();
  expect(document.getElementById('main-content')).toBeTruthy();
};

describe('RouteErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    shell.headerThrows = false;
    homeMounts = 0;
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('keeps the shell when a lazy route chunk fails and focuses the recovery heading', async () => {
    renderApp('/lazy-broken');

    const heading = await screen.findByRole('heading', { level: 1, name: ROUTE_ERROR_HEADING });
    expectShellIntact();
    expect(document.getElementById('main-content').contains(heading)).toBe(true);
    // Focus moves in a passive effect, which can run after the heading is observable.
    await waitFor(() => expect(document.activeElement).toBe(heading));

    const retry = screen.getByRole('button', { name: 'Retry' });
    expect(retry.getAttribute('type')).toBe('button');
    expect(screen.getByRole('link', { name: 'Back to Home' }).getAttribute('href')).toBe('/');
  });

  it('keeps the shell when a route throws while rendering', () => {
    renderApp('/render-broken');

    expect(screen.getByRole('heading', { level: 1, name: ROUTE_ERROR_HEADING })).toBeTruthy();
    expectShellIntact();
  });

  it.each([
    ['a lazy route import rejects', '/lazy-broken'],
    ['a route throws while rendering', '/render-broken'],
  ])('sets error metadata when %s and restores healthy route metadata', async (_scenario, failedPath) => {
    renderApp('/healthy');
    await waitFor(() => {
      expect(document.title).toBe('Healthy route | Vivek Patel');
      expect(document.head.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('index, follow');
    });

    act(() => navigate(failedPath));
    await screen.findByRole('heading', { level: 1, name: ROUTE_ERROR_HEADING });

    await waitFor(() => {
      expect(document.title).toBe('Page unavailable | Vivek Patel');
      expect(document.head.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex, nofollow');
      expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href'))
        .toBe(`https://www.vivekapatel.com${failedPath}/`);
    });

    act(() => navigate('/healthy'));

    expect(await screen.findByRole('heading', { level: 1, name: 'Healthy page' })).toBeTruthy();
    await waitFor(() => {
      expect(document.title).toBe('Healthy route | Vivek Patel');
      expect(document.head.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('index, follow');
    });
  });

  it('clears the fallback after navigating to another route', async () => {
    renderApp('/lazy-broken');
    await screen.findByRole('heading', { name: ROUTE_ERROR_HEADING });

    act(() => navigate('/healthy'));

    expect(screen.queryByRole('heading', { name: ROUTE_ERROR_HEADING })).toBeNull();
    expect(screen.getByRole('heading', { name: 'Healthy page' })).toBeTruthy();
    await waitFor(() => expect(document.activeElement).toBe(document.getElementById('main-content')));
  });

  it('preserves recovery heading focus after navigation reaches a route that throws', async () => {
    renderApp('/healthy');

    act(() => navigate('/render-broken'));

    const heading = screen.getByRole('heading', { level: 1, name: ROUTE_ERROR_HEADING });
    expectShellIntact();
    expect(document.activeElement).toBe(heading);
    await act(async () => { await new Promise(window.requestAnimationFrame); });
    expect(document.activeElement).toBe(heading);
  });

  it('focuses the recovery heading when navigation reaches a failing lazy route', async () => {
    renderApp('/healthy');

    act(() => navigate('/lazy-broken'));

    const heading = await screen.findByRole('heading', { level: 1, name: ROUTE_ERROR_HEADING });
    expectShellIntact();
    await waitFor(() => expect(document.activeElement).toBe(heading));
    await act(async () => { await new Promise(window.requestAnimationFrame); });
    expect(document.activeElement).toBe(heading);
  });

  it('clears the fallback after navigation with a hash', () => {
    renderApp('/render-broken');
    act(() => navigate('/healthy#details'));

    expect(screen.queryByRole('heading', { name: ROUTE_ERROR_HEADING })).toBeNull();
  });

  it('does not remount a healthy route on hash navigation', () => {
    renderApp('/');
    expect(homeMounts).toBe(1);

    act(() => navigate('/#services'));
    act(() => navigate('/'));

    expect(homeMounts).toBe(1);
  });

  it('leaves shell failures to the root error boundary', () => {
    shell.headerThrows = true;
    renderApp('/healthy');

    expect(screen.getByText(/Something went wrong\./)).toBeTruthy();
    expect(screen.queryByRole('heading', { name: ROUTE_ERROR_HEADING })).toBeNull();
  });
});
