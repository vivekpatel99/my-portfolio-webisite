import { expect, test } from './qa-test.js';
import { serviceOffers, serviceRouteForId } from '../../src/data/serviceOffers.js';
import { absoluteUrl, routeSeo } from '../../src/lib/seoConfig.js';

const serviceChunk = /\/assets\/ServiceDetail-[^/]+\.js(?:\?.*)?$/;
const pendingStatus = (page) => page.locator('#main-content').getByRole('status', { name: 'Loading page' });

test.skip(process.env.QA_LOCAL_ONLY !== '1', 'Transport injection is restricted to loopback previews.');

test.beforeEach(async ({ page }, testInfo) => {
  if (testInfo.title.startsWith('first visit')) return;
  await page.addInitScript(() => {
    localStorage.setItem('cookie_consent_preferences', JSON.stringify({ necessary: true, analytics: false }));
  });
});

async function holdServiceChunk(page) {
  let release;
  let requested;
  const gate = new Promise((resolve) => { release = resolve; });
  const request = new Promise((resolve) => { requested = resolve; });
  await page.route(serviceChunk, async (route) => {
    requested();
    await gate;
    await route.fallback();
  });
  return { release, request };
}

async function expectServiceMetadata(page, service) {
  const seo = routeSeo[serviceRouteForId(service.id)];
  await expect(page).toHaveTitle(seo.title);
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', absoluteUrl(seo.path));
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', service.summary);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', seo.title);
}

