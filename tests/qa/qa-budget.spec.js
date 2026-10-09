import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from './qa-test.js';
import { chooseBudget, expectBudget } from './qa-budget.js';
import { BUDGET_OPTIONS, BUDGET_LABELS } from '../../src/lib/budgetOptions.js';

test.beforeEach(async ({ page, browser }, testInfo) => {
  if (process.env.QA_BUDGET_SCREENSHOT_DIR) {
    fs.mkdirSync(process.env.QA_BUDGET_SCREENSHOT_DIR, { recursive: true });
    fs.writeFileSync(path.join(process.env.QA_BUDGET_SCREENSHOT_DIR, `${testInfo.project.name}-environment.json`), JSON.stringify({ project: testInfo.project.name, browser: browser.version(), viewport: page.viewportSize(), reducedMotion: testInfo.project.use.reducedMotion }, null, 2));
  }
  await page.addInitScript(() => {
    localStorage.setItem('cookie_consent_preferences', JSON.stringify({ necessary: true, analytics: false }));
    window.__budgetSubmitCount = 0;
    document.addEventListener('submit', () => { window.__budgetSubmitCount += 1; }, true);
  });
  await page.goto('/contact/');
  await expect(page.locator('#budget')).toBeVisible();
});

test.afterEach(async ({ page }) => {
  expect(await page.evaluate(() => window.__budgetSubmitCount)).toBe(0);
});

test('shared budget setup uses keyboard without pointer input or form submission', async ({ page }) => {
  await page.evaluate(() => {
    window.__qaBudgetPointerCount = 0;
    document.addEventListener('pointerdown', (event) => {
      if (event.target.closest('#budget, [role="option"]')) window.__qaBudgetPointerCount += 1;
    });
  });
  for (const value of [...BUDGET_OPTIONS, '']) {
    await page.getByLabel('Email Address *').focus();
    await chooseBudget(page, value, { keyboard: true });
    await expect(page.getByRole('listbox')).toHaveCount(0);
    await expect(page.locator('#budget')).toBeFocused();
  }
  expect(await page.evaluate(() => window.__qaBudgetPointerCount)).toBe(0);
});

test('budget dropdown commits exact values with keyboard, restores focus, and permits Tab progression', async ({ page, browserName, hasTouch }) => {
  const trigger = page.locator('#budget');
  const menu = page.getByRole('listbox');
  const tab = browserName === 'webkit' ? 'Alt+Tab' : 'Tab';
  await expect(trigger).toHaveAccessibleName(/Budget Range/);
  await expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expectBudget(page, '');
  await page.getByLabel('Full Name *').fill('Synthetic dropdown QA');
  await page.getByLabel('Email Address *').fill('dropdown@example.invalid');
  await page.getByLabel('Project Description *').fill('Synthetic dropdown opening test.');
  await page.getByLabel('Email Address *').focus();
  await page.keyboard.press(tab);
  await expect(trigger).toBeFocused();
  await trigger.press('Enter');
  await expect(menu).toBeFocused();
  await expect(menu).toHaveAccessibleName(/Budget Range/);
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(menu.getByRole('option')).toHaveText(['Select your budget range', ...BUDGET_OPTIONS.map(value => BUDGET_LABELS[value])]);
  const first = menu.getByRole('option', { name: '< €5,000', exact: true });
  await page.keyboard.press('ArrowDown');
  await expect(first).toHaveAttribute('data-focus', '');
  await expectBudget(page, '');
  await page.keyboard.press('Enter');
  await expect(menu).toHaveCount(0);
  await expectBudget(page, '< €5k');
  await expect(trigger).toBeFocused();

  await trigger.press('ArrowDown');
  await expect(first).toHaveAttribute('aria-selected', 'true');
  await expect(first.locator('svg')).toBeVisible();
  await page.keyboard.press('End');
  await expect(menu.getByRole('option', { name: '€25,000+', exact: true })).toHaveAttribute('data-focus', '');
  await expect(menu).toBeFocused();
  await menu.evaluate(element => {
    const capture = (event) => {
      if (event.key.length !== 1) return;
      element.dataset.qaTypeaheadKey = event.key;
      element.removeEventListener('keydown', capture);
    };
    element.addEventListener('keydown', capture);
  });
  await page.keyboard.press('Shift+Comma');
  await expect(menu).toHaveAttribute('data-qa-typeahead-key', '<');
  await expect(first).toHaveAttribute('data-focus', '');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
  await expectBudget(page, '< €5k');
  await expect(trigger).toBeFocused();

  await trigger.press('Space');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Tab');
  await expect(menu).toHaveCount(0);
  await expect(page.getByLabel('Project Description *')).toBeFocused();
  await expectBudget(page, '< €5k');
  await trigger.focus();
  await trigger.press('Space');
  await page.keyboard.press('Shift+Tab');
  await expect(menu).toHaveCount(0);
  await expect(page.getByLabel('Email Address *')).toBeFocused();

  for (const value of [...BUDGET_OPTIONS, '']) await chooseBudget(page, value, { touch: hasTouch });
  await trigger.press('Enter');
  await expect(menu).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(trigger).toHaveAttribute('aria-invalid', 'false');
});

