import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { routeSeo } from '../../src/lib/seoConfig.js';

const routes = [...Object.keys(routeSeo), '/missing-page/'];
const axeSource = fs.readFileSync(process.env.QA_FOOTER_AXE_PATH, 'utf8');

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('cookie_consent_preferences', JSON.stringify({ necessary: true, analytics: false }));
  });
});

test('footer targets meet size, spacing and layout requirements on every route', async ({ page }, testInfo) => {
  const results = [];
  for (const route of routes) {
    await page.goto(route);
    const footer = page.locator('#site-footer');
    await expect(footer, route).toBeVisible();
    await footer.scrollIntoViewIfNeeded();
    await page.addScriptTag({ content: axeSource });
    const result = await page.evaluate(async () => {
      const footer = document.querySelector('#site-footer');
      const controls = [...footer.querySelectorAll('a,button')].map(element => {
        const rect = element.getBoundingClientRect();
        return { name: element.textContent, width: rect.width, height: rect.height, top: rect.top };
      });
      const audit = await window.axe.run('#site-footer', { runOnly: { type: 'rule', values: ['target-size'] } });
      return {
        controls,
        overflow: document.documentElement.scrollWidth > innerWidth,
        violations: audit.violations,
        incomplete: audit.incomplete,
        axeVersion: window.axe.version,
      };
    });
    results.push({ route, ...result });
    expect(result.controls, route).toHaveLength(10);
    for (const control of result.controls) {
      expect(control.height, `${route}: ${control.name}`).toBeGreaterThanOrEqual(24);
      expect(control.width, `${route}: ${control.name}`).toBeGreaterThanOrEqual(24);
    }
    expect(result.violations, route).toEqual([]);
    expect(result.incomplete, route).toEqual([]);
    expect(result.overflow, route).toBe(false);
    if (page.viewportSize().width === 1440) {
      expect(new Set(result.controls.slice(0, 7).map(control => control.top)).size, route).toBe(1);
      expect(new Set(result.controls.slice(7).map(control => control.top)).size, route).toBe(1);
    }
  }
  fs.writeFileSync(path.join(process.env.QA_FOOTER_OUTPUT_DIR, `${testInfo.project.name}.json`), JSON.stringify(results, null, 2));
});

test('footer keyboard order, policy navigation and consent settings remain usable', async ({ page, browserName }, testInfo) => {
  await page.goto('/contact/');
  const footer = page.locator('#site-footer');
  await footer.scrollIntoViewIfNeeded();
  await footer.getByRole('link', { name: 'Privacy Policy', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/legal\/$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Privacy Policy' })).toBeVisible();
  await footer.getByRole('link', { name: 'Cookie Policy', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/data-policy\/$/);
  await footer.getByRole('link', { name: 'Home', exact: true }).focus();
  const controls = footer.locator('a,button');
  for (let index = 0; index < 10; index += 1) {
    await expect(controls.nth(index)).toBeFocused();
    await expect(controls.nth(index)).not.toHaveCSS('outline-style', 'none');
    await expect(controls.nth(index)).not.toHaveCSS('outline-width', '0px');
    if (index < 9) await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
  }
  await footer.screenshot({ path: path.join(process.env.QA_FOOTER_OUTPUT_DIR, `${testInfo.project.name}.png`) });
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: 'We value your privacy' })).toBeVisible();
});
