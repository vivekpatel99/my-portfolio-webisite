import { expect, test } from './qa-test.js';
import { collectionCaseStudies, featuredCaseStudies } from '../../src/data/caseStudies.js';
import { guardLocalNavigation, guardLocalWebSocket } from './qa-navigation-guard.js';

const viewports = [[1440, 900], [980, 1324], [390, 844], [320, 740]];

async function expectShadowedDiagram(card) {
  await card.evaluate(element => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
  const media = card.locator('.media');
  const image = media.locator('img');
  await expect.poll(() => image.evaluate((element) => element.complete && element.naturalWidth > 0)).toBe(true);
  await expect(image).toHaveCSS('object-fit', 'contain');
  await expect(image).toHaveCSS('object-position', '50% 0%');
  await expect(image).toHaveCSS('opacity', '1');
  await expect(image).toHaveCSS('filter', 'none');
  await expect(media.locator('.scrim')).toHaveAttribute('aria-hidden', 'true');
  expect(await media.locator('.scrim').evaluate(element => getComputedStyle(element).backgroundImage)).toContain('linear-gradient');
  expect(await media.evaluate(element => getComputedStyle(element, '::before').backgroundImage)).toContain('linear-gradient');

  const mediaBox = await media.boundingBox();
  const headingBox = await card.getByRole('heading').boundingBox();
  const arrowBox = await card.locator('.glyph-hit').boundingBox();
  const cardBox = await card.boundingBox();
  await expect(card.locator('.cat')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  expect(headingBox.y, 'title stays inside the shadowed media').toBeGreaterThanOrEqual(mediaBox.y);
  expect(headingBox.y + headingBox.height).toBeLessThanOrEqual(mediaBox.y + mediaBox.height);
  expect(arrowBox.y + arrowBox.height).toBeLessThanOrEqual(mediaBox.y + mediaBox.height);
  expect(headingBox.x + headingBox.width, 'title clears the arrow').toBeLessThanOrEqual(arrowBox.x);
  expect(headingBox.x).toBeGreaterThanOrEqual(cardBox.x);
  expect(headingBox.x + headingBox.width).toBeLessThanOrEqual(cardBox.x + cardBox.width);
}

for (const [width, height] of viewports) {
  for (const route of ['/', '/case-studies/']) {
    test(`overview cards retain their shadow treatment on ${route} at ${width}px`, async ({ page }) => {
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
      const projects = isCollection ? collectionCaseStudies : featuredCaseStudies;
      for (const [index, project] of projects.entries()) {
        const card = cards.nth(index);
        await expectShadowedDiagram(card);
        const paragraphs = card.locator('.body > p');
        await expect(paragraphs.first()).toHaveText(project.summary);
        const caption = project.cardCaption || project.image?.caption;
        if (caption) await expect(paragraphs.nth(1)).toHaveText(caption);
        else await expect(paragraphs).toHaveCount(1);
        await expect(card.locator('time')).toHaveAttribute('datetime', project.completedAt);
        await expect(card.getByRole('link', { name: `Read case study: ${project.cardTitle || project.title}` }))
          .toHaveAttribute('href', `/project/${project.slug}/${isCollection ? '?from=collection' : ''}`);
        const bodyBox = await card.locator('.body').boundingBox();
        for (const paragraph of await paragraphs.all()) {
          const box = await paragraph.boundingBox();
          expect(box.x).toBeGreaterThanOrEqual(bodyBox.x);
          expect(box.x + box.width).toBeLessThanOrEqual(bodyBox.x + bodyBox.width);
          expect(await paragraph.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
        }
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    });
  }

  test(`prerendered collection cards retain their shadow treatment at ${width}px`, async ({ browser, baseURL }) => {
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
      for (const card of await cards.all()) await expectShadowedDiagram(card);
      await expect(page.getByRole('button', { name: 'Load more', exact: true })).toBeDisabled();
      await expect(page.getByRole('navigation', { name: 'More case studies' }).getByRole('link')).toHaveCount(collectionCaseStudies.length - 6);
    } finally { await context.close(); }
  });
}


test('case-study cards match service-offer feedback and navigate from the summary', async ({ page, hasTouch }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const service = page.locator('.service-offer').first();
  const serviceLink = service.getByRole('link');
  const card = page.locator('#portfolio article.card').first();
  const cardLink = card.getByRole('link', { name: /^Read case study:/ });
  const dimensions = await card.boundingBox();

  if (!hasTouch) {
    await service.hover();
    const serviceHover = await service.evaluate(element => ({
      fill: getComputedStyle(element).backgroundColor,
      corner: getComputedStyle(element).getPropertyValue('--detection-top'),
    }));
    await card.hover();
    expect(await card.evaluate(element => ({
      fill: getComputedStyle(element).backgroundColor,
      corner: getComputedStyle(element).getPropertyValue('--detection-top'),
    }))).toEqual(serviceHover);
  }

  const focusStyle = link => link.evaluate(element => {
    const style = getComputedStyle(element, '::after');
    return { outline: style.outlineStyle, width: style.outlineWidth, offset: style.outlineOffset, fill: style.backgroundColor };
  });
  await serviceLink.focus();
  const serviceFocus = await focusStyle(serviceLink);
  expect(serviceFocus.outline).toBe('solid');
  expect(serviceFocus.width).toBe('2px');
  await cardLink.focus();
  expect(await focusStyle(cardLink)).toEqual(serviceFocus);
  expect(await card.evaluate(element => getComputedStyle(element).transitionDuration)).toBe('0s');
  const focusedDimensions = await card.boundingBox();
  expect(focusedDimensions.width).toBe(dimensions.width);
  expect(focusedDimensions.height).toBe(dimensions.height);
  await expectShadowedDiagram(card);
  const href = await cardLink.getAttribute('href');
  const cardBox = await card.boundingBox();
  const summaryBox = await card.locator('.summary').boundingBox();
  await card.click({ position: { x: summaryBox.x - cardBox.x + 8, y: summaryBox.y - cardBox.y + 8 } });
  await expect(page).toHaveURL(new URL(href, page.url()).href);
});

test('collection card body retains its collection-origin navigation', async ({ page }) => {
  await page.goto('/case-studies/');
  await page.getByRole('button', { name: 'Load more', exact: true }).click();
  const card = page.locator('article.card').first();
  const href = await card.getByRole('link', { name: /^Read case study:/ }).getAttribute('href');
  expect(href).toContain('?from=collection');
  const cardBox = await card.boundingBox();
  const summaryBox = await card.locator('.summary').boundingBox();
  await card.click({ position: { x: summaryBox.x - cardBox.x + 8, y: summaryBox.y - cardBox.y + 8 } });
  const destination = new URL(href, page.url());
  destination.search = '';
  await expect(page).toHaveURL(destination.href);
  await page.goBack({ waitUntil: 'commit' });
  await expect(page).toHaveURL(new URL('/case-studies/', page.url()).href);
  await expect(page.locator('article.card')).toHaveCount(collectionCaseStudies.length);
});
