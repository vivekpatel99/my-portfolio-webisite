import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, expect, test } from './qa-test.js';
import { guardLocalNavigation, guardLocalWebSocket } from './qa-navigation-guard.js';

const routes = ['/', '/services/data-extraction-automation-sprint/', '/project/ai-invoice-processing-automation/', '/contact/', '/case-studies/'];
// Transformed ancestor bounds can report a few millionths below the 44px CSS size.
const minimumTarget = 44 - 0.01;

test.beforeEach(async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: testInfo.project.use.reducedMotion });
  await page.addInitScript(() => {
    localStorage.setItem('cookie_consent_preferences', JSON.stringify({ necessary: true, analytics: false }));
  });
});

test.afterEach(async ({ context }) => {
  await context.unrouteAll({ behavior: 'wait' });
});

async function inspectActions(page) {
  await expect(page.locator('h1')).toBeVisible();
  const actions = page.locator('.detection-action:visible');
  expect(await actions.count()).toBeGreaterThan(0);
  for (const action of await actions.all()) {
    await action.scrollIntoViewIfNeeded();
    const measured = await action.evaluate((element) => {
      const style = getComputedStyle(element);
      const box = element.getBoundingClientRect();
      const range = document.createRange();
      range.selectNodeContents(element.querySelector('.action-label') || element);
      const textBoxes = [...range.getClientRects()].filter((rect) => rect.width && rect.height);
      return {
        width: box.width, height: box.height,
        left: box.left, right: box.right, viewport: innerWidth,
        family: style.fontFamily, weight: style.fontWeight, radius: style.borderRadius,
        border: style.borderTopWidth, casing: style.textTransform,
        labelFits: textBoxes.every((rect) => rect.left >= box.left - 1 && rect.right <= box.right + 1),
      };
    });
    expect(measured.width).toBeGreaterThanOrEqual(minimumTarget);
    expect(measured.height).toBeGreaterThanOrEqual(minimumTarget);
    expect(measured.left).toBeGreaterThanOrEqual(-1);
    expect(measured.right).toBeLessThanOrEqual(measured.viewport + 1);
    expect(measured.labelFits).toBe(true);
    expect(measured.radius).toBe('0px');
    expect(measured.border).toBe('0px');
    expect(measured.casing).toBe('none');
    expect(measured.family).not.toMatch(/monospace/);
    expect(measured.weight).toBe(await action.evaluate((e) => e.classList.contains('detection-action--primary') ? '650' : '600'));
    const label = action.locator(':scope > .detection-label');
    await expect(label).toHaveCount(1);
    await expect(label).toHaveAttribute('aria-hidden', 'true');
    const edge = await label.evaluate((element) => {
      const box = element.getBoundingClientRect();
      const parent = element.parentElement.getBoundingClientRect();
      const text = document.createRange();
      text.selectNodeContents(element);
      const rect = text.getBoundingClientRect();
      return {
        center: box.top + box.height / 2, top: parent.top,
        left: rect.left - parent.left, right: parent.right - rect.right,
        background: getComputedStyle(element).backgroundColor,
        oneLine: text.getClientRects().length === 1,
      };
    });
    expect(edge.center).toBeCloseTo(edge.top, 1);
    expect(edge.left).toBeGreaterThanOrEqual(28);
    expect(edge.right).toBeGreaterThanOrEqual(5);
    expect(edge.background).toBe('rgba(0, 0, 0, 0)');
    expect(edge.oneLine).toBe(true);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

test('prominent actions share geometry and typography with safe labels on every surface', async ({ page }, testInfo) => {
  for (const route of routes) {
    await page.goto(route);
    await inspectActions(page);
    if (route === '/') {
      const pair = page.locator('[data-hero-motion] .detection-action');
      const boxes = await pair.evaluateAll((elements) => elements.map((e) => {
        const r = e.getBoundingClientRect();
        return { width: r.width, height: r.height, top: r.top, bottom: r.bottom };
      }));
      if (page.viewportSize().width < 768) {
        expect(boxes[0].width).toBeCloseTo(boxes[1].width, 1);
        expect(boxes[1].top - boxes[0].bottom).toBeGreaterThanOrEqual(12);
      } else {
        expect(boxes[0].height).toBeCloseTo(boxes[1].height, 1);
      }
    }
  }
  testInfo.annotations.push({ type: 'viewport', description: JSON.stringify(await page.evaluate(() => ({ width: innerWidth, height: innerHeight }))) });
});

test('hover, keyboard focus, pressed and exhausted states remain distinct', async ({ page }) => {
  await page.goto('/');
  const estimate = page.locator('[data-hero-motion] .detection-action--primary');
  await estimate.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  const resting = await estimate.evaluate((e) => getComputedStyle(e).backgroundImage);
  await estimate.hover();
  const hovered = await estimate.evaluate((e) => getComputedStyle(e).backgroundImage);
  expect(hovered).not.toBe(resting);
  await page.mouse.move(0, 0);
  await page.keyboard.press('Tab');
  await estimate.focus();
  await expect(estimate).toHaveCSS('outline-width', '2px');
  expect(await estimate.evaluate((e) => getComputedStyle(e).backgroundImage)).toBe(hovered);
  const background = await estimate.evaluate((e) => getComputedStyle(e).backgroundColor);
  await estimate.hover();
  await page.mouse.down();
  expect(await estimate.evaluate((e) => getComputedStyle(e).backgroundColor)).not.toBe(background);
  await page.mouse.move(0, 0);
  await page.mouse.up();

  await page.goto('/case-studies/');
  const more = page.locator('button.detection-action[aria-controls]');
  await more.click();
  await expect(page.getByRole('status')).toContainText('Showing 12 of 12');
  await expect(more).toHaveAttribute('aria-disabled', 'true');
  await expect(more).toHaveAccessibleName('All case studies shown');
  await expect(more.locator('.detection-label')).toHaveText('ALL WORK SHOWN');
  const disabled = await more.evaluate((e) => ({ background: getComputedStyle(e).backgroundImage, corner: getComputedStyle(e, '::before').backgroundImage }));
  await more.hover();
  await page.keyboard.press('Tab');
  await more.focus();
  await expect(more).toHaveCSS('outline-width', '2px');
  expect(await more.evaluate((e) => ({ background: getComputedStyle(e).backgroundImage, corner: getComputedStyle(e, '::before').backgroundImage }))).toEqual(disabled);
  await more.press('Enter');
  await expect(page.getByRole('status')).toContainText('Showing 12 of 12');
});

test('text actions and utilities retain accessible targets, focus, selection and modal behavior', async ({ page }) => {
  await page.goto('/');
  for (const link of await page.locator('.detection-text-action:visible, .detection-utility:visible').all()) {
    const box = await link.boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(minimumTarget);
    expect(box.height).toBeGreaterThanOrEqual(minimumTarget);
  }
  const secondSlide = page.getByRole('button', { name: 'Slide 2', exact: true });
  await secondSlide.scrollIntoViewIfNeeded();
  await page.keyboard.press('Tab');
  await secondSlide.focus();
  await expect(secondSlide).toHaveCSS('outline-width', '2px');
  await secondSlide.press('Enter');
  await expect(secondSlide).toHaveAttribute('aria-current', 'true');
  if (page.viewportSize().width < 768) {
    await page.getByRole('button', { name: 'Toggle navigation menu' }).tap();
    const drawer = page.getByRole('dialog', { name: 'Navigation menu' });
    await expect(drawer).toBeVisible();
    const estimate = drawer.getByRole('link', { name: 'Request a Project Estimate' });
    await expect(estimate).toHaveAttribute('href', '/contact/');
    await expect(estimate.locator('.detection-label')).toHaveText('Inquiry');
    await page.keyboard.press('Tab');
    await estimate.focus();
    expect(await estimate.evaluate((e) => parseFloat(getComputedStyle(e).outlineWidth))).toBeGreaterThanOrEqual(2);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Toggle navigation menu' })).toBeFocused();
  }
  await page.getByRole('button', { name: 'Manage Consent' }).click();
  const consent = page.getByRole('dialog', { name: 'We value your privacy' });
  await expect(consent).toBeVisible();
  for (const control of await consent.getByRole('button').all()) {
    const box = await control.boundingBox();
    if (!box) continue;
    expect(box.width).toBeGreaterThanOrEqual(minimumTarget);
    expect(box.height).toBeGreaterThanOrEqual(minimumTarget);
  }
  await consent.getByRole('button', { name: 'Options' }).click();
  const analytics = consent.getByRole('checkbox', { name: 'Analytics' });
  await expect(analytics).toBeVisible();
  const checkboxBox = await analytics.boundingBox();
  expect(checkboxBox.width).toBeGreaterThanOrEqual(minimumTarget);
  expect(checkboxBox.height).toBeGreaterThanOrEqual(minimumTarget);
  await expect(analytics).not.toBeChecked();
  await analytics.click();
  await expect(analytics).toBeChecked();
  await analytics.click();
  await expect(analytics).not.toBeChecked();
  await consent.getByRole('button', { name: 'Reject', exact: true }).click();
  await expect(consent).toHaveCount(0);

  await page.goto('/project/ai-invoice-processing-automation/');
  await page.getByRole('button', { name: /Enlarge image:/ }).click();
  const gallery = page.getByRole('dialog');
  await expect(gallery).toBeVisible();
  for (const button of await gallery.getByRole('button').all()) {
    const box = await button.boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(minimumTarget);
    expect(box.height).toBeGreaterThanOrEqual(minimumTarget);
  }
  const zoom = gallery.getByRole('button', { name: 'Zoom out' });
  await expect(zoom).toBeDisabled();
  await page.keyboard.press('Escape');
  await expect(gallery).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Enlarge image:/ })).toBeFocused();
});

