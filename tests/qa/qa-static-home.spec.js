import { expect, test } from './qa-test.js';
import { featuredCaseStudies } from '../../src/data/caseStudies.js';
import { serviceOffers, serviceRouteForId } from '../../src/data/serviceOffers.js';
import { HOURLY_RATE_LABEL } from '../../src/config/pricing.js';

test.skip(process.env.QA_LOCAL_ONLY !== '1', 'Homepage build acceptance runs only on a loopback preview.');

const introduction = 'I build detectors, document extractors, and n8n workflows that turn camera feeds and messy files into reliable production data.';

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
