import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from './qa-test.js';
import { routeSeo } from '../../src/lib/seoConfig.js';

const before = process.env.QA_COLOR_SCHEME_PHASE === 'before';
const outputDir = process.env.QA_COLOR_SCHEME_OUTPUT_DIR;
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const routes = [...Object.keys(routeSeo), '/404.html', '/qa-missing-page/', '/services/qa-missing-service/', '/project/qa-missing-project/'];

function assertThemeTags(tags, context) {
  expect(tags, context).toEqual(before ? [] : ['#0C0D0D']);
}

async function themeTagsInHtml(page, html) {
  return page.evaluate(rawHtml => [...new DOMParser().parseFromString(rawHtml, 'text/html')
    .querySelectorAll('meta[name="theme-color"]')].map(meta => meta.content), html);
}

test.beforeEach(async ({ page }, testInfo) => {
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches))
    .toBe(testInfo.project.use.contextOptions.reducedMotion === 'reduce');
  await page.addInitScript(() => {
    localStorage.setItem('cookie_consent_preferences', JSON.stringify({ necessary: true, analytics: false }));
  });
});

test('every public and missing route declares the dark scheme in rendered and served HTML', async ({ page }, testInfo) => {
  const observations = [];
  for (const route of routes) {
    const response = await page.goto(route);
    await expect(page.locator('#site-footer'), route).toBeVisible();
    await expect(page.locator('html'), route).toHaveCSS('color-scheme', before ? 'normal' : 'dark');
    const servedTags = await themeTagsInHtml(page, await response.text());
    const renderedTags = await page.locator('meta[name="theme-color"]').evaluateAll(tags => tags.map(tag => tag.content));
    assertThemeTags(servedTags, `${route} served HTML`);
    assertThemeTags(renderedTags, `${route} rendered HTML`);
    observations.push({ route, scheme: await page.locator('html').evaluate(element => getComputedStyle(element).colorScheme), servedTags, renderedTags });
  }
  fs.writeFileSync(path.join(outputDir, `${testInfo.project.name}-routes.json`), JSON.stringify(observations, null, 2));
});

test('built root, static routes, and 404 retain exactly one theme tag', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-1440-no-preference', 'Static files are shared by all browser projects');
  const files = ['index.html', '404.html', ...Object.keys(routeSeo).filter(route => route !== '/').map(route => `${route.slice(1)}/index.html`)];
  const observations = [];
  for (const file of files) {
    const html = fs.readFileSync(path.join(repoRoot, 'dist', file), 'utf8');
    const tags = await themeTagsInHtml(page, html);
    assertThemeTags(tags, `dist/${file}`);
    observations.push({ file, tags });
  }
  fs.writeFileSync(path.join(outputDir, 'static-html.json'), JSON.stringify(observations, null, 2));
});

test('contact native controls preserve layout, visual states, and keyboard access', async ({ page, browserName }, testInfo) => {
  const mutationRequests = [];
  page.on('request', request => {
    if (request.method() === 'POST' && /\/api\/mutation/.test(request.url())) mutationRequests.push(request.url());
  });
  await page.goto('/contact/');
  const budget = page.getByLabel('Budget Range');
  const description = page.getByLabel('Project Description *');
  await expect(budget).toBeVisible();
  await expect(description).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(0, 0);
  const observations = [];

  async function capture(state) {
    // Wait for the authored focus transition rather than freezing it mid-frame.
    await page.waitForTimeout(200);
    const reducedMotion = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
    expect(reducedMotion).toBe(testInfo.project.use.contextOptions.reducedMotion === 'reduce');
    const controls = await page.locator('#budget, #description').evaluateAll(elements => elements.map(element => {
      const style = getComputedStyle(element);
      const frame = element.closest('.contact-detection-frame');
      const frameStyle = getComputedStyle(frame);
      const rect = element.getBoundingClientRect();
      return {
        id: element.id,
        rect: { x: rect.x, width: rect.width, height: rect.height },
        value: element.value,
        focused: element === document.activeElement,
        color: style.color,
        background: style.backgroundColor,
        border: style.border,
        font: style.font,
        resize: style.resize,
        frameBackground: frameStyle.backgroundColor,
        frameImage: frameStyle.backgroundImage,
        cornerColor: frameStyle.getPropertyValue('--corner-color'),
        transitionDuration: frameStyle.transitionDuration,
      };
    }));
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    expect(overflow).toBe(false);
    for (const control of controls) {
      expect(control.rect.x).toBeGreaterThanOrEqual(0);
      expect(control.rect.x + control.rect.width).toBeLessThanOrEqual(page.viewportSize().width);
      expect(control.background).toBe('rgba(0, 0, 0, 0)');
    }
    observations.push({ state, reducedMotion, controls, overflow });
    for (const id of ['budget', 'description']) {
      await page.locator(`#${id}`).locator('..').screenshot({ path: path.join(outputDir, `${testInfo.project.name}-${state}-${id}.png`), animations: 'disabled', caret: 'hide' });
    }
  }

  await capture('default');
  const tab = browserName === 'webkit' ? 'Alt+Tab' : 'Tab';
  await page.getByLabel('Email Address *').focus();
  await page.keyboard.press(tab);
  await expect(budget).toBeFocused();
  await capture('select-focused');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press(tab);
  await expect(description).toBeFocused();
  await expect(budget).not.toHaveValue('');
  await capture('textarea-focused');
  await page.keyboard.type('Synthetic QA project description.');
  await expect(description).toHaveValue('Synthetic QA project description.');
  await page.keyboard.press(tab);
  await expect(page.getByRole('button', { name: /Send project request/i })).toBeFocused();
  await capture('populated');
  expect(mutationRequests).toEqual([]);
  fs.writeFileSync(path.join(outputDir, `${testInfo.project.name}-contact.json`), JSON.stringify(observations, null, 2));
});