async function expectServiceContext(page, service, pending) {
  const main = page.locator('#main-content');
  await expect(main.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(main.getByRole('heading', { level: 1, name: service.title, exact: true })).toBeVisible();
  await expect(main.getByText(service.summary, { exact: true })).toBeVisible();
  await expect(pendingStatus(page)).toHaveCount(pending ? 1 : 0);
  if (pending) await expect(pendingStatus(page)).toHaveText('Loading service details…');
  await expectServiceMetadata(page, service);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow');
  await expect.poll(() => main.getByRole('heading', { level: 1 }).evaluate((element) => {
    const heading = element.getBoundingClientRect();
    const header = document.querySelector('header').getBoundingClientRect();
    return {
      overflow: document.documentElement.scrollWidth > window.innerWidth,
      headingFits: heading.left >= 0 && heading.right <= window.innerWidth,
      belowHeader: heading.top >= header.bottom,
    };
  })).toEqual({ overflow: false, headingFits: true, belowHeader: true });
}

for (const service of serviceOffers) {
  test(`cold ${service.id} retains context until release`, async ({ page }, testInfo) => {
    const held = await holdServiceChunk(page);
    const widths = testInfo.project.name.includes('mobile') ? [390, 320] : [1440];
    try {
      await page.goto(`${serviceRouteForId(service.id)}/`, { waitUntil: 'domcontentloaded' });
      await held.request;
      for (const width of widths) {
        await page.setViewportSize({ width, height: width === 1440 ? 900 : 844 });
        await expectServiceContext(page, service, true);
        const back = page.locator('#main-content').getByRole('link', { name: 'Back to Services', exact: true });
        await back.focus();
        await expect(back).toBeFocused();
        await expect(back).toHaveAttribute('href', '/#services');
        await expect(page.locator('header').getByRole('link', { name: 'Vivek Patel home' })).toBeVisible();
        if (width < 768) {
          await page.getByRole('button', { name: 'Toggle navigation menu' }).click();
          const menu = page.getByRole('dialog', { name: 'Navigation menu' });
          await expect(menu.getByRole('link', { name: 'Request a Project Estimate', exact: true })).toBeVisible();
          await page.keyboard.press('Escape');
          await expect(menu).toHaveCount(0);
        }
      }
      held.release();
      for (const width of widths) {
        await page.setViewportSize({ width, height: width === 1440 ? 900 : 844 });
        await expectServiceContext(page, service, false);
        await expect(page.getByRole('heading', { name: 'In scope', exact: true })).toBeVisible();
      }
    } finally {
      held.release();
    }
  });
}

test('navigation while held uses the current service and stays correct after release', async ({ page }) => {
  const held = await holdServiceChunk(page);
  const [first, next] = serviceOffers;
  try {
    await page.goto(serviceRouteForId(first.id), { waitUntil: 'domcontentloaded' });
    await held.request;
    await expectServiceContext(page, first, true);
    await page.locator('#main-content').getByRole('link', { name: 'Back to Services', exact: true }).click();
    await expect(page).toHaveURL(/\/#services$/);
    await expect(pendingStatus(page)).toHaveCount(0);
    await expect(page).toHaveTitle(routeSeo['/'].title);
    await page.locator(`a[href="${serviceRouteForId(next.id)}"]`).first().click();
    await expectServiceContext(page, next, true);
    await expect(page.locator('#main-content').getByText(first.summary, { exact: true })).toHaveCount(0);
    held.release();
    await expectServiceContext(page, next, false);
    await expect(page.locator('#main-content').getByText(first.summary, { exact: true })).toHaveCount(0);
  } finally {
    held.release();
  }
});

test('failure and held keyboard retry preserve metadata and focus final content', async ({ page }) => {
  const service = serviceOffers[2];
  const posts = [];
  let loads = 0;
  page.on('request', (request) => { if (request.method() === 'POST') posts.push(request.url()); });
  page.on('load', () => { loads += 1; });
  await page.route(serviceChunk, (route) => route.abort('failed'));
  await page.goto(serviceRouteForId(service.id));
  await expect(page.getByRole('heading', { level: 1, name: "This page didn't load" })).toBeFocused();
  await expect(pendingStatus(page)).toHaveCount(0);
  await expect(page).toHaveTitle('Page unavailable | Vivek Patel');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', absoluteUrl(serviceRouteForId(service.id)));
  await page.unroute(serviceChunk);
  const held = await holdServiceChunk(page);
  try {
    await page.getByRole('button', { name: 'Retry', exact: true }).focus();
    await page.keyboard.press('Enter');
    await held.request;
    await expectServiceContext(page, service, true);
    await expect(page.getByRole('heading', { level: 1 })).not.toBeFocused();
    held.release();
    await expectServiceContext(page, service, false);
    await expect(page.getByRole('heading', { level: 1, name: service.title, exact: true })).toBeFocused();
    expect(loads).toBe(1);
    expect(posts).toEqual([]);
    await expect(page.locator('[data-route-error]')).toHaveCount(0);
  } finally {
    held.release();
  }
});

test('an unknown service stays noindex while held and resolves to one 404 heading', async ({ page }) => {
  const held = await holdServiceChunk(page);
  try {
    await page.goto('/services/unknown-offer/', { waitUntil: 'domcontentloaded' });
    await held.request;
    await expect(pendingStatus(page)).toHaveText('Loading page…');
    await expect(page.locator('#main-content').getByRole('heading', { level: 1, name: 'Loading page' })).toHaveCount(1);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', absoluteUrl('/services/unknown-offer/'));
    held.release();
    await expect(pendingStatus(page)).toHaveCount(0);
    await expect(page.locator('#main-content').getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page).toHaveTitle('Page Not Found | Vivek Patel');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  } finally {
    held.release();
  }
});

test.describe('static service HTML', () => {
  test.use({ javaScriptEnabled: false });
  for (const service of serviceOffers) {
    test(`no JavaScript preserves ${service.id}`, async ({ page }, testInfo) => {
      await page.goto(`${serviceRouteForId(service.id)}/`);
      await expect(page.locator('#root').getByRole('heading', { level: 1 })).toHaveCount(1);
      await expect(page.getByRole('heading', { level: 1, name: service.title, exact: true })).toBeVisible();
      await expect(page.getByText(service.summary, { exact: true })).toBeVisible();
      await expectServiceMetadata(page, service);
      await expect(page.locator('meta[name="robots"][content*="noindex" i]')).toHaveCount(0);
      await expect(page.getByRole('status', { name: 'Loading page' })).toHaveCount(0);
      const widths = testInfo.project.name.includes('mobile') ? [390, 320] : [1440];
      for (const width of widths) {
        await page.setViewportSize({ width, height: 900 });
        expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
      }
      await expect(page.getByRole('heading', { name: 'In scope', exact: true })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Back to Services', exact: true })).toBeVisible();
    });
  }
});

test('leaving a held service ignores its late chunk failure', async ({ page }) => {
  let releaseFailure;
  let requested;
  const gate = new Promise((resolve) => { releaseFailure = resolve; });
  const request = new Promise((resolve) => { requested = resolve; });
  await page.route(serviceChunk, async (route) => {
    requested();
    await gate;
    await route.abort('failed');
  });
  try {
    await page.goto(serviceRouteForId(serviceOffers[0].id), { waitUntil: 'domcontentloaded' });
    await request;
    await expectServiceContext(page, serviceOffers[0], true);
    await page.locator('#main-content').getByRole('link', { name: 'Back to Services', exact: true }).click();
    const failed = page.waitForEvent('requestfailed', { predicate: (event) => serviceChunk.test(event.url()) });
    releaseFailure();
    await failed;
    await expect(page).toHaveURL(/\/#services$/);
    await expect(page).toHaveTitle(routeSeo['/'].title);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', absoluteUrl('/'));
    await expect(page.locator('[data-route-error]')).toHaveCount(0);
    await expect(pendingStatus(page)).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'SERVICE OFFERS', exact: true })).toBeVisible();
  } finally {
    releaseFailure();
  }
});

for (const [path, chunk] of [['/contact', 'ContactRoute'], ['/legal', 'Legal'], ['/data-policy', 'DataPolicy']]) {
  test(`shared pending fallback retains ${path} metadata at 320px`, async ({ page }) => {
    let release;
    const gate = new Promise((resolve) => { release = resolve; });
    await page.route(new RegExp(`/assets/${chunk}-[^/]+\\.js(?:\\?.*)?$`), async (route) => {
      await gate;
      await route.fallback();
    });
    try {
      await page.setViewportSize({ width: 320, height: 740 });
      await page.goto(`${path}/`, { waitUntil: 'domcontentloaded' });
      await expect(pendingStatus(page)).toHaveText('Loading page…');
      await expect(page.locator('#main-content').getByRole('heading', { level: 1, name: 'Loading page', exact: true })).toHaveCount(1);
      await expect(page).toHaveTitle(routeSeo[path].title);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', absoluteUrl(path));
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow');
      expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
      release();
      await expect(pendingStatus(page)).toHaveCount(0);
      await expect(page.locator('#main-content').getByRole('heading', { level: 1 })).toHaveCount(1);
      await expect(page).toHaveTitle(routeSeo[path].title);
    } finally {
      release();
    }
  });
}

test('first visit keeps pending content usable beside consent at 320px', async ({ page }) => {
  const held = await holdServiceChunk(page);
  try {
    await page.setViewportSize({ width: 320, height: 740 });
    await page.goto(`${serviceRouteForId(serviceOffers[1].id)}/`, { waitUntil: 'domcontentloaded' });
    await held.request;
    const consent = page.getByRole('dialog', { name: 'We value your privacy' });
    await expect(consent).toBeVisible();
    const main = page.locator('#main-content');
    await expect(main.getByRole('heading', { level: 1, name: serviceOffers[1].title, exact: true })).toBeVisible();
    for (const content of [pendingStatus(page), main.getByRole('link', { name: 'Back to Services', exact: true })]) {
      await content.scrollIntoViewIfNeeded();
      await expect.poll(() => content.evaluate((element) => {
        const box = element.getBoundingClientRect();
        const banner = document.querySelector('[role="dialog"]').getBoundingClientRect();
        return box.top >= banner.bottom && box.bottom <= window.innerHeight;
      })).toBe(true);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
    await main.getByRole('link', { name: 'Back to Services', exact: true }).click();
    await expect(page).toHaveURL(/\/#services$/);
    await expect(pendingStatus(page)).toHaveCount(0);
  } finally {
    held.release();
  }
});
