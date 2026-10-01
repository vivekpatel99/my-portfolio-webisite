import { expect, test } from './qa-test.js';

const HEADING = "This page didn't load";
const CHUNKS = {
  contact: /\/assets\/ContactRoute-[^/]+\.js(?:\?.*)?$/,
  legal: /\/assets\/Legal-[^/]+\.js(?:\?.*)?$/,
};

test.skip(process.env.QA_LOCAL_ONLY !== '1', 'Chunk-failure injection runs only against a loopback preview.');

async function failChunk(page, pattern) {
  const state = { failing: true, requests: 0 };
  await page.route(pattern, (route) => {
    state.requests += 1;
    return state.failing ? route.abort('failed') : route.fallback();
  });
  return state;
}

function trackPage(page) {
  const tracked = { posts: [], loads: 0 };
  page.on('request', (request) => {
    if (request.method() === 'POST') tracked.posts.push(request.url());
  });
  page.on('load', () => { tracked.loads += 1; });
  return tracked;
}

async function expectRecoveryState(page) {
  const main = page.locator('#main-content');
  const heading = main.getByRole('heading', { level: 1, name: HEADING });
  await expect(heading).toBeVisible();
  await expect(heading).toBeFocused();
  await expect(page.locator('header')).toBeVisible();
  await expect(page.locator('header').getByRole('link', { name: 'Vivek Patel home' })).toBeVisible();
  await expect(page.locator('#site-footer')).toBeVisible();
  await expect(main.getByRole('button', { name: 'Retry' })).toBeVisible();
  await expect(main.getByRole('link', { name: 'Back to Home' })).toBeVisible();
  return heading;
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('cookie_consent_preferences', JSON.stringify({ necessary: true, analytics: false }));
  });
});

