/** @vitest-environment jsdom */
/** @vitest-environment-options {"url":"https://www.vivekapatel.com/"} */
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const router = vi.hoisted(() => ({ location: { pathname: '/contact/', search: '?private=PRIVATE_QUERY', hash: '#PRIVATE_HASH' } }));
vi.mock('react-router-dom', () => ({ useLocation: () => router.location }));
let GoogleAnalytics;
let analytics;
let consent;

beforeEach(async () => {
  vi.resetModules();
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('VITE_GA_TRACKING_ID', 'G-SYNTHETIC');
  localStorage.clear();
  window.gtag = undefined;
  window.dataLayer = [];
  router.location = { pathname: '/contact/', search: '?private=PRIVATE_QUERY', hash: '#PRIVATE_HASH' };
  consent = await import('../lib/consent.js');
  consent.saveCookieConsentPreferences({ analytics: true });
  analytics = await import('../lib/inquiryAnalytics.js');
  GoogleAnalytics = (await import('./GoogleAnalytics.jsx')).default;
});

afterEach(() => {
  cleanup();
  document.getElementById('google-analytics-gtag')?.remove();
  window.gtag = undefined;
  window.dataLayer = [];
  localStorage.clear();
  vi.unstubAllEnvs();
});

it('configures canonical public page metadata and enables accepted inquiry measurement only while mounted and consented', () => {
  const view = render(<GoogleAnalytics hasConsent />);
  const calls = () => window.dataLayer.map(args => Array.from(args));
  expect(document.getElementById('google-analytics-gtag')).not.toBeNull();
  expect(calls().find(call => call[0] === 'config')).toEqual(['config', 'G-SYNTHETIC', expect.objectContaining({
    page_location: 'https://www.vivekapatel.com/contact/', page_path: '/contact/', page_referrer: '',
  })]);
  expect(JSON.stringify(calls())).not.toContain('PRIVATE');
  const measurement = analytics.beginInquiryMeasurement(null);
  analytics.completeInquiryMeasurement(measurement);
  expect(calls().filter(call => call[0] === 'event')).toHaveLength(1);
  const pending = analytics.beginInquiryMeasurement(null);
  consent.saveCookieConsentPreferences({ analytics: false });
  view.rerender(<GoogleAnalytics hasConsent={false} />);
  expect(document.getElementById('google-analytics-gtag')).toBeNull();
  expect(window.gtag).toBeUndefined();
  analytics.completeInquiryMeasurement(pending);
  expect(calls().filter(call => call[0] === 'event')).toHaveLength(1);
});

it('does not send extra page views for query/hash changes, and bounds unknown routes', () => {
  const view = render(<GoogleAnalytics hasConsent />);
  router.location = { pathname: '/contact/', search: '?private=LATER_PRIVATE_QUERY', hash: '#LATER_PRIVATE_HASH' };
  view.rerender(<GoogleAnalytics hasConsent />);
  expect(window.dataLayer.filter(args => args[0] === 'config')).toHaveLength(1);
  router.location = { pathname: '/PRIVATE_UNKNOWN_ROUTE/', search: '', hash: '' };
  view.rerender(<GoogleAnalytics hasConsent />);
  const configs = window.dataLayer.filter(args => args[0] === 'config');
  expect(configs).toHaveLength(2);
  expect(configs[1][2]).toMatchObject({ page_path: '/not-found/', page_title: 'Page not found' });
  expect(JSON.stringify(window.dataLayer)).not.toContain('PRIVATE');
});

it.each(['rejected', 'development'])('keeps transport inactive for %s', state => {
  if (state === 'development') vi.stubEnv('NODE_ENV', 'development');
  render(<GoogleAnalytics hasConsent={state !== 'rejected'} />);
  expect(analytics.beginInquiryMeasurement(null)).toBeNull();
  expect(window.dataLayer.filter(args => args[0] === 'config' || args[0] === 'event')).toHaveLength(0);
});

it('keeps transport inactive without a configured tracking ID', async () => {
  vi.resetModules();
  vi.stubEnv('VITE_GA_TRACKING_ID', '');
  const UnconfiguredAnalytics = (await import('./GoogleAnalytics.jsx')).default;
  const inactive = await import('../lib/inquiryAnalytics.js');
  render(<UnconfiguredAnalytics hasConsent />);
  expect(inactive.beginInquiryMeasurement(null)).toBeNull();
  expect(window.dataLayer).toHaveLength(0);
});