test('prominent actions reflow at native Chromium 200% browser zoom', async ({ browserName }, testInfo) => {
  test.skip(browserName !== 'chromium' || testInfo.project.name !== 'chromium-1440-no-preference', 'One real zoom run using the repository MV3 extension.');
  const extension = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'fixtures/browser-zoom-extension');
  const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'qa-action-zoom-'));
  let context;
  try {
    context = await chromium.launchPersistentContext(profile, {
      channel: 'chromium', headless: true, viewport: null, serviceWorkers: 'allow',
      args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`, '--window-size=1440,900'],
    });
    await context.route('**/*', guardLocalNavigation);
    await context.routeWebSocket('**/*', guardLocalWebSocket);
    await context.addInitScript(() => localStorage.setItem('cookie_consent_preferences', JSON.stringify({ necessary: true, analytics: false })));
    const worker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');
    const page = context.pages()[0];
    const baseURL = testInfo.project.use.baseURL;
    await page.goto(baseURL);
    const before = await page.evaluate(() => ({ width: innerWidth, height: innerHeight }));
    await worker.evaluate(async (origin) => {
      const tab = (await chrome.tabs.query({})).find((candidate) => candidate.url?.startsWith(origin));
      await chrome.tabs.setZoom(tab.id, 2);
    }, new URL(baseURL).origin);
    await expect.poll(() => page.evaluate(() => innerWidth)).toBeLessThanOrEqual(before.width / 2 + 2);
    const after = await page.evaluate(() => ({ width: innerWidth, height: innerHeight, scale: visualViewport.scale }));
    expect(after.scale).toBeCloseTo(1, 1);
    testInfo.annotations.push({ type: 'native-200-percent-zoom', description: JSON.stringify({ before, after }) });
    for (const route of routes) {
      await page.goto(new URL(route, baseURL).href);
      await inspectActions(page);
    }
  } finally {
    await context?.close();
    await fs.rm(profile, { recursive: true, force: true });
  }
});
