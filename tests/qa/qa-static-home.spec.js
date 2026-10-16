import { expect, test } from './qa-test.js';
import { featuredCaseStudies } from '../../src/data/caseStudies.js';
import { serviceOffers, serviceRouteForId } from '../../src/data/serviceOffers.js';
import { HOURLY_RATE_LABEL } from '../../src/config/pricing.js';

test.skip(process.env.QA_LOCAL_ONLY !== '1', 'Homepage build acceptance runs only on a loopback preview.');

const introduction = 'Manual data entry, scattered website data, and unstructured video slow teams down. I build document extraction, n8n automation, and computer vision workflows to make that information usable.';

async function expectReadableHome(page) {
  const heading = page.getByRole('heading', { level: 1 });
  await expect(heading).toHaveCount(1);
  await expect(heading).toBeVisible();
  await expect(page.getByText(introduction, { exact: true })).toBeVisible();
  await expect(page.locator('[data-hero-field="rate"]')).toContainText(HOURLY_RATE_LABEL);
  await expect(page.getByText('Profile Invoice', { exact: true })).toHaveCount(1);
  for (const story of featuredCaseStudies) {
    await expect(page.locator(`#portfolio a[href="/project/${story.slug}/"]`)).toBeVisible();
  }
  for (const service of serviceOffers) {
    await expect(page.locator(`#services a[href="${serviceRouteForId(service.id)}"]`)).toBeVisible();
  }
  await expect(page.locator('#cta a[href="/contact/"]')).toBeVisible();
  await expect.poll(() => heading.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    let readable = true;
    for (let ancestor = element; ancestor; ancestor = ancestor.parentElement) {
      const style = getComputedStyle(ancestor);
      if (Number(style.opacity) === 0 || style.visibility === 'hidden') readable = false;
    }
    return {
      readable,
      headingFits: rect.left >= 0 && rect.right <= window.innerWidth,
      reflows: document.documentElement.scrollWidth <= window.innerWidth,
    };
  })).toEqual({ readable: true, headingFits: true, reflows: true });
}

test.describe('homepage without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  for (const width of [1440, 390, 320]) {
    test(`static home remains readable at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const response = await page.goto('/');
      expect(response.status()).toBe(200);
      await expectReadableHome(page);
      await expect(page.locator('header')).toHaveCount(1);
      await expect(page.getByRole('button', { name: 'Toggle navigation menu', includeHidden: true })).toBeDisabled();
      for (const wrapper of await page.locator('[data-section-animator]').all()) {
        await expect(wrapper).toHaveCSS('transform', 'none');
      }
      for (const button of await page.getByRole('button', { name: /^Slide \d+$/ }).all()) {
        await expect(button).toBeDisabled();
      }
      // Native links still reach generated public detail pages without a router.
      await page.locator(`#portfolio a[href="/project/${featuredCaseStudies[0].slug}/"]`).click();
      await expect(page.getByRole('heading', { level: 1, name: featuredCaseStudies[0].title, exact: true })).toBeVisible();
    });
  }
  test('static hero honors reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expectReadableHome(page);
    expect(await page.locator('[data-hero-motion]').evaluate((hero) => hero.getAnimations({ subtree: true }).length)).toBe(0);
  });
});

for (const width of [1440, 390, 320]) {
  test(`JavaScript replaces static home once at ${width}px`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expect(page.locator('header')).toBeVisible();
    await expectReadableHome(page);
    await expect(page.locator('#main-content')).toHaveCount(1);
    await expect(page.locator('#portfolio')).toHaveCount(1);
    await expect(page.locator('#services')).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Slide 2', exact: true })).toBeEnabled();
    await page.getByRole('button', { name: 'Slide 2', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Slide 2', exact: true })).toHaveAttribute('aria-current', 'true');
    expect(errors).toEqual([]);
  });
}

for (const width of [1440, 320]) {
  test(`hero stays in place when the delayed entry starts at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(() => {
      localStorage.setItem('cookie_consent_preferences', JSON.stringify({ necessary: true, analytics: false }));
    });
    let release;
    const gate = new Promise((resolve) => { release = resolve; });
    await page.route(/\/assets\/index-[^/]+\.js(?:\?.*)?$/, async (route) => {
      await gate;
      await route.fallback();
    });
    try {
      await page.goto('/', { waitUntil: 'commit' });
      const heading = page.getByRole('heading', { level: 1 });
      const menu = page.getByRole('button', { name: 'Toggle navigation menu', includeHidden: true });
      await expect(page.locator('header')).toHaveCSS('height', '69px');
      await expect(menu).toBeDisabled();
      const staticBox = await heading.boundingBox();
      release();
      await expect(menu).toBeEnabled();
      await expect(heading).toHaveCount(1);
      const clientBox = await heading.boundingBox();
      expect(Math.abs(clientBox.y - staticBox.y)).toBeLessThanOrEqual(1);
      expect(Math.abs(clientBox.x - staticBox.x)).toBeLessThanOrEqual(1);
      await expect(page.locator('#main-content')).toHaveCount(1);
    } finally {
      release();
    }
  });
}
