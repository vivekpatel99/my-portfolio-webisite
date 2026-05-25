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

  test('public routes expose canonical share metadata', async ({ page }) => {
    for (const { path } of routes) {
      await page.goto(path);
      const images = await page.evaluate(() => ({
        og: Array.from(document.querySelectorAll('meta[property="og:image"]')).map((meta) =>
          meta.getAttribute('content')
        ),
        twitter: Array.from(document.querySelectorAll('meta[name="twitter:image"]')).map((meta) =>
          meta.getAttribute('content')
        ),
      }));
      expect(images.og.length).toBeGreaterThan(0);
      expect(images.twitter.length).toBeGreaterThan(0);
      expect(images.og.every((value) => value === 'https://www.vivekapatel.com/og-image.png')).toBe(
        true
      );
      expect(
        images.twitter.every((value) => value === 'https://www.vivekapatel.com/og-image.png')
      ).toBe(true);
    }
  });
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

  test('preserves native cursor for text fields and role button targets', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.locator('html')).toHaveClass(/custom-cursor-enabled/);
    await expect(page.getByLabel('Full Name *')).toHaveCSS('cursor', 'text');
    await page.goto('/');
    await expect(
      page.getByRole('button', { name: /View project: Automated Data Extraction/i })
    ).toHaveCSS('cursor', 'none');
  });
});

test.describe('motion preferences', () => {
  test('reduced motion renders static ticker and hero background', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.getByText('11+')).toBeVisible();
    await expect(page.locator('[data-testid="hero-background"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="hero-background-layer"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="hero-scroll-indicator"]')).toHaveCount(0);
  });

  test('testimonial marquee pauses when keyboard focus enters it', async ({ page }) => {
    await page.goto('/');
    await page.locator('#testimonials').scrollIntoViewIfNeeded();
    const firstCard = page.locator('.testimonial-card-link').first();
    await firstCard.focus();
    await expect(page.locator('.scroller-inner')).toHaveCSS('animation-play-state', 'paused');
  });
});
