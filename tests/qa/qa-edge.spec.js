import { expect, test } from '@playwright/test';

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
  await expect(page.getByRole('button', { name: /Accept All/i })).toBeHidden();
  await expect(page.getByRole('button', { name: /Accept All/i })).toBeVisible({ timeout: 5000 });
});

test('accept all persists consent in localStorage', async ({ page }) => {
  await page.goto('/');
  const acceptAll = page.getByRole('button', { name: /Accept All/i });
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
  await page.getByRole('button', { name: /Reject All/i }).click({ timeout: 5000 });
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
  await page.getByRole('button', { name: /Reject All/i }).click({ timeout: 5000 });
  await page.waitForTimeout(1000);
  expect(telemetryRequests).toEqual([]);
});

test('manage consent reopens banner from footer', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Accept All/i }).click({ timeout: 5000 });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.getByRole('link', { name: /Manage Consent/i }).click();
  await expect(page.getByRole('button', { name: /Accept All/i })).toBeVisible();
});

test.skip('TODO: accepting analytics consent should load Google Analytics when a measurement ID is configured', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Accept All/i }).click({ timeout: 5000 });
  const gtagLoaded = await page.evaluate(() => typeof window.gtag !== 'undefined');
  expect(gtagLoaded).toBe(true);
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
  await expect(page.getByRole('button', { name: /Accept All/i })).toBeVisible({ timeout: 5000 });
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
