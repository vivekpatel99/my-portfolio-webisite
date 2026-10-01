import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { test, expect } from './qa-test.js';

const phase = process.env.QA_TYPOGRAPHY_PHASE || 'after';
if (!['before', 'after'].includes(phase)) {
  throw new Error('QA_TYPOGRAPHY_PHASE must be before or after.');
}
const outputDir = process.env.QA_TYPOGRAPHY_OUTPUT_DIR;
const articleRoute = '/project/ai-invoice-processing-automation/';
const routes = ['/', articleRoute, '/case-studies/', '/contact/', '/legal/', '/data-policy/'];

function measureTypography() {
  const lines = (element) => {
    const groups = new Map();
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      for (let offset = 0; offset < node.textContent.length; offset += 1) {
        const range = document.createRange();
        range.setStart(node, offset);
        range.setEnd(node, offset + 1);
        const rect = range.getBoundingClientRect();
        if (!rect.width || !rect.height) continue;
        const top = Math.round(rect.top);
        groups.set(top, (groups.get(top) || '') + node.textContent[offset]);
      }
    }
    return [...groups.values()].map((text) => text.trim()).filter(Boolean);
  };
  const measurements = (selector) => [...document.querySelectorAll(selector)].map((element) => {
    const lineTexts = lines(element);
    const style = getComputedStyle(element);
    return {
      text: element.textContent.trim(),
      width: element.getBoundingClientRect().width,
      fontSize: parseFloat(style.fontSize),
      fontFamily: style.fontFamily,
      color: style.color,
      lines: lineTexts,
      average: lineTexts.reduce((total, text) => total + text.length, 0) / lineTexts.length,
    };
  });
  const geometry = (selector) => [...document.querySelectorAll(selector)].map((element) => {
    const { x, width, height } = element.getBoundingClientRect();
    return { selector, x, width, height };
  });
  return {
    route: location.pathname,
    width: innerWidth,
    overflow: document.documentElement.scrollWidth > innerWidth,
    paragraphs: measurements('.case-study-sections p, #cta .body'),
    summary: measurements('.case-study-summary'),
    rates: measurements('#cta .rate strong'),
    headings: measurements('h1, h2, h3').filter(({ text }) => text.split(/\s+/).length > 1),
    punctuation: document.body.innerText.match(/.{0,30}(?:"|\.{3}).{0,30}/g) || [],
    placeholder: document.querySelector('textarea')?.placeholder,
    geometry: ['header', '.case-study-article', '.case-gallery-stage', '#cta', '#cta .body', '#cta .actions', '.case-study-sections'].flatMap(geometry),
  };
}

for (const route of routes) {
  test(`reading typography ${route}`, async ({ page }, testInfo) => {
    const width = testInfo.project.use.viewport.width;
    test.skip(route !== '/' && ![390, 1440].includes(width) && !(route === articleRoute && width === 1024), 'Additional widths cover the rate strip and desktop article measure.');
    await page.addInitScript(() => {
      localStorage.setItem('cookie_consent_preferences', JSON.stringify({ necessary: true, analytics: false }));
      let seed = 260;
      Math.random = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
      };
    });
    await page.goto(route);
    await expect(page.locator('h1')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    if (route === '/') {
      await page.locator('#cta').scrollIntoViewIfNeeded();
      await expect.poll(() => page.locator('#cta').evaluate((element) => {
        const animator = element.closest('[data-section-animator]');
        const transform = animator && getComputedStyle(animator).transform;
        return !transform || transform === 'none' ? 0 : new DOMMatrixReadOnly(transform).m42;
      })).toBe(0);
    }
    const measured = await page.evaluate(measureTypography);
    const key = `${testInfo.project.name}-${route === '/' ? 'home' : route.split('/').filter(Boolean).join('-')}`;
    const directory = path.join(outputDir, phase);
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(path.join(directory, `${key}.json`), JSON.stringify(measured, null, 2));
    if ([390, 1440].includes(width) && testInfo.project.use.reducedMotion === 'no-preference' && ['/', articleRoute].includes(route)) {
      const target = page.locator(route === '/' ? '#cta' : '.case-study-sections');
      const captureStyle = await page.addStyleTag({ content: 'header { visibility: hidden !important; }' });
      const bounds = await target.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return { left: Math.floor(rect.left + scrollX), top: Math.floor(rect.top + scrollY), width: Math.ceil(rect.width), height: Math.ceil(rect.height) };
      });
      const screenshot = await page.screenshot({ fullPage: true, animations: 'disabled' });
      await sharp(screenshot).extract(bounds).png().toFile(path.join(directory, `${key}.png`));
      await captureStyle.evaluate((element) => element.remove());
    }
    expect(measured.overflow).toBe(false);
    if (phase === 'after') {
      if (width >= 1024) {
        for (const paragraph of measured.paragraphs.filter(({ lines }) => lines.length > 1)) {
          expect(paragraph.average, paragraph.text).toBeLessThanOrEqual(75);
        }
        if (route === articleRoute) {
          expect(measured.paragraphs[0].fontSize).toBeGreaterThanOrEqual(measured.summary[0].fontSize);
        }
      }
      for (const rate of measured.rates) expect(rate.lines, rate.text).toHaveLength(1);
      if ([390, 1440].includes(width)) {
        for (const heading of measured.headings.filter(({ lines }) => lines.length > 1)) {
          expect(heading.lines.at(-1).split(/\s+/).length, heading.text).toBeGreaterThan(1);
        }
      }
      if (['/', '/contact/', '/legal/', '/data-policy/'].includes(route)) {
        expect(measured.punctuation).toEqual([]);
        if (measured.placeholder) expect(measured.placeholder).not.toMatch(/"|\.{3}/);
      }
    }
    if (route === '/' && [390, 1440].includes(width)) {
      const estimate = page.locator('#cta a[href="/contact/"]');
      await estimate.focus();
      await expect(estimate).toBeFocused();
      await expect.poll(() => estimate.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe('solid');
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(/\/contact\/$/);
      await expect(page.locator('h1')).toBeVisible();
    }
    if (route === articleRoute && [390, 1440].includes(width)) {
      const opener = page.getByRole('button', { name: /^Enlarge image:/ });
      await opener.focus();
      await page.keyboard.press('Enter');
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).toHaveCount(0);
      await expect(opener).toBeFocused();
    }
  });
}
