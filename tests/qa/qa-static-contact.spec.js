import { expect, test } from './qa-test.js';
import { socialLinks } from '../../src/config/links.js';

test.skip(process.env.QA_LOCAL_ONLY !== '1', 'Static contact acceptance requires a loopback build preview.');

const headingName = 'REQUEST A PROJECT ESTIMATE';
const fallbackNotice = 'The project request form needs JavaScript.';
const destinations = [
  ['Connect with Vivek Patel on Upwork', socialLinks.upwork],
  ['Connect with Vivek Patel on Freelancer.com', socialLinks.freelancer],
  ['Connect with Vivek Patel on FreelancerMap', socialLinks.freelancerMap],
  ['Connect with Vivek Patel on Email', socialLinks.emailHref],
  ['LinkedIn profile', socialLinks.linkedin],
  ['GitHub profile', socialLinks.github],
];

async function expectReadableContact(page) {
  const heading = page.getByRole('heading', { level: 1, name: headingName, exact: true });
  await expect(heading).toHaveCount(1);
  await expect(heading).toBeVisible();
  await expect(page.getByRole('heading', { name: 'WHAT HAPPENS NEXT', exact: true })).toBeVisible();
  await expect(page.getByText('You receive a suggested scope, timeline, and first milestone.', { exact: false })).toBeVisible();
  await expect(page.getByRole('link', { name: socialLinks.contactEmail, exact: true })).toHaveAttribute('href', socialLinks.emailHref);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const box = await heading.boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(await page.evaluate(() => innerWidth));
}

test.describe('contact without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  for (const width of [1440, 390, 320]) {
    test(`static contact provides keyboard destinations at ${width}px`, async ({ page, request, context, browserName }) => {
      await page.setViewportSize({ width, height: 900 });
      const response = await request.get('/contact/');
      expect(response.status()).toBe(200);
      const html = await response.text();
      expect(html).toMatch(/<h1\b[^>]*>REQUEST A/);
      expect(html).toContain(`href="${socialLinks.emailHref}"`);
      expect(html).toContain(fallbackNotice);
      expect(html).not.toMatch(/<(?:form|input|textarea)\b/);
      await page.goto('/contact/');
      await expectReadableContact(page);
      await expect(page.getByText(fallbackNotice, { exact: false })).toBeVisible();
      await expect(page.locator('form, input, textarea, button[type="submit"]')).toHaveCount(0);

      const email = page.getByRole('link', { name: socialLinks.contactEmail, exact: true });
      await email.focus();
      await expect(email).toBeFocused();
      const tabKey = browserName === 'webkit' ? 'Alt+Tab' : 'Tab';
      for (const [name, href] of destinations) {
        const link = page.getByRole('link', { name, exact: true });
        await page.keyboard.press(tabKey);
        await expect(link).toBeFocused();
        await expect(link).toHaveAttribute('href', href);
        await expect(link).not.toHaveCSS('outline-style', 'none');
        const bounds = await link.boundingBox();
        expect(bounds.x).toBeGreaterThanOrEqual(0);
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
      }

      // Exercise native platform navigation against local synthetic responses.
      // No real profile request or contact message leaves the browser.
      for (const [name, href] of destinations.filter(([, href]) => href.startsWith('https:'))) {
        await context.route(href, (route) => route.fulfill({ contentType: 'text/html', body: '<title>Synthetic contact destination</title>' }));
        await page.getByRole('link', { name, exact: true }).focus();
        const popupPromise = context.waitForEvent('page');
        await page.keyboard.press('Enter');
        const popup = await popupPromise;
        await expect(popup).toHaveURL(href);
        await popup.close();
      }
      await expect(page).toHaveURL(/\/contact\/$/);
    });
  }
});

for (const width of [1440, 390, 320]) {
  test(`JavaScript replaces the contact fallback with one primary form at ${width}px`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/contact/');
    await expect(page.getByLabel('Full Name *')).toBeVisible();
    await expectReadableContact(page);
    await expect(page.locator('form')).toHaveCount(1);
    await expect(page.getByText(fallbackNotice, { exact: false })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Send project request', exact: true })).toBeEnabled();
    expect(errors).toEqual([]);
  });
}

test('contact stays usable when the application script cannot load', async ({ page }) => {
  await page.route(/\/assets\/index-[^/]+\.js(?:\?.*)?$/, (route) => route.abort());
  await page.goto('/contact/');
  await expectReadableContact(page);
  await expect(page.getByText(fallbackNotice, { exact: false })).toBeVisible();
  await expect(page.locator('form')).toHaveCount(0);
});

test('delayed application entry replaces the fallback without duplicating contact content', async ({ page }) => {
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  await page.route(/\/assets\/index-[^/]+\.js(?:\?.*)?$/, async (route) => {
    await gate;
    await route.fallback();
  });
  try {
    await page.goto('/contact/', { waitUntil: 'commit' });
    await expectReadableContact(page);
    await expect(page.getByText(fallbackNotice, { exact: false })).toBeVisible();
    await expect(page.locator('form')).toHaveCount(0);
    release();
    await expect(page.getByLabel('Full Name *')).toBeVisible();
    await expectReadableContact(page);
    await expect(page.locator('form')).toHaveCount(1);
    await expect(page.getByText(fallbackNotice, { exact: false })).toHaveCount(0);
  } finally {
    release();
  }
});
