import { expect, test } from '@playwright/test';
import path from 'path';
import { mkdirSync } from 'fs';

const pages = ['/', '/contact', '/legal', '/data-policy'];
const artifactDir = process.env.QA_SCREENSHOT_DIR ?? path.join(process.cwd(), 'playwright-output');
mkdirSync(artifactDir, { recursive: true });

const readiness = {
  '/': /Vivek Patel/i,
  '/contact': /Request a Project Estimate/i,
  '/legal': /Privacy Policy/i,
  '/data-policy': /Cookie Policy/i,
};

const isSettled = (heading) => {
  for (let node = heading; node && node.tagName !== 'BODY'; node = node.parentElement) {
    if (Number.parseFloat(getComputedStyle(node).opacity) < 0.99) return false;
  }
  return true;
};

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
      const heading = page.getByRole('heading', { level: 1, name: readiness[pagePath] });
      await expect(heading).toBeVisible();
      await expect(page.locator('main')).toBeVisible();
      await expect.poll(() => heading.evaluate(isSettled)).toBe(true);

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

test('pose case shows its evidence scope instead of an unsupported metric grid', async ({ page }) => {
  await page.goto('/project/yolo-computer-vision-optimization');
  await expect(page.getByRole('heading', { name: /evidence scope & limitations/i })).toBeVisible();
  await expect(page.getByText(/Pose overlays are generated on still images/i)).toBeVisible();
  await expect(page.locator('#stats-section')).toHaveCount(0);
});

test('n8n schematics keep every step inside their card and detail containers', async ({ page }) => {
  for (const [pathSuffix, selector] of [
    ['/', '#portfolio figure'],
    ['/project/n8n-openai-data-extraction', 'figure'],
  ]) {
    for (const width of [390, 1280]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(pathSuffix);
      const schematic = page.locator(selector).filter({ hasText: 'handoff' }).first();
      await expect(schematic).toBeVisible();
      await expect(schematic).toContainText('handoff');
      expect(await schematic.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
    }
  }
});

test('portfolio case labels stay below the n8n process schematic', async ({ page }) => {
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    const card = page.locator('article').filter({ has: page.getByRole('link', { name: /Read case study: Document & Web Data Extraction/i }) });
    const schematic = card.locator('figure');
    const title = card.getByRole('heading', { name: /Document & Web Data Extraction/i });
    await expect(schematic).toBeVisible();
    await expect(title).toBeVisible();
    const [schematicBox, titleBox] = await Promise.all([schematic.boundingBox(), title.boundingBox()]);
    expect(schematicBox?.y + schematicBox?.height).toBeLessThanOrEqual(titleBox?.y ?? 0);
  }
});
