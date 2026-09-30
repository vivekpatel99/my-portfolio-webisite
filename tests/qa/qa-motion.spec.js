import { expect, test as base } from '@playwright/test';
import { guardLocalNavigation } from './qa-navigation-guard.js';
import { createConvexTransportMock } from './qa-convex-transport-mock.js';

const SAFE_FAILURE_MESSAGE = "We couldn't send your request. Please try again, or use the email address on this page.";

// Route roots and the consent banner must not translate or scale on entrance
// under reduced motion, while keeping their fade; normal entrances are unchanged.

const ROUTES = ['/contact/', '/legal/', '/data-policy/'];
const SAMPLE_TIMES_MS = [0, 100, 300, 1000];
const IDENTITY_TOLERANCE = 0.01;
const PAGE_ENTRANCE_OFFSET_PX = 20;
const CONSENT_ENTRANCE_OFFSET_PX = -10;
// Opacity can finish a hair below 1 (e.g. 0.9995) without being unreadable.
const READABLE_OPACITY = 0.99;
const CONVEX_MOCK_HOST = 'qa-motion.convex.cloud';
// Footer link used to leave each route by client-side navigation.
const NEXT_ROUTE_LINK = {
  '/contact/': 'Privacy Policy',
  '/legal/': 'Cookie Policy',
  '/data-policy/': 'Contact Me',
};

const test = base.extend({
  contactTransport: [async ({ context }, use) => {
    const transport = createConvexTransportMock();
    // Every HTTP request outside loopback is aborted, so analytics, Sentry and
    // CDN requests never leave the browser.
    await context.route('**/*', guardLocalNavigation);
    // Every WebSocket is routed without connectToServer: the synthetic Convex
    // socket is answered in memory and all others are closed.
    await context.routeWebSocket('**/*', (webSocket) => {
      const url = new URL(webSocket.url());
      if (url.protocol === 'wss:' && url.hostname === CONVEX_MOCK_HOST) {
        transport.connect(webSocket);
        return;
      }
      webSocket.close({ code: 1008, reason: 'Motion QA blocks non-Convex WebSockets' });
    });
    await use(transport);
  }, { auto: true }],
});

// Guards against the emulation silently not applying.
async function expectMotionPreference(page, reduce) {
  const matches = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  expect(matches, 'prefers-reduced-motion emulation').toBe(reduce);
}

// Runs before any page script. Samples the computed transform of each target
// from the moment it is inserted into the DOM, not after goto resolves.
function installEntranceSampler(sampleTimes) {
  const targets = {
    route: '#main-content > div:has(h1)',
    consent: '[role="dialog"][aria-labelledby="cookie-consent-title"]',
  };
  window.__motionSamples = {};

  const sample = (key, element, target, start) => {
    const style = getComputedStyle(element);
    const matrix = new DOMMatrix(style.transform === 'none' ? undefined : style.transform);
    window.__motionSamples[key].push({
      target,
      elapsed: Math.round(performance.now() - start),
      transform: style.transform,
      x: matrix.m41,
      y: matrix.m42,
      scaleX: matrix.m11,
      scaleY: matrix.m22,
      opacity: Number(style.opacity),
    });
  };

  const sampleFromInsertion = (key, element) => {
    window.__motionSamples[key] = [];
    const start = performance.now();
    for (const target of sampleTimes) {
      if (target === 0) sample(key, element, 0, start);
      else setTimeout(() => sample(key, element, target, start), target);
    }
  };

  const observer = new MutationObserver(() => {
    for (const [key, selector] of Object.entries(targets)) {
      if (window.__motionSamples[key]) continue;
      const element = document.querySelector(selector);
      if (element) sampleFromInsertion(key, element);
    }
  });
  observer.observe(document, { subtree: true, childList: true });

  // Samples the next newly inserted element of a target, such as a reopened
  // consent banner or the root of a client-side navigation.
  window.__armEntranceSampler = (target) => {
    const key = `${target}:next`;
    const previous = document.querySelector(targets[target]);
    delete window.__motionSamples[key];
    const nextObserver = new MutationObserver(() => {
      const element = document.querySelector(targets[target]);
      if (!element || element === previous) return;
      nextObserver.disconnect();
      sampleFromInsertion(key, element);
    });
    nextObserver.observe(document, { subtree: true, childList: true });
    return key;
  };
}

function waitForSamples(page, keys) {
  return page.waitForFunction(
    ({ sampleKeys, count }) => sampleKeys.every((key) => window.__motionSamples[key]?.length === count),
    { sampleKeys: keys, count: SAMPLE_TIMES_MS.length },
    { timeout: 15_000 },
  );
}

async function collectEntranceSamples(page, route) {
  await page.addInitScript(installEntranceSampler, SAMPLE_TIMES_MS);
  await page.goto(route);
  // The consent banner mounts ~1.5s after load for first-time visitors.
  await waitForSamples(page, ['route', 'consent']);
  return page.evaluate(() => window.__motionSamples);
}

