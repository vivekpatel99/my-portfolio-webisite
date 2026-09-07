import { expect, test } from '@playwright/test';
import path from 'path';

const pages = ['/', '/contact', '/legal', '/data-policy'];
const artifactDir = path.join(process.cwd(), 'playwright-output');

const routeSlug = (pagePath) =>
  pagePath === '/'
    ? 'home'
    : pagePath
        .replace(/^\/+/, '')
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/^-|-$/g, '');

const pngDimensions = (pngBuffer) => ({
  width: pngBuffer.readUInt32BE(16),
  height: pngBuffer.readUInt32BE(20),
});

for (const pagePath of pages) {
  for (const [label, width] of [
    ['390', 390],
    ['1280', 1280],
  ]) {
    test(`screenshot ${pagePath} at ${label}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(pagePath);
      await expect(page.locator('body')).toBeVisible();

      const screenshot = await page.screenshot({
        path: path.join(artifactDir, `qa-${routeSlug(pagePath)}-${label}.png`),
        fullPage: false,
      });
      const dimensions = pngDimensions(screenshot);
      const devicePixelRatio = await page.evaluate(() => window.devicePixelRatio);

      expect(screenshot.byteLength).toBeGreaterThan(1_000);
      expect(dimensions).toEqual({
        width: Math.round(width * devicePixelRatio),
        height: Math.round(844 * devicePixelRatio),
      });
    });
  }
}

test('custom cursor mounts on desktop fine pointer', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes('mobile'), 'Desktop fine pointer assertion is covered by the desktop project.');
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await page.mouse.move(400, 400);
  await expect(page.locator('html')).toHaveClass(/custom-cursor-enabled/);
});

test('cookie customize panel expands', async ({ page }) => {
  await page.addInitScript(() => {
    if (window.self === window.top) {
      localStorage.removeItem('cookie_consent_preferences');
    }
  });
  await page.goto('/');
  await page.getByRole('button', { name: /Customize/i }).click({ timeout: 5000 });
  await expect(page.getByLabel(/Analytics and Diagnostics Cookies/i)).toBeVisible();
});

test('stats ticker preserves decimal values', async ({ page }) => {
  await page.goto('/project/yolo-computer-vision-optimization');
  const statsSection = page.locator('#stats-section');
  await statsSection.scrollIntoViewIfNeeded();
  await expect(statsSection).toContainText(/2\.5/, { timeout: 5000 });
});