test('budget menu keeps selected and focused options legible within narrow and scrolling viewports', async ({ page, hasTouch }, testInfo) => {
  const trigger = page.locator('#budget');
  const menu = page.getByRole('listbox');
  await chooseBudget(page, '€5k-€10k', { touch: hasTouch });
  if (hasTouch) await trigger.tap();
  else await trigger.click();
  const selected = menu.getByRole('option', { selected: true });
  await expect(selected).toContainText('€5,000 - €10,000');
  await expect(selected.locator('svg')).toBeVisible();
  await expect(selected).toHaveCSS('background-color', 'rgba(139, 92, 246, 0.2)');
  await expect(selected).toHaveCSS('color', 'rgb(255, 255, 255)');
  await expect(menu).toHaveAttribute('data-sensitive-telemetry', 'true');
  await page.keyboard.press('ArrowDown');
  const focused = menu.locator('[data-focus]');
  await expect(focused).toHaveCSS('outline-style', 'solid');
  await expect(focused).toHaveCSS('outline-width', '1px');
  await expect(focused).toHaveCSS('color', 'rgb(255, 255, 255)');
  await expect(trigger.locator('..')).toHaveCSS('--corner-color', '#a78bfa');

  const box = await menu.boundingBox();
  const viewport = page.viewportSize();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  if (process.env.QA_BUDGET_SCREENSHOT_DIR) {
    fs.mkdirSync(process.env.QA_BUDGET_SCREENSHOT_DIR, { recursive: true });
    await page.screenshot({ path: path.join(process.env.QA_BUDGET_SCREENSHOT_DIR, `${testInfo.project.name}-open.png`) });
  }
  const last = menu.getByRole('option', { name: '€25,000+', exact: true });
  if (hasTouch) await last.tap();
  else await last.click();
  await expectBudget(page, '€25k+');
  await expect(menu).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await page.getByLabel('Project Description *').focus();
  await expect(trigger.locator('..')).toHaveCSS('--corner-color', '#6b7280');

  await page.setViewportSize({ width: viewport.width, height: 300 });
  await trigger.scrollIntoViewIfNeeded();
  if (hasTouch) await trigger.tap();
  else await trigger.click();
  await expect(menu).toBeVisible();
  const constrained = await menu.boundingBox();
  expect(constrained.y).toBeGreaterThanOrEqual(0);
  expect(constrained.y + constrained.height).toBeLessThanOrEqual(300);
  await page.keyboard.press('Home');
  await expect(menu.getByRole('option', { name: 'Select your budget range', exact: true })).toHaveAttribute('data-focus', '');
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await expect.poll(async () => {
    const rect = await menu.boundingBox();
    const button = await trigger.boundingBox();
    return rect.y >= 0 && rect.y + rect.height <= 300
      && button.y >= 0 && button.y + button.height <= 300;
  }).toBe(true);
  await page.keyboard.press('Enter');
  await expectBudget(page, '');
  if (hasTouch) await trigger.tap();
  else await trigger.click();
  if (hasTouch) await page.evaluate(() => window.scrollBy(0, 150));
  else await page.mouse.wheel(0, 150);
  await expect.poll(async () => {
    if (!await menu.count()) return true;
    const rect = await menu.boundingBox();
    return rect.y >= 0 && rect.y + rect.height <= 300;
  }).toBe(true);
  if (await menu.count()) await page.keyboard.press('Escape');
  await trigger.scrollIntoViewIfNeeded();
  if (hasTouch) await trigger.tap();
  else await trigger.click();
  await expect(menu).toBeVisible();
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.evaluate(() => window.scrollBy(0, innerHeight * 4));
  await expect(menu).toHaveCount(0);
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expectBudget(page, '');
  await expect.poll(async () => {
    const rect = await trigger.boundingBox();
    return rect.y + rect.height;
  }).toBeLessThanOrEqual(0);
  await expect(trigger).not.toBeFocused();
});

test('budget retains a checkmark and focus outlines in forced colors and reduced motion', async ({ page, browserName, hasTouch }, testInfo) => {
  test.skip(browserName !== 'chromium', 'WebKit does not emulate forced colors');
  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
  await chooseBudget(page, '€5k-€10k', { touch: hasTouch });
  const trigger = page.locator('#budget');
  await page.getByLabel('Email Address *').focus();
  await expect(trigger.locator('..')).toHaveCSS('outline-width', '1px');
  await trigger.focus();
  await expect(trigger.locator('..')).toHaveCSS('outline-width', '2px');
  await expect(trigger.locator('..')).toHaveCSS('transition-duration', '0s');
  await trigger.press('Space');
  const menu = page.getByRole('listbox');
  await expect(menu).toHaveCSS('border-top-style', 'solid');
  const selected = menu.getByRole('option', { selected: true });
  await expect(selected.locator('svg')).toBeVisible();
  await expect(selected).toHaveCSS('forced-color-adjust', 'none');
  await page.keyboard.press('ArrowDown');
  await expect(menu.locator('[data-focus]')).toHaveCSS('outline-width', '2px');
  const colors = await menu.locator('[data-focus]').evaluate(element => {
    const style = getComputedStyle(element);
    return { foreground: style.color, background: style.backgroundColor };
  });
  expect(colors.foreground).not.toBe(colors.background);
  if (process.env.QA_BUDGET_SCREENSHOT_DIR) {
    await page.screenshot({ path: path.join(process.env.QA_BUDGET_SCREENSHOT_DIR, `${testInfo.project.name}-forced-colors.png`) });
  }
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
});