test.describe('route chunk recovery', () => {
  test('a failed contact chunk from the hero CTA keeps the site shell', async ({ page }) => {
    const tracked = trackPage(page);
    await page.goto('/');
    await failChunk(page, CHUNKS.contact);

    const cta = page.locator('#main-content').getByRole('link', { name: 'Request a Project Estimate' }).first();
    await cta.focus();
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/\/contact\/?$/);
    await expectRecoveryState(page);
    await expect(page.getByText('Something went wrong.')).toHaveCount(0);
    expect(tracked.loads).toBe(1);
    expect(tracked.posts).toEqual([]);
  });

  test('a failed contact chunk from the header estimate control keeps the site shell', async ({ page }) => {
    const tracked = trackPage(page);
    await page.goto('/');
    const chunk = await failChunk(page, CHUNKS.contact);

    if (page.viewportSize().width < 768) {
      await page.getByRole('button', { name: 'Toggle navigation menu' }).focus();
      await page.keyboard.press('Enter');
      const menu = page.getByRole('dialog', { name: 'Navigation menu' });
      await expect(menu).toBeVisible();
      await menu.getByRole('link', { name: 'Request a Project Estimate' }).focus();
    } else {
      await page.locator('header').getByRole('link', { name: 'Request Estimate', exact: true }).focus();
    }
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/\/contact\/?$/);
    await expect(page.getByRole('dialog', { name: 'Navigation menu' })).toHaveCount(0);
    await expectRecoveryState(page);
    const requestsAfterFailure = chunk.requests;

    await page.waitForTimeout(2_000);
    expect(tracked.loads).toBe(1);
    expect(chunk.requests).toBe(requestsAfterFailure);
    expect(tracked.posts).toEqual([]);
  });

  test('a failed legal chunk from the footer keeps the site shell and clears on navigation', async ({ page }) => {
    const tracked = trackPage(page);
    await page.goto('/');
    await failChunk(page, CHUNKS.legal);

    const footer = page.locator('#site-footer');
    await footer.getByRole('link', { name: 'Privacy Policy' }).focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/legal\/?$/);
    await expectRecoveryState(page);

    await footer.getByRole('link', { name: 'Cookie Policy' }).focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/data-policy\/?$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Cookie Policy' })).toBeVisible();
    await expect(page.getByRole('heading', { name: HEADING })).toHaveCount(0);
    expect(tracked.loads).toBe(1);
    expect(tracked.posts).toEqual([]);
  });

  test('keyboard Back to Home leaves the recovery state', async ({ page }) => {
    await failChunk(page, CHUNKS.contact);
    await page.goto('/contact/');
    await expectRecoveryState(page);

    await page.locator('#main-content').getByRole('link', { name: 'Back to Home' }).focus();
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { name: HEADING })).toHaveCount(0);
    await expect(page.locator('#main-content').getByRole('link', { name: 'Request a Project Estimate' }).first())
      .toBeVisible();
  });

  test('keyboard Retry reloads once and renders the page after transport recovers', async ({ page }) => {
    const tracked = trackPage(page);
    const chunk = await failChunk(page, CHUNKS.contact);
    await page.goto('/contact/');
    await expectRecoveryState(page);
    expect(tracked.loads).toBe(1);

    chunk.failing = false;
    await page.locator('#main-content').getByRole('button', { name: 'Retry' }).focus();
    await Promise.all([
      page.waitForEvent('load'),
      page.keyboard.press('Enter'),
    ]);

    await expect(page.getByLabel('Full Name *')).toBeVisible();
    await expect(page.getByRole('heading', { name: HEADING })).toHaveCount(0);
    expect(tracked.loads).toBe(2);
    expect(tracked.posts).toEqual([]);
  });

  test('persistent failure never reloads without a user activation', async ({ page }) => {
    const tracked = trackPage(page);
    const chunk = await failChunk(page, CHUNKS.contact);
    await page.goto('/contact/');
    await expectRecoveryState(page);
    const requestsAfterFailure = chunk.requests;

    await page.waitForTimeout(2_000);
    expect(tracked.loads).toBe(1);
    expect(chunk.requests).toBe(requestsAfterFailure);

    await page.locator('#main-content').getByRole('button', { name: 'Retry' }).focus();
    await Promise.all([
      page.waitForEvent('load'),
      page.keyboard.press('Space'),
    ]);
    await expectRecoveryState(page);
    const requestsAfterRetry = chunk.requests;
    expect(requestsAfterRetry).toBeGreaterThan(requestsAfterFailure);

    await page.waitForTimeout(2_000);
    expect(tracked.loads).toBe(2);
    expect(chunk.requests).toBe(requestsAfterRetry);
    expect(tracked.posts).toEqual([]);
  });

  test('recovery layout does not overflow or overlap the shell', async ({ page }) => {
    await failChunk(page, CHUNKS.contact);
    await page.goto('/contact/');
    await expectRecoveryState(page);

    const layout = await page.evaluate(() => {
      const box = (element) => element.getBoundingClientRect();
      const header = box(document.querySelector('header'));
      const heading = box(document.getElementById('route-error-heading'));
      const [retry, home] = [...document.querySelectorAll('[data-route-error] button, [data-route-error] a')]
        .map(box);
      const overlaps = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
      return {
        horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        headingBelowHeader: heading.top >= header.bottom,
        headingFits: heading.left >= 0 && heading.right <= window.innerWidth,
        controlsOverlap: overlaps(retry, home),
        controlsFit: [retry, home].every((rect) => rect.left >= 0 && rect.right <= window.innerWidth),
      };
    });

    expect(layout).toEqual({
      horizontalOverflow: 0,
      headingBelowHeader: true,
      headingFits: true,
      controlsOverlap: false,
      controlsFit: true,
    });
  });

  for (const reducedMotion of ['no-preference', 'reduce']) {
    test(`recovery state is immediately final with ${reducedMotion} motion`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion });
      await failChunk(page, CHUNKS.contact);
      await page.goto('/contact/');
      await expectRecoveryState(page);

      const state = await page.evaluate(() => {
        const section = document.querySelector('[data-route-error]');
        return {
          opacity: getComputedStyle(section).opacity,
          animations: section.getAnimations({ subtree: true }).length,
        };
      });
      expect(state).toEqual({ opacity: '1', animations: 0 });
    });
  }
});
