import { expect, test } from './qa-test.js';

const COOKIE_KEY = 'cookie_consent_preferences';

test.beforeEach(async ({ page }) => {
  await page.addInitScript((key) => {
    if (window.self === window.top) {
      localStorage.removeItem(key);
    }
  }, COOKIE_KEY);
});

test('cookie banner appears after delay on first visit', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /Accept/i })).toBeHidden();
  await expect(page.getByRole('button', { name: /Accept/i })).toBeVisible({ timeout: 5000 });
});

test('accept all persists consent in localStorage', async ({ page }) => {
  await page.goto('/');
  const acceptAll = page.getByRole('button', { name: /Accept/i });
  await expect(acceptAll).toBeVisible({ timeout: 5000 });
  await acceptAll.click();
  await expect
    .poll(async () => page.evaluate((key) => localStorage.getItem(key), COOKIE_KEY), { timeout: 5000 })
    .toBeTruthy();
  const stored = await page.evaluate((key) => localStorage.getItem(key), COOKIE_KEY);
  const prefs = JSON.parse(stored);
  expect(prefs.analytics).toBe(true);
});

test('reject all persists rejection', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Reject', exact: true }).click({ timeout: 5000 });
  const stored = await page.evaluate((key) => localStorage.getItem(key), COOKIE_KEY);
  const prefs = JSON.parse(stored);
  expect(prefs.analytics).toBe(false);
});

test('reject all blocks analytics and Sentry network requests', async ({ page }) => {
  const telemetryRequests = [];
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('googletagmanager.com') || url.includes('google-analytics.com') || url.includes('sentry.io')) {
      telemetryRequests.push(url);
    }
  });

  await page.goto('/');
  await page.getByRole('button', { name: 'Reject', exact: true }).click({ timeout: 5000 });
  await page.waitForTimeout(1000);
  expect(telemetryRequests).toEqual([]);
});

test('manage consent reopens banner from footer', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Accept/i }).click({ timeout: 5000 });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.getByRole('button', { name: /Manage Consent/i }).click();
  await expect(page.getByRole('button', { name: /Accept/i })).toBeVisible();
});

test.skip('TODO: accepting analytics consent should load Google Analytics when a measurement ID is configured', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Accept/i }).click({ timeout: 5000 });
  const gtagLoaded = await page.evaluate(() => typeof window.gtag !== 'undefined');
  expect(gtagLoaded).toBe(true);
});

const blockedConsentChoices = [
  { label: 'Reject', analytics: false, choose: (page) => page.getByRole('button', { name: 'Reject', exact: true }).click() },
  {
    label: 'Close',
    analytics: false,
    choose: (page) => page.getByRole('button', { name: /close cookie consent banner/i }).click(),
  },
  {
    label: 'Save with analytics off',
    analytics: false,
    choose: async (page) => {
      await page.getByRole('button', { name: /options/i }).click();
      await page.getByRole('button', { name: /save preferences/i }).click();
    },
  },
  {
    label: 'Save with analytics on',
    analytics: true,
    choose: async (page) => {
      await page.getByRole('button', { name: /options/i }).click();
      await page.getByRole('checkbox', { name: /analytics/i }).click();
      await page.getByRole('button', { name: /save preferences/i }).click();
    },
  },
  { label: 'Accept', analytics: true, choose: (page) => page.getByRole('button', { name: 'Accept', exact: true }).click() },
];

