import { expect, test } from '@playwright/test';

const routes = [
  { path: '/', heading: /Vivek Patel/i },
  { path: '/contact', heading: /Let's Build Your/i },
  { path: '/legal', heading: 'Privacy Policy' },
  { path: '/data-policy', heading: 'Cookie Policy' },
  { path: '/project/social-media-app', heading: /social media/i },
];

test.describe('Route rendering', () => {
  for (const { path, heading } of routes) {
    test(`renders ${path}`, async ({ page }) => {
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(path);
      await expect(page.locator('#main-content')).toBeVisible();
      await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible();
      expect(errors).toEqual([]);
    });
  }
});

test('unknown route redirects to home', async ({ page }) => {
  await page.goto('/foo-bar-baz');
  await expect(page).toHaveURL(/\/$/);
});

test('invalid project shows toast and redirects', async ({ page }) => {
  await page.goto('/project/nonexistent-slug');
  await expect(page.getByText(/could not be found|not found/i)).toBeVisible({ timeout: 8000 });
  await expect(page).toHaveURL(/\/$/, { timeout: 10000 });
});

test('header hash nav on same page scrolls to section', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await page.getByRole('link', { name: 'Services', exact: true }).click();
  await expect
    .poll(async () => {
      const el = page.locator('#services');
      const box = await el.boundingBox();
      return box && box.y >= -100 && box.y < 200;
    })
    .toBeTruthy();
});

test('header hash nav from contact page lands on services', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/contact');
  await page.getByRole('link', { name: 'Services', exact: true }).click();
  await expect(page).toHaveURL(/\/(#services)?$/);
  await expect
    .poll(async () => {
      const el = page.locator('#services');
      const box = await el.boundingBox();
      return box && box.y < 300;
    }, { timeout: 5000 })
    .toBeTruthy();
});

test('Hire Me CTA navigates to contact', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await page.getByRole('button', { name: /Hire Me/i }).click();
  await expect(page).toHaveURL(/\/contact/);
});

test('portfolio cards open external links', async ({ page, context }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/#portfolio');
  await page.locator('#portfolio').scrollIntoViewIfNeeded();
  const popupPromise = context.waitForEvent('page');
  await page.getByRole('button', { name: /View project: Automated Data Extraction/i }).click();
  const popup = await popupPromise;
  expect(popup.url()).toMatch(/upwork\.com|github\.com/);
  await popup.close();
});

test('back navigation restores contact page', async ({ page }) => {
  await page.goto('/');
  await page.goto('/contact');
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
});

test('lazy route shows content after load', async ({ page }) => {
  await page.goto('/contact');
  await expect(page.getByLabel('Full Name *')).toBeVisible();
});
