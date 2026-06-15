import { expect, test } from '@playwright/test';

const COOKIE_KEY = 'cookie_consent_preferences';

test.beforeEach(async ({ page }) => {
  await page.addInitScript((key) => localStorage.removeItem(key), COOKIE_KEY);
});

test('cookie banner appears after delay on first visit', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText(/cookie|consent|privacy/i).first()).toBeHidden();
  await expect(page.getByRole('button', { name: /Accept All/i })).toBeVisible({ timeout: 5000 });
});

test('accept all persists consent in localStorage', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Accept All/i }).click({ timeout: 5000 });
  const stored = await page.evaluate((key) => localStorage.getItem(key), COOKIE_KEY);
  expect(stored).toBeTruthy();
  const prefs = JSON.parse(stored);
  expect(prefs.analytics).toBe(true);
});

test('reject all persists rejection', async ({ page }) => {
  await page.addInitScript((key) => localStorage.removeItem(key), COOKIE_KEY);
  await page.goto('/');
  await page.getByRole('button', { name: /Reject All/i }).click({ timeout: 5000 });
  const stored = await page.evaluate((key) => localStorage.getItem(key), COOKIE_KEY);
  const prefs = JSON.parse(stored);
  expect(prefs.analytics).toBe(false);
});

test('manage consent reopens banner from footer', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Accept All/i }).click({ timeout: 5000 });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.getByRole('button', { name: /Manage Consent/i }).click();
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
    (key) => localStorage.setItem(key, '{invalid json'),
    COOKIE_KEY
  );
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.locator('#main-content')).toBeVisible();
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

test('legal pages are scrollable to footer', async ({ page }) => {
  await page.goto('/legal');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(page.getByRole('contentinfo')).toBeVisible();
});
