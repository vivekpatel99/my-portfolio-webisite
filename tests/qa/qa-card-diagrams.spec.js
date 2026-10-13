import { expect, test } from './qa-test.js';
import { collectionCaseStudies, featuredCaseStudies } from '../../src/data/caseStudies.js';
import { guardLocalNavigation, guardLocalWebSocket } from './qa-navigation-guard.js';

const viewports = [[1440, 900], [980, 1324], [390, 844], [320, 740]];

async function expectUnobscuredDiagram(card) {
  await card.evaluate(element => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
  const media = card.locator('.media');
  const image = media.locator('img');
  await expect.poll(() => image.evaluate((element) => element.complete && element.naturalWidth > 0)).toBe(true);
  await expect(image).toHaveCSS('object-fit', 'contain');
  await expect(image).toHaveCSS('object-position', '50% 0%');
  await expect(image).toHaveCSS('opacity', '1');
  await expect(image).toHaveCSS('filter', 'none');
  expect(await media.evaluate(element => ({
    children: [...element.children].map(child => child.tagName),
    before: getComputedStyle(element, '::before').content,
    after: getComputedStyle(element, '::after').content,
  }))).toEqual({ children: ['IMG'], before: 'none', after: 'none' });

  const mediaBox = await media.boundingBox();
  const labelBox = await card.locator('.cat').boundingBox();
  const headingBox = await card.getByRole('heading').boundingBox();
  const arrowBox = await card.locator('.glyph-hit').boundingBox();
  const cardBox = await card.boundingBox();
  await expect(card.locator('.cat')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  expect(labelBox.y + labelBox.height, 'category clears the diagram').toBeLessThanOrEqual(mediaBox.y);
  expect(headingBox.y, 'title clears the diagram').toBeGreaterThanOrEqual(mediaBox.y + mediaBox.height);
  expect(arrowBox.y, 'arrow clears the diagram').toBeGreaterThanOrEqual(mediaBox.y + mediaBox.height);
  expect(headingBox.x + headingBox.width, 'title clears the arrow').toBeLessThanOrEqual(arrowBox.x);
  expect(headingBox.x).toBeGreaterThanOrEqual(cardBox.x);
  expect(headingBox.x + headingBox.width).toBeLessThanOrEqual(cardBox.x + cardBox.width);
}

for (const [width, height] of viewports) {
  for (const route of ['/', '/case-studies/']) {
    test(`overview diagrams stay clear on ${route} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.addInitScript(() => localStorage.setItem('cookie_consent_preferences', JSON.stringify({ necessary: true, analytics: false })));
      await page.goto(route);
      const isCollection = route === '/case-studies/';
      if (isCollection) {
        await page.getByRole('button', { name: 'Load more', exact: true }).focus();
        await page.keyboard.press('Enter');
      }
      const cards = page.locator(isCollection ? 'main article.card' : '#portfolio article.card');
      await expect(cards).toHaveCount(isCollection ? collectionCaseStudies.length : featuredCaseStudies.length);
      for (const card of await cards.all()) await expectUnobscuredDiagram(card);
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    });
  }

  test(`prerendered collection diagrams stay clear at ${width}px`, async ({ browser, baseURL }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width, height }, baseURL, serviceWorkers: 'block' });
    try {
      if (process.env.QA_LOCAL_ONLY === '1') {
        await context.route('**/*', guardLocalNavigation);
        await context.routeWebSocket('**/*', guardLocalWebSocket);
      }
      const page = await context.newPage();
      await page.goto('/case-studies/');
      const cards = page.locator('#root article.card');
      await expect(cards).toHaveCount(6);
      for (const card of await cards.all()) await expectUnobscuredDiagram(card);
      await expect(page.getByRole('button', { name: 'Load more', exact: true })).toBeDisabled();
      await expect(page.getByRole('navigation', { name: 'More case studies' }).getByRole('link')).toHaveCount(collectionCaseStudies.length - 6);
    } finally { await context.close(); }
  });
}