// A full page load would reset the in-page samples, so a completed sample set
// also proves the trigger kept the app mounted.
async function sampleNextEntrance(page, target, trigger) {
  const key = await page.evaluate((name) => window.__armEntranceSampler(name), target);
  await trigger();
  await waitForSamples(page, [key]);
  return page.evaluate((sampleKey) => window.__motionSamples[sampleKey], key);
}

// Loads the route, then flips the OS preference while the consent banner is
// mounted but still waiting for its delayed first appearance.
async function switchPreferenceBeforeFirstConsent(page, route, reduce) {
  await page.addInitScript(installEntranceSampler, SAMPLE_TIMES_MS);
  await page.goto(route);
  await page.emulateMedia({ reducedMotion: reduce ? 'reduce' : 'no-preference' });
  await expectMotionPreference(page, reduce);
  const shownEarly = await page.evaluate(() => Boolean(window.__motionSamples.consent));
  expect(shownEarly, 'consent banner still hidden when the preference changed').toBe(false);
  await waitForSamples(page, ['consent']);
  return page.evaluate(() => window.__motionSamples.consent);
}

function reopenConsentFromFooter(page) {
  return sampleNextEntrance(page, 'consent', () => (
    page.locator('#site-footer').getByRole('button', { name: 'Manage Consent', exact: true }).click()
  ));
}

function navigateFromFooter(page, route) {
  return sampleNextEntrance(page, 'route', () => (
    page.locator('#site-footer').getByRole('link', { name: NEXT_ROUTE_LINK[route], exact: true }).click()
  ));
}

function expectIdentityTransform(samples, label) {
  for (const sample of samples) {
    const context = `${label} at ${sample.target}ms (${sample.transform})`;
    expect.soft(Math.abs(sample.x), context).toBeLessThan(IDENTITY_TOLERANCE);
    expect.soft(Math.abs(sample.y), context).toBeLessThan(IDENTITY_TOLERANCE);
    expect.soft(Math.abs(sample.scaleX - 1), context).toBeLessThan(IDENTITY_TOLERANCE);
    expect.soft(Math.abs(sample.scaleY - 1), context).toBeLessThan(IDENTITY_TOLERANCE);
  }
}

function expectSettled(samples, label) {
  const last = samples.at(-1);
  expect(last.opacity, `${label} final opacity`).toBeGreaterThan(READABLE_OPACITY);
  expect(Math.abs(last.y), `${label} final y (${last.transform})`).toBeLessThan(IDENTITY_TOLERANCE);
}

// Reduced motion: no translation or scale at any sample, but the fade is kept.
function expectReducedEntrance(samples, label) {
  expectIdentityTransform(samples, label);
  expect(samples[0].opacity, `${label} mount opacity`).toBe(0);
  expectSettled(samples, label);
}

function expectNormalRouteEntrance(samples, label) {
  const [mount, early] = samples;
  expect(mount.y, `${label} mount y`).toBeCloseTo(PAGE_ENTRANCE_OFFSET_PX, 0);
  expect(mount.opacity, `${label} mount opacity`).toBe(0);
  // Still travelling 100ms in: the entrance is animated, not skipped.
  expect(early.y, `${label} y at 100ms`).toBeGreaterThan(1);
  expectSettled(samples, label);
}

function expectNormalConsentEntrance(samples, label) {
  const [mount] = samples;
  expect(mount.y, `${label} mount y`).toBeCloseTo(CONSENT_ENTRANCE_OFFSET_PX, 0);
  expect(mount.opacity, `${label} mount opacity`).toBe(0);
  expectSettled(samples, label);
}

async function expectReadableRoute(page) {
  const heading = page.locator('#main-content h1').first();
  await expect(heading).toBeVisible();
  await expect.poll(() => page.locator('#main-content > div:has(h1)').evaluate(
    (element) => Number(getComputedStyle(element).opacity),
  )).toBeGreaterThan(READABLE_OPACITY);
}

async function tabTo(page, locator, maxPresses = 120) {
  for (let presses = 0; presses < maxPresses; presses += 1) {
    await page.keyboard.press('Tab');
    if (await locator.evaluate((element) => element === document.activeElement)) return;
  }
  throw new Error(`Could not reach element by keyboard within ${maxPresses} Tab presses`);
}

async function expectConsentKeyboardAccessible(page) {
  const dialog = page.getByRole('dialog', { name: 'We value your privacy' });
  await expect(dialog).toBeVisible();
  const reject = dialog.getByRole('button', { name: 'Reject', exact: true });
  await expect(dialog.getByRole('button', { name: 'Accept', exact: true })).toBeVisible();
  await expect(reject).toBeVisible();
  await tabTo(page, reject);
  await page.keyboard.press('Enter');
  await expect(dialog).toBeHidden();
  const saved = await page.evaluate(() => localStorage.getItem('cookie_consent_preferences'));
  expect(JSON.parse(saved)).toMatchObject({ analytics: false });
}

