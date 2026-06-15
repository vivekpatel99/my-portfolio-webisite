import { expect, test } from '@playwright/test';
import path from 'path';

const pages = ['/', '/contact', '/legal', '/data-policy'];

for (const pagePath of pages) {
  for (const [label, width] of [
    ['390', 390],
    ['1280', 1280],
  ]) {
    test(`screenshot ${pagePath} at ${label}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(pagePath);
      await page.waitForTimeout(2000);
      const safeName = pagePath.replace(/\//g, 'home') || 'home';
      await page.screenshot({
        path: path.join('playwright-output', `qa-${safeName === 'home' ? 'home' : safeName.slice(1)}-${label}.png`),
        fullPage: false,
      });
    });
  }
}

test('custom cursor mounts on desktop fine pointer', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await page.mouse.move(400, 400);
  await expect(page.locator('html')).toHaveClass(/custom-cursor-enabled/);
});

test('cookie customize panel expands', async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('cookie_consent_preferences'));
  await page.goto('/');
  await page.getByRole('button', { name: /Customize/i }).click({ timeout: 5000 });
  await expect(page.getByText(/analytics|essential/i).first()).toBeVisible();
});

test('stats ticker preserves decimal values', async ({ page }) => {
  await page.goto('/project/social-media-app');
  await page.waitForTimeout(1500);
  const statTexts = await page.locator('[class*="text-"]').filter({ hasText: /\d/ }).allTextContents();
  const hasDecimal = statTexts.some((t) => /4\.9|99\.9/.test(t));
  expect(hasDecimal).toBe(true);
});

test('tech stack marquee section visible', async ({ page }) => {
  await page.goto('/');
  await page.locator('#tech-stack, [class*="TechStack"], section').first();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
  await expect(page.getByText(/tech stack|technologies|stack/i).first()).toBeVisible({ timeout: 5000 });
});
