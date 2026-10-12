import { test, expect } from './qa-test.js';
import fs from 'node:fs';
import path from 'node:path';
import { socialLinks } from '../../src/config/links.js';

const profiles = [
  { name: 'LinkedIn profile', url: socialLinks.linkedin },
  { name: 'GitHub profile', url: socialLinks.github },
];

test('contact social anchors provide 44px targets, visible focus and native links', async ({ page, context, browserName }, testInfo) => {
  await page.addInitScript(() => {
    localStorage.setItem('cookie_consent_preferences', JSON.stringify({ necessary: true, analytics: false }));
  });
  await page.goto('/contact/');
  const linkedin = page.getByRole('link', { name: profiles[0].name, exact: true });
  await linkedin.scrollIntoViewIfNeeded();
  const row = linkedin.locator('..');
  const measurements = await row.evaluate(element => ({
    viewport: { width: innerWidth, height: innerHeight },
    scrollWidth: document.documentElement.scrollWidth,
    anchors: [...element.querySelectorAll('a')].map(anchor => {
      const bounds = anchor.getBoundingClientRect();
      const icon = anchor.querySelector('svg').getBoundingClientRect();
      return {
        name: anchor.getAttribute('aria-label'),
        x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height,
        right: bounds.right, bottom: bounds.bottom,
        iconWidth: icon.width, iconHeight: icon.height,
        cornersHitAnchor: [[1, 1], [bounds.width - 1, 1], [1, bounds.height - 1], [bounds.width - 1, bounds.height - 1]]
          .every(([x, y]) => document.elementFromPoint(bounds.x + x, bounds.y + y)?.closest('a') === anchor),
      };
    }),
  }));
  const phase = process.env.QA_CONTACT_SOCIAL_CAPTURE_PHASE;
  const outputDir = process.env.QA_CONTACT_SOCIAL_OUTPUT_DIR;
  if (phase) {
    fs.writeFileSync(path.join(outputDir, `${phase}-${testInfo.project.name}.json`), JSON.stringify(measurements, null, 2));
    await page.screenshot({ path: path.join(outputDir, `${phase}-${testInfo.project.name}.png`) });
  }
  expect(measurements.viewport).toEqual(testInfo.project.use.viewport);
  expect(measurements.scrollWidth).toBeLessThanOrEqual(measurements.viewport.width);
  expect(measurements.anchors).toHaveLength(2);
  expect(measurements.anchors[0].right).toBeLessThanOrEqual(measurements.anchors[1].x);
  for (const bounds of measurements.anchors) {
    expect(bounds.width, bounds.name).toBeGreaterThanOrEqual(44);
    expect(bounds.height, bounds.name).toBeGreaterThanOrEqual(44);
    expect(bounds.iconWidth).toBe(24);
    expect(bounds.iconHeight).toBe(24);
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.right).toBeLessThanOrEqual(measurements.viewport.width);
    expect(bounds.y).toBeGreaterThanOrEqual(0);
    expect(bounds.bottom).toBeLessThanOrEqual(measurements.viewport.height);
    expect(bounds.cornersHitAnchor).toBe(true);
  }
  await page.getByRole('link', { name: 'Connect with Vivek Patel on Email', exact: true }).focus();
  const tabKey = browserName === 'webkit' ? 'Alt+Tab' : 'Tab';
  for (const profile of profiles) {
    const anchor = page.getByRole('link', { name: profile.name, exact: true });
    await page.keyboard.press(tabKey);
    await expect(anchor).toBeFocused();
    await expect(anchor).toHaveAttribute('href', profile.url);
    await expect(anchor).toHaveAttribute('target', '_blank');
    await expect(anchor).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(anchor).not.toHaveCSS('outline-style', 'none');
    expect(await anchor.evaluate(element => parseFloat(getComputedStyle(element).outlineWidth))).toBeGreaterThanOrEqual(2);
    if (phase) await page.screenshot({ path: path.join(outputDir, `${phase}-focus-${profile.name.split(' ')[0]}-${testInfo.project.name}.png`) });
  }
  for (const profile of profiles) {
    await context.route(profile.url, route => route.fulfill({ contentType: 'text/html', body: '<title>Synthetic profile destination</title>' }));
    const anchor = page.getByRole('link', { name: profile.name, exact: true });
    const popupPromise = context.waitForEvent('page');
    await anchor.click({ position: { x: 2, y: 2 } });
    const popup = await popupPromise;
    await expect(popup).toHaveURL(profile.url);
    await popup.waitForLoadState();
    expect(await popup.evaluate(() => window.opener === null)).toBe(true);
    await expect(page).toHaveURL(/\/contact\/$/);
    await popup.close();
  }
});