for (const errorName of ['SecurityError', 'QuotaExceededError']) {
  for (const { label, analytics, choose } of blockedConsentChoices) {
    test(`${label} dismisses the banner for the session when storage writes throw ${errorName}`, async ({ page }) => {
      await page.addInitScript((name) => {
        if (window.self === window.top) {
          Storage.prototype.setItem = () => {
            throw new DOMException('Storage write blocked', name);
          };
        }
      }, errorName);
      const errors = [];
      page.on('pageerror', (error) => errors.push(`${error.name}: ${error.message}`));
      const telemetryRequests = [];
      page.on('request', (request) => {
        const url = request.url();
        if (url.includes('googletagmanager.com') || url.includes('google-analytics.com') || url.includes('sentry.io')) {
          telemetryRequests.push(url);
        }
      });

      await page.goto('/');
      const banner = page.getByRole('dialog', { name: /we value your privacy/i });
      await expect(banner).toBeVisible({ timeout: 5000 });
      await choose(page);

      await expect(banner).toBeHidden();
      expect(await page.evaluate((key) => localStorage.getItem(key), COOKIE_KEY)).toBeNull();

      await page.evaluate(() => {
        window.__consentSpaMarker = true;
      });
      await page.getByRole('link', { name: 'Privacy Policy' }).click();
      await expect(page).toHaveURL(/\/legal\/?$/);
      expect(await page.evaluate(() => window.__consentSpaMarker)).toBe(true);
      await page.waitForTimeout(2000);
      await expect(banner).toBeHidden();

      await page.getByRole('button', { name: /manage consent/i }).click();
      await expect(banner).toBeVisible();
      await page.getByRole('button', { name: /options/i }).click();
      await expect(page.getByRole('checkbox', { name: /analytics/i })).toHaveAttribute(
        'aria-checked',
        String(analytics)
      );

      expect(errors).toEqual([]);
      if (!analytics) {
        expect(telemetryRequests).toEqual([]);
      }
    });
  }
}

for (const reducedMotion of ['no-preference', 'reduce']) {
  for (const width of [390, 1440]) {
    test(`consent manager keyboard flow retains choice when storage writes throw (${reducedMotion}, ${width}px)`, async ({ page }) => {
      await page.addInitScript(() => {
        if (window.self === window.top) {
          Storage.prototype.setItem = () => {
            throw new DOMException('Storage write blocked', 'SecurityError');
          };
        }
      });
      const errors = [];
      page.on('pageerror', (error) => errors.push(`${error.name}: ${error.message}`));
      await page.emulateMedia({ reducedMotion });
      await page.setViewportSize({ width, height: 900 });

      await page.goto('/');
      const banner = page.getByRole('dialog', { name: /we value your privacy/i });
      await page.getByRole('button', { name: 'Reject', exact: true }).click({ timeout: 5000 });
      await expect(banner).toBeHidden();

      const manageConsent = page.getByRole('button', { name: /manage consent/i });
      const reopenManager = async () => {
        await manageConsent.focus();
        await page.keyboard.press('Enter');
        await expect(banner).toBeVisible();
        await expect(banner).toBeFocused();
      };

      await reopenManager();
      const options = banner.getByRole('button', { name: /options/i });
      const analytics = banner.getByRole('checkbox', { name: /analytics/i });
      for (const control of [
        banner.getByRole('button', { name: 'Accept', exact: true }),
        banner.getByRole('button', { name: 'Reject', exact: true }),
        options,
      ]) {
        await page.keyboard.press('Tab');
        await expect(control).toBeFocused();
      }
      await page.keyboard.press('Enter');
      await page.keyboard.press('Tab');
      await expect(analytics).toBeFocused();
      await expect(analytics).toHaveAttribute('aria-checked', 'false');
      await page.keyboard.press('Space');
      await expect(analytics).toHaveAttribute('aria-checked', 'true');
      await page.keyboard.press('Tab');
      await expect(banner.getByRole('button', { name: /save preferences/i })).toBeFocused();
      await page.keyboard.press('Enter');

      await expect(banner).toBeHidden();
      await expect(manageConsent).toBeFocused();
      expect(await page.evaluate((key) => localStorage.getItem(key), COOKIE_KEY)).toBeNull();

      await reopenManager();
      await options.click();
      await expect(analytics).toHaveAttribute('aria-checked', 'true');
      expect(errors).toEqual([]);
    });
  }
}

async function seedStaleAcceptanceWithBlockedWrites(page) {
  await page.addInitScript((key) => {
    if (window.self === window.top) {
      localStorage.setItem(key, JSON.stringify({ necessary: true, analytics: true }));
      Storage.prototype.setItem = () => {
        throw new DOMException('Storage write blocked', 'SecurityError');
      };
    }
  }, COOKIE_KEY);
}

const readStoredAnalytics = (page) =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null')?.analytics, COOKIE_KEY);

async function reopenConsentManager(page, banner) {
  await page.getByRole('button', { name: /manage consent/i }).click();
  await expect(banner).toBeVisible();
}