async function expectContactFeedbackVisible(page, transport) {
  await page.goto('/contact/');
  const form = page.locator('form[data-sensitive-telemetry]');
  const submit = form.locator('button[type="submit"]');
  await expect(page.getByRole('heading', { name: /Request a Project Estimate/i })).toBeVisible();

  await submit.click();
  await expect(page.locator('#name-error')).toBeVisible();
  await expect(page.getByText('Uh oh! Missing fields.', { exact: true })).toBeVisible();

  await page.getByLabel('Full Name *').fill('Synthetic QA Motion');
  await page.getByLabel('Email Address *').fill('qa-motion@example.invalid');
  await page.getByLabel('Project Description *').fill('Synthetic motion regression test.');

  await submit.click();
  await expect(submit).toBeDisabled();
  await expect(submit).toContainText(/sending/i);
  await expect.poll(() => transport.state.mutations.length).toBe(1);

  transport.releasePending('failure');
  const failureToast = page.getByRole('status').filter({
    has: page.getByText('Submission Failed', { exact: true }),
  });
  await expect(failureToast).toBeVisible();
  await expect(failureToast).toContainText(SAFE_FAILURE_MESSAGE);
  await expect(submit).toBeEnabled();

  await submit.click();
  await expect.poll(() => transport.state.mutations.length).toBe(2);
  await expect(page.getByText('Request received', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Full Name *')).toHaveValue('');
}

test.describe('reduced motion', () => {
  // reducedMotion is not a top-level test.use option.
  test.use({ contextOptions: { reducedMotion: 'reduce' } });
  test.beforeEach(async ({ page }) => expectMotionPreference(page, true));

  for (const route of ROUTES) {
    test(`${route} root and consent enter without translating or scaling`, async ({ page }) => {
      const samples = await collectEntranceSamples(page, route);
      expectReducedEntrance(samples.route, `${route} root`);
      expectReducedEntrance(samples.consent, 'consent banner');
      await expectReadableRoute(page);
      await expectConsentKeyboardAccessible(page);
    });
  }

  test('contact validation, pending, failure and success feedback stay visible', async ({ page, contactTransport }) => {
    await expectContactFeedbackVisible(page, contactTransport);
  });
});

test.describe('normal motion', () => {
  test.use({ contextOptions: { reducedMotion: 'no-preference' } });
  test.beforeEach(async ({ page }) => expectMotionPreference(page, false));

  for (const route of ROUTES) {
    test(`${route} root and consent keep their entrance and settle`, async ({ page }) => {
      const samples = await collectEntranceSamples(page, route);
      expectNormalRouteEntrance(samples.route, `${route} root`);
      expectNormalConsentEntrance(samples.consent, 'consent banner');
      await expectReadableRoute(page);
      await expectConsentKeyboardAccessible(page);
    });
  }

  test('contact validation, pending, failure and success feedback stay visible', async ({ page, contactTransport }) => {
    await expectContactFeedbackVisible(page, contactTransport);
  });
});

// The preference can change while the app stays mounted. Later entrances must
// follow the current preference, not the one read when the app first mounted.
for (const { from, to, reduce } of [
  { from: 'no-preference', to: 'reduce', reduce: true },
  { from: 'reduce', to: 'no-preference', reduce: false },
]) {
  test.describe(`preference changed from ${from} to ${to} after load`, () => {
    test.use({ contextOptions: { reducedMotion: from } });
    test.beforeEach(async ({ page }) => expectMotionPreference(page, !reduce));

    const expectConsentEntrance = reduce ? expectReducedEntrance : expectNormalConsentEntrance;
    const expectRouteEntrance = reduce ? expectReducedEntrance : expectNormalRouteEntrance;

    for (const route of ROUTES) {
      test(`${route} delayed and reopened consent and next route follow ${to}`, async ({ page }) => {
        const firstConsent = await switchPreferenceBeforeFirstConsent(page, route, reduce);
        expectConsentEntrance(firstConsent, 'delayed first consent');
        await expectConsentKeyboardAccessible(page);

        const reopenedConsent = await reopenConsentFromFooter(page);
        expectConsentEntrance(reopenedConsent, 'reopened consent');
        await expect(page.getByRole('dialog', { name: 'We value your privacy' })).toBeFocused();
        await expectConsentKeyboardAccessible(page);

        const nextRoot = await navigateFromFooter(page, route);
        expectRouteEntrance(nextRoot, `root after leaving ${route}`);
        await expectReadableRoute(page);
      });
    }
  });
}
