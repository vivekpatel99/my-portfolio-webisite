import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from './qa-test.js';
import { routeSeo } from '../../src/lib/seoConfig.js';

const consentKey = 'cookie_consent_preferences';
const selectors = ['header', '#main-content h1', '#main-content', '#site-footer', '.case-gallery-stage', '.case-gallery-open img', 'form[data-sensitive-telemetry]'];

for (const reducedMotion of ['no-preference', 'reduce']) {
  test.describe(reducedMotion, () => {
    test.use({ reducedMotion });
    test('all route entrances remain visible without strict errors', async ({ page }, testInfo) => {
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      await page.addInitScript(key => localStorage.setItem(key, JSON.stringify({ necessary: true, analytics: false })), consentKey);
      const records = [];
      for (const route of [...Object.keys(routeSeo), '/not-a-route/']) {
        await page.goto(route, { timeout: 15_000 });
        await expect(page.locator('#main-content h1')).toBeVisible();
        await page.waitForFunction(() => [...document.querySelectorAll('#main-content img')].every(img => img.getAttribute('loading') === 'lazy' || img.complete));
        await page.evaluate(async () => { await document.fonts.ready; });
        // Settle the retained 0.5s entrance before comparing geometry.
        await page.waitForTimeout(700);
        const geometry = await page.evaluate(targets => ({
          overflow: document.documentElement.scrollWidth > window.innerWidth,
          elements: targets.flatMap(selector => [...document.querySelectorAll(selector)].map(element => ({
            selector, rect: element.getBoundingClientRect().toJSON(),
            opacity: getComputedStyle(element).opacity,
            src: element.getAttribute('src'),
          }))),
          brokenImages: [...document.querySelectorAll('#main-content img')].filter(img => img.complete && !img.naturalWidth).map(img => img.src),
        }), selectors);
        expect(geometry.overflow, route).toBe(false);
        expect(geometry.brokenImages, route).toEqual([]);
        expect(Number(geometry.elements.find(item => item.selector === '#main-content')?.opacity), route).toBe(1);
        records.push({ route, ...geometry });
      }
      expect(errors).toEqual([]);
      writeFileSync(path.join(process.env.QA_ENTRY_OUTPUT_DIR, `${testInfo.project.name}-${reducedMotion}-geometry.json`), JSON.stringify(records, null, 2));
    });

    test('consent, contact and gallery remain keyboard usable', async ({ page }) => {
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto('/contact/');
      const consent = page.getByRole('dialog', { name: 'We value your privacy' });
      await expect(consent).toBeVisible();
      await consent.getByRole('button', { name: 'Options', exact: true }).focus();
      await page.keyboard.press('Enter');
      await expect(consent.getByRole('checkbox', { name: /analytics/i })).toBeVisible();
      await consent.getByRole('button', { name: /Reject|Save Preferences/ }).first().focus();
      await page.keyboard.press('Enter');
      await expect(consent).toBeHidden();
      const submit = page.locator('form[data-sensitive-telemetry] button[type="submit"]');
      await submit.focus();
      await page.keyboard.press('Enter');
      await expect(page.getByRole('alert').first()).toBeVisible();
      await page.goto('/project/ai-invoice-processing-automation/');
      const opener = page.locator('.case-gallery-open').first();
      await opener.focus();
      await page.keyboard.press('Enter');
      const gallery = page.getByRole('dialog', { name: 'Enlarged case study images' });
      await expect(gallery).toBeVisible();
      await expect.poll(() => gallery.locator('img').evaluateAll(images =>
        images.every(image => image.complete && image.naturalWidth > 0))).toBe(true);
      await page.keyboard.press('Escape');
      await expect(gallery).toBeHidden();
      await expect(opener).toBeFocused();
      expect(errors).toEqual([]);
    });
  });
}