async function expectAnalyticsChecked(banner, checked) {
  await banner.getByRole('button', { name: /options/i }).click();
  await expect(banner.getByRole('checkbox', { name: /analytics/i })).toHaveAttribute('aria-checked', String(checked));
}

async function captureEdgeTelemetry(page, marker, { initialize = false } = {}) {
  await page.evaluate(async ({ eventMarker, shouldInitialize }) => {
    const telemetryUrl = performance.getEntriesByType('resource')
      .map((entry) => entry.name)
      .find((url) => url.includes('/src/lib/sentryTelemetry.js'));
    if (!telemetryUrl) throw new Error('The app did not load the Sentry telemetry module');
    const telemetry = await import(telemetryUrl);
    if (shouldInitialize) await telemetry.initializeSentryTelemetry();
    telemetry.captureException(new Error(eventMarker));
  }, { eventMarker: marker, shouldInitialize: initialize });
}

test('session rejection overrides stale stored acceptance when storage writes throw', async ({ page }) => {
  await seedStaleAcceptanceWithBlockedWrites(page);
  const errors = [];
  page.on('pageerror', (error) => errors.push(`${error.name}: ${error.message}`));

  await page.goto('/');
  const banner = page.getByRole('dialog', { name: /we value your privacy/i });
  await reopenConsentManager(page, banner);
  await expectAnalyticsChecked(banner, true);
  await banner.getByRole('button', { name: 'Reject', exact: true }).click();
  await expect(banner).toBeHidden();

  await reopenConsentManager(page, banner);
  await expectAnalyticsChecked(banner, false);
  expect(await readStoredAnalytics(page)).toBe(true);
  expect(errors).toEqual([]);
});

async function blockStorageWrites(page) {
  await page.addInitScript(() => {
    if (window.self === window.top) {
      Storage.prototype.setItem = () => {
        throw new DOMException('Storage write blocked', 'SecurityError');
      };
    }
  });
}

async function observeFakeTelemetryBoundary(page) {
  const envelopeBodies = [];
  const contactMutations = [];
  const errors = [];

  await page.route('https://telemetry.invalid/**', async (route) => {
    envelopeBodies.push(route.request().postData() ?? '');
    await route.fulfill({ status: 200, contentType: 'text/plain', body: '' });
  });
  page.on('request', (request) => {
    if (request.url().includes('/api/mutation')) contactMutations.push(request.url());
  });
  page.on('pageerror', (error) => errors.push(`${error.name}: ${error.message}`));

  return { sentEnvelopes: () => envelopeBodies.join('\n'), contactMutations, errors };
}

async function expectTelemetrySilent(page, sentEnvelopes, marker) {
  await captureEdgeTelemetry(page, marker);
  await page.waitForTimeout(500);
  expect(sentEnvelopes()).not.toContain(marker);
}

test('fake Sentry transport stops after session rejection overrides stale stored acceptance when storage writes throw', async ({ page }) => {
  test.skip(process.env.QA_FAKE_SENTRY !== '1', 'requires the local fake-Sentry QA server mode');

  const allowedMarker = 'QA_EDGE_STALE_ACCEPTED_TELEMETRY_EVENT';
  const rejectedMarker = 'QA_EDGE_SESSION_REJECTED_TELEMETRY_EVENT';
  const closedMarker = 'QA_EDGE_REJECTED_THEN_CLOSED_TELEMETRY_EVENT';
  const { sentEnvelopes, contactMutations, errors } = await observeFakeTelemetryBoundary(page);
  await seedStaleAcceptanceWithBlockedWrites(page);

  await page.goto('/');
  const banner = page.getByRole('dialog', { name: /we value your privacy/i });
  await captureEdgeTelemetry(page, allowedMarker, { initialize: true });
  await expect.poll(sentEnvelopes).toContain(allowedMarker);

  await reopenConsentManager(page, banner);
  await banner.getByRole('button', { name: 'Reject', exact: true }).click();
  await expect(banner).toBeHidden();
  await expectTelemetrySilent(page, sentEnvelopes, rejectedMarker);

  await reopenConsentManager(page, banner);
  await expectAnalyticsChecked(banner, false);
  expect(await readStoredAnalytics(page)).toBe(true);
  await banner.getByRole('button', { name: /close cookie consent banner/i }).click();
  await expect(banner).toBeHidden();
  await expectTelemetrySilent(page, sentEnvelopes, closedMarker);

  expect(await readStoredAnalytics(page)).toBe(true);
  expect(contactMutations).toEqual([]);
  expect(errors).toEqual([]);
});

