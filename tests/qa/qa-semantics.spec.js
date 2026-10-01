import fs from 'node:fs/promises';
import path from 'node:path';
import { test, expect } from './qa-test.js';

const rules = ['heading-order', 'landmark-complementary-is-top-level', 'definition-list'];
const phase = process.env.QA_SEMANTICS_CAPTURE_PHASE || 'after';
const outputDir = process.env.QA_SEMANTICS_OUTPUT_DIR;
const chipTexts = ['engineer · 0.99', 'ID 001 · TRACKED', 'REC'];

for (const route of ['/', '/case-studies/', '/contact/']) {
  test(`semantic accessibility ${route}`, async ({ page }, testInfo) => {
    if (!process.env.QA_AXE_PATH) throw new Error('Set QA_AXE_PATH to a local axe-core 4.10.3 axe.min.js file.');
    await page.addInitScript(() => {
      localStorage.setItem('cookie_consent_preferences', JSON.stringify({ necessary: true, analytics: false }));
      let seed = 259;
      Math.random = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
      };
    });
    await page.goto(route);
    await expect(page.locator('h1')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await page.addScriptTag({ path: process.env.QA_AXE_PATH });
    const audit = () => page.evaluate(async (ruleIds) => {
      const result = await window.axe.run(document, { runOnly: { type: 'rule', values: ruleIds } });
      return {
        violations: result.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(({ target }) => target) })),
        incomplete: result.incomplete.map(({ id }) => id),
      };
    }, rules);
    const closed = await audit();
    const logo = page.locator('header a[href="/"]').first();
    const logoName = await logo.getAttribute('aria-label');
    await logo.focus();
    await expect(logo).toBeFocused();
    const focus = await logo.evaluate((element) => {
      const style = getComputedStyle(element);
      return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth };
    });
    const chips = route === '/' ? await Promise.all(chipTexts.map(async (text) => {
      const element = page.getByText(text, { exact: true });
      return { text, hidden: await element.getAttribute('aria-hidden') };
    })) : [];
    const accessibility = await page.locator('body').ariaSnapshot();
    if (phase === 'after') {
      expect(closed.violations).toEqual([]);
      expect(closed.incomplete).toEqual([]);
      expect(logoName).toMatch(/home/i);
      for (const { text, hidden } of chips) {
        expect(hidden).toBe('true');
        expect(accessibility).not.toContain(text);
      }
    }
    await page.getByRole('button', { name: 'Manage Consent', exact: true }).focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'We value your privacy' });
    await expect(dialog).toBeVisible();
    const open = await audit();
    if (phase === 'after') {
      expect(open.violations).toEqual([]);
      expect(open.incomplete).toEqual([]);
    }
    await dialog.getByRole('button', { name: 'Reject', exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Manage Consent', exact: true })).toBeFocused();
    let drawerName = null;
    if (testInfo.project.use.viewport.width === 390) {
      await page.getByRole('button', { name: 'Toggle navigation menu' }).focus();
      await page.keyboard.press('Enter');
      const drawer = page.getByRole('dialog', { name: 'Navigation menu' });
      await expect(drawer).toBeVisible();
      drawerName = await drawer.locator('a[href="/"]').getAttribute('aria-label');
      if (phase === 'after') expect(drawerName).toMatch(/home/i);
      await page.keyboard.press('Escape');
      await expect(drawer).toHaveCount(0);
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addStyleTag({ content: '* { animation: none !important; transition: none !important; }' });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(5500);
    const selectors = route === '/' ? ['section[data-hero-motion]', '#services', '#portfolio']
      : route === '/case-studies/' ? ['#case-studies-heading', 'article.card'] : ['h1', '.aside'];
    const geometry = await page.evaluate((targets) => ({
      overflow: document.documentElement.scrollWidth > innerWidth,
      elements: targets.flatMap((selector) => [...document.querySelectorAll(selector)].map((element) => {
        const { x, y, width, height } = element.getBoundingClientRect();
        return { selector, x, y, width, height, text: element.textContent.trim() };
      })),
    }), selectors);
    expect(geometry.overflow).toBe(false);
    const key = `${testInfo.project.name}-${route === '/' ? 'home' : route.split('/')[1]}`;
    const directory = path.join(outputDir, phase);
    await fs.mkdir(directory, { recursive: true });
    const shotTargets = route === '/' ? ['section[data-hero-motion]', '#services', '#portfolio']
      : route === '/case-studies/' ? ['article.card >> nth=0'] : ['.aside'];
    const captureStyle = await page.addStyleTag({ content: 'header { visibility: hidden !important; }' });
    for (let index = 0; index < shotTargets.length; index += 1) {
      const target = page.locator(shotTargets[index]);
      await target.scrollIntoViewIfNeeded();
      await target.locator('img').evaluateAll((images) => Promise.all(images.map((image) => image.decode())));
      await expect(target).toHaveCSS('opacity', '1');
      await expect.poll(() => target.evaluate((element) => {
        const animator = element.closest('[data-section-animator]');
        if (!animator) return 0;
        const transform = getComputedStyle(animator).transform;
        return transform === 'none' ? 0 : new DOMMatrixReadOnly(transform).m42;
      })).toBe(0);
      await target.screenshot({ path: path.join(directory, `${key}-${index}.png`), animations: 'disabled' });
    }
    await captureStyle.evaluate((element) => element.remove());
    await fs.writeFile(path.join(directory, `${key}.json`), JSON.stringify({ route, project: testInfo.project.name, closed, open, logoName, drawerName, chips, focus, geometry }, null, 2));
    if (phase === 'after') {
      await logo.focus();
      await page.keyboard.press('Enter');
      await expect.poll(() => {
        try { return new URL(page.url()).pathname; } catch { return ''; }
      }).toBe('/');
      await expect(page.locator('section[data-hero-motion]')).toBeVisible();
      await page.waitForLoadState('networkidle');
      if (testInfo.project.use.viewport.width === 390) {
        await page.goto(route);
        await page.getByRole('button', { name: 'Toggle navigation menu' }).focus();
        await page.keyboard.press('Enter');
        const drawer = page.getByRole('dialog', { name: 'Navigation menu' });
        const drawerHome = drawer.getByRole('link', { name: /home/i, exact: false }).first();
        await drawerHome.focus();
        await page.keyboard.press('Enter');
        await expect.poll(() => {
          try { return new URL(page.url()).pathname; } catch { return ''; }
        }).toBe('/');
        await expect(drawer).toHaveCount(0);
        await expect(page.locator('section[data-hero-motion]')).toBeVisible();
        await page.waitForLoadState('networkidle');
      }
    }
  });
}
