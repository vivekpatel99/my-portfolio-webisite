import { expect, test } from '@playwright/test';

const routes = [
  {
    path: '/',
    heading: /Vivek Patel\s+Computer Vision & AI Engineer/i,
  },
  {
    path: '/contact',
    heading: /Let's Build Your Computer Vision, Web Scraping & AI Projects/i,
  },
  {
    path: '/legal',
    heading: 'Privacy Policy',
  },
  {
    path: '/data-policy',
    heading: 'Cookie Policy',
  },
];

test.describe('preview routes', () => {
  for (const { path, heading } of routes) {
    test(`renders ${path}`, async ({ page }) => {
      await page.goto(path);

      await expect(page.locator('#main-content')).toBeVisible();
      await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
    });
  }
});

test.describe('custom cursor preferences', () => {
  test('does not mount the custom cursor when reduced motion is preferred', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    await expect
      .poll(() =>
        page.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
      )
      .toBe(true);
    await expect(page.locator('html')).not.toHaveClass(/custom-cursor-enabled/);
    await expect(
      page.locator('[class*="z-[9999]"][class*="pointer-events-none"]')
    ).toHaveCount(0);
  });
});
