import { expect, test } from '@playwright/test';

const COOKIE_KEY = 'cookie_consent_preferences';

test.beforeEach(async ({ page }) => {
  await page.addInitScript((key) => localStorage.removeItem(key), COOKIE_KEY);
});

test('cookie banner appears after delay', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Accept All' })).toBeVisible({ timeout: 5000 });
});

test('accept all persists analytics consent', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Accept All' }).click({ timeout: 5000 });
  const stored = await page.evaluate((key) => localStorage.getItem(key), COOKIE_KEY);
  expect(JSON.parse(stored).analytics).toBe(true);
  await expect(
    page.locator('script[src*="googletagmanager.com/gtag/js?id=G-7E37RV2DDN"]')
  ).toHaveCount(1);
  await expect.poll(() => page.evaluate(() => typeof window.gtag)).toBe('function');
});

test('reject all persists analytics opt-out without loading GA', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Reject All' }).click({ timeout: 5000 });
  const stored = await page.evaluate((key) => localStorage.getItem(key), COOKIE_KEY);
  expect(JSON.parse(stored).analytics).toBe(false);
  await expect(
    page.locator('script[src*="googletagmanager.com/gtag/js?id=G-7E37RV2DDN"]')
  ).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => typeof window.gtag)).toBe('undefined');
});

test('persisted analytics consent loads GA on next visit', async ({ page }) => {
  await page.addInitScript((key) => {
    localStorage.setItem(key, JSON.stringify({ necessary: true, analytics: true }));
  }, COOKIE_KEY);
  await page.goto('/');
  await expect(
    page.locator('script[src*="googletagmanager.com/gtag/js?id=G-7E37RV2DDN"]')
  ).toHaveCount(1);
  await expect.poll(() => page.evaluate(() => typeof window.gtag)).toBe('function');
});

test('manage consent reopens banner via footer link', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Accept All' }).click({ timeout: 5000 });
  await page.getByRole('contentinfo').getByRole('link', { name: 'Manage Consent' }).click();
  await expect(page.getByRole('button', { name: 'Accept All' })).toBeVisible();
  await expect(page.getByText('Cookie preferences opened.').first()).toBeVisible();
});
