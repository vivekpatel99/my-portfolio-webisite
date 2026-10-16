/** @vitest-environment jsdom */
import { beforeEach, afterEach, expect, it, vi } from 'vitest';

let analytics;
let consent;
let send;
let unregister;

beforeEach(async () => {
  vi.resetModules();
  localStorage.clear();
  window.history.replaceState(null, '', '/?utm_source=LinkedIn&private=PRIVATE_QUERY');
  send = vi.fn();
  window.gtag = send;
  consent = await import('./consent.js');
  analytics = await import('./inquiryAnalytics.js');
  consent.saveCookieConsentPreferences({ analytics: true });
  unregister = analytics.registerInquiryAnalytics('G-SYNTHETIC');
});

afterEach(() => {
  unregister?.();
  window.gtag = undefined;
  vi.restoreAllMocks();
});

it.each([
  ['?utm_source=Google', '', 'google'],
  ['?utm_source=bing', '', 'bing'],
  ['?utm_source=linkedin', '', 'linkedin'],
  ['?utm_source=github', '', 'github'],
  ['?utm_source=PRIVATE_QUERY', '', 'other_campaign'],
  ['?utm_source=google&utm_source=github', '', 'other_campaign'],
  ['', 'https://www.google.com/search?q=PRIVATE_QUERY', 'google'],
  ['', 'https://www.bing.com/search?q=PRIVATE_QUERY', 'bing'],
  ['', 'https://www.linkedin.com/in/PRIVATE_QUERY', 'linkedin'],
  ['', 'https://github.com/PRIVATE_QUERY', 'github'],
  ['', 'https://google.com.evil.invalid/PRIVATE_QUERY', 'other_referral'],
  ['', 'https://www.vivekapatel.com/project/public/', 'direct'],
  ['', '', 'direct'],
])('bounds attribution for %s / %s', (search, referrer, expected) => {
  expect(analytics.normalizeInquirySource(search, referrer)).toBe(expected);
});

it('emits one sanitized acceptance event and retains document-entry attribution after navigation', () => {
  window.history.replaceState(null, '', '/contact/?service=ai-workflow-buildout&private=NEW_PRIVATE_QUERY');
  const measurement = analytics.beginInquiryMeasurement({ type: 'service', id: 'ai-workflow-buildout', label: 'PRIVATE_LABEL', description: 'PRIVATE_DESCRIPTION' });
  expect(send).not.toHaveBeenCalled();
  window.history.replaceState(null, '', '/legal/?private=LATER_PRIVATE_QUERY');
  analytics.completeInquiryMeasurement(measurement);
  analytics.completeInquiryMeasurement(measurement);
  expect(send).toHaveBeenCalledTimes(1);
  expect(send.mock.calls[0]).toEqual(['event', 'generate_lead', expect.objectContaining({
    send_to: 'G-SYNTHETIC', inquiry_source: 'linkedin', inquiry_type: 'service', inquiry_id: 'ai-workflow-buildout',
    page_location: 'https://www.vivekapatel.com/contact/', page_path: '/contact/', page_referrer: '',
  })]);
  expect(JSON.stringify(send.mock.calls)).not.toContain('PRIVATE');
});

it.each([null, { type: 'service', id: 'withdrawn-private-id' }, { type: 'project', id: 'unknown' }])('drops unknown context identifiers %j', context => {
  analytics.completeInquiryMeasurement(analytics.beginInquiryMeasurement(context));
  expect(send.mock.calls[0][2].inquiry_type).toBe('none');
  expect(send.mock.calls[0][2]).not.toHaveProperty('inquiry_id');
});

it('includes a validated public project identifier', async () => {
  const { caseStudies } = await import('../data/caseStudies.js');
  analytics.completeInquiryMeasurement(analytics.beginInquiryMeasurement({ type: 'project', id: caseStudies[0].slug }));
  expect(send.mock.calls[0][2]).toMatchObject({ inquiry_type: 'project', inquiry_id: caseStudies[0].slug });
});

it('never replays a send that began without consent after a later grant', () => {
  consent.saveCookieConsentPreferences({ analytics: false });
  const measurement = analytics.beginInquiryMeasurement(null);
  consent.saveCookieConsentPreferences({ analytics: true });
  analytics.completeInquiryMeasurement(measurement);
  expect(send).not.toHaveBeenCalled();
});

it.each([false, true])('withdrawal blocks completion even after regrant=%s', regrant => {
  const measurement = analytics.beginInquiryMeasurement(null);
  consent.saveCookieConsentPreferences({ analytics: false });
  if (regrant) consent.saveCookieConsentPreferences({ analytics: true });
  analytics.completeInquiryMeasurement(measurement);
  expect(send).not.toHaveBeenCalled();
});

it.each([null, 'cookie_consent_preferences'])('cross-tab removal or withdrawal invalidates pending measurement (%s)', key => {
  const measurement = analytics.beginInquiryMeasurement(null);
  window.dispatchEvent(new StorageEvent('storage', { key, newValue: null }));
  analytics.completeInquiryMeasurement(measurement);
  expect(send).not.toHaveBeenCalled();
});

it('fails closed when storage reads fail, without exposing diagnostics', () => {
  const measurement = analytics.beginInquiryMeasurement(null);
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('PRIVATE_STORAGE_DIAGNOSTIC'); });
  analytics.completeInquiryMeasurement(measurement);
  expect(send).not.toHaveBeenCalled();
});

it('cross-tab withdrawal overrides an earlier unpersisted acceptance for new submissions too', () => {
  const persist = Storage.prototype.setItem;
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Blocked synthetic write', 'QuotaExceededError'); });
  consent.saveCookieConsentPreferences({ analytics: true });
  const rejected = JSON.stringify({ analytics: false, necessary: true });
  persist.call(localStorage, 'cookie_consent_preferences', rejected);
  window.dispatchEvent(new StorageEvent('storage', { key: 'cookie_consent_preferences', newValue: rejected }));
  expect(analytics.beginInquiryMeasurement(null)).toBeNull();
  expect(send).not.toHaveBeenCalled();
});

it('keeps pending measurement disabled after its configured transport is removed', () => {
  const measurement = analytics.beginInquiryMeasurement(null);
  unregister();
  unregister = analytics.registerInquiryAnalytics('G-SYNTHETIC');
  analytics.completeInquiryMeasurement(measurement);
  expect(send).not.toHaveBeenCalled();
});

it('does not measure when there is no active GA transport or a callable gtag', () => {
  unregister();
  expect(analytics.beginInquiryMeasurement(null)).toBeNull();
  unregister = analytics.registerInquiryAnalytics('G-SYNTHETIC');
  window.gtag = undefined;
  expect(analytics.beginInquiryMeasurement(null)).toBeNull();
  expect(send).not.toHaveBeenCalled();
});

it('a telemetry exception cannot escape into the accepted inquiry flow', () => {
  const measurement = analytics.beginInquiryMeasurement(null);
  send.mockImplementation(() => { throw new Error('PRIVATE_TRANSPORT_DIAGNOSTIC'); });
  const log = vi.spyOn(console, 'error');
  expect(() => analytics.completeInquiryMeasurement(measurement)).not.toThrow();
  analytics.completeInquiryMeasurement(measurement);
  expect(send).toHaveBeenCalledTimes(1);
  expect(log).not.toHaveBeenCalled();
});