test('fake Sentry transport follows first session acceptance then Close when storage writes throw', async ({ page }) => {
  test.skip(process.env.QA_FAKE_SENTRY !== '1', 'requires the local fake-Sentry QA server mode');

  const acceptedMarker = 'QA_EDGE_SESSION_ACCEPTED_TELEMETRY_EVENT';
  const closedMarker = 'QA_EDGE_ACCEPTED_THEN_CLOSED_TELEMETRY_EVENT';
  const { sentEnvelopes, contactMutations, errors } = await observeFakeTelemetryBoundary(page);
  await blockStorageWrites(page);

  await page.goto('/');
  const banner = page.getByRole('dialog', { name: /we value your privacy/i });
  await expect(banner).toBeVisible({ timeout: 5000 });
  expect(await page.evaluate((key) => localStorage.getItem(key), COOKIE_KEY)).toBeNull();
  await banner.getByRole('button', { name: 'Accept', exact: true }).click();
  await expect(banner).toBeHidden();
  await captureEdgeTelemetry(page, acceptedMarker, { initialize: true });
  await expect.poll(sentEnvelopes).toContain(acceptedMarker);

  await reopenConsentManager(page, banner);
  await banner.getByRole('button', { name: /close cookie consent banner/i }).click();
  await expect(banner).toBeHidden();
  await expectTelemetrySilent(page, sentEnvelopes, closedMarker);

  await reopenConsentManager(page, banner);
  await expectAnalyticsChecked(banner, false);
  expect(await page.evaluate((key) => localStorage.getItem(key), COOKIE_KEY)).toBeNull();
  expect(contactMutations).toEqual([]);
  expect(errors).toEqual([]);
});

test('corrupt localStorage handled gracefully', async ({ page }) => {
  await page.addInitScript(
    (key) => {
      if (window.self === window.top) {
        localStorage.setItem(key, '{invalid json');
      }
    },
    COOKIE_KEY
  );
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.locator('#main-content')).toBeVisible();
  await expect(page.getByRole('button', { name: /Accept/i })).toBeVisible({ timeout: 5000 });
  expect(errors.filter((e) => e.includes('JSON'))).toEqual([]);
});

test('rapid route switching does not crash', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  for (const path of ['/contact', '/legal', '/data-policy', '/', '/contact']) {
    await page.goto(path);
  }
  expect(errors).toEqual([]);
});

test('fetch instrumentation supports URL objects', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  const status = await page.evaluate(async () => {
    const response = await fetch(new URL('/robots.txt', window.location.href));
    return response.status;
  });
  expect(status).toBe(200);
  expect(errors).toEqual([]);
});

test('fetch instrumentation delegates malformed arguments to native fetch', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');

  const result = await page.evaluate(async () => {
    const malformed = {
      toString() {
        throw new Error('malformed fetch input');
      },
    };

    const calls = [() => fetch(), () => fetch(undefined), () => fetch(null), () => fetch(malformed)];
    const consoleErrors = [];
    const originalConsoleError = console.error;
    console.error = (...args) => {
      consoleErrors.push(args.map((arg) => (arg instanceof Error ? arg.message : String(arg))).join(' '));
    };

    try {
      const outcomes = await Promise.all(
        calls.map(async (call) => {
          try {
            await call();
            return 'resolved';
          } catch (error) {
            return error instanceof Error ? error.name : typeof error;
          }
        })
      );
      return { consoleErrors, outcomes };
    } finally {
      console.error = originalConsoleError;
    }
  });

  expect(result.outcomes).toHaveLength(4);
  expect(result.consoleErrors).toEqual([]);
  expect(errors).toEqual([]);
});

test('legal pages are scrollable to footer', async ({ page }) => {
  await page.goto('/legal');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(page.getByRole('contentinfo')).toBeVisible();
});
