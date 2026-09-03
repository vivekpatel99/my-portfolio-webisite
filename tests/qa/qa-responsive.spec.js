import { expect, test } from '@playwright/test';

const viewports = [
  { name: 'narrow-phone', width: 320, height: 568 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'below-sm', width: 639, height: 800 },
  { name: 'sm', width: 640, height: 800 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 720 },
  { name: 'wide', width: 1920, height: 1080 },
];

for (const vp of viewports) {
  test(`home layout at ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto('/');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
    await expect(page.locator('#main-content')).toBeVisible();
  });
}

test('mobile menu opens and closes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Toggle navigation menu' }).click();
  await expect(page.getByRole('dialog', { name: 'Navigation menu' })).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Navigation menu' }).getByRole('link', { name: 'Services' })).toBeVisible();
  await page.getByRole('button', { name: 'Close navigation menu' }).click();
  await expect(page.getByRole('dialog', { name: 'Navigation menu' })).toBeHidden();
});

test('mobile menu CTA navigates to contact', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Toggle navigation menu' }).click();
  await page.getByRole('dialog', { name: 'Navigation menu' }).getByRole('button', { name: /Request a Project Estimate/i }).click();
  await expect(page).toHaveURL(/\/contact/);
});

test('desktop shows nav links, mobile shows hamburger', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await expect(page.getByRole('navigation').getByRole('link', { name: 'Services', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Toggle navigation menu' })).toBeHidden();

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('button', { name: 'Toggle navigation menu' })).toBeVisible();
});

test('custom cursor disabled on touch emulation', async ({ page }) => {
  await page.addInitScript(() => {
    const nativeMatchMedia = window.matchMedia.bind(window);
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query) => {
        if (query.includes('pointer: fine')) {
          return {
            matches: false,
            media: query,
            addEventListener: () => {},
            removeEventListener: () => {},
          };
        }
        if (query.includes('pointer: coarse')) {
          return {
            matches: true,
            media: query,
            addEventListener: () => {},
            removeEventListener: () => {},
          };
        }
        return nativeMatchMedia(query);
      },
    });
  });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await expect(page.locator('html')).not.toHaveClass(/custom-cursor-enabled/);
});

test('skip link is focusable at 200% zoom', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 800 });
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skipLink = page.getByRole('link', { name: 'Skip to main content' });
  await expect(skipLink).toBeFocused();
});

const boxesOverlap = (a, b) =>
  !(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y);

test('mobile cookie banner leaves the hero estimate CTA clickable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.removeItem('cookie_consent_preferences'));
  await page.goto('/');
  const banner = page.getByRole('dialog', { name: /we value your privacy/i });
  await expect(banner).toBeVisible({ timeout: 5000 });
  const cta = page.getByRole('button', { name: /Request a Project Estimate/i }).first();
  const bannerBox = await banner.boundingBox();
  const ctaBox = await cta.boundingBox();
  expect(bannerBox).toBeTruthy();
  expect(ctaBox).toBeTruthy();
  expect(boxesOverlap(bannerBox, ctaBox)).toBe(false);
  await cta.click();
  await expect(page).toHaveURL(/\/contact/);
});

test('desktop cookie banner stays a bounded corner card', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.addInitScript(() => localStorage.removeItem('cookie_consent_preferences'));
  await page.goto('/');
  const banner = page.getByRole('dialog', { name: /we value your privacy/i });
  await expect(banner).toBeVisible({ timeout: 5000 });
  const box = await banner.boundingBox();
  expect(box.width).toBeLessThan(560);
  expect(box.x + box.width).toBeGreaterThan(1280 - 560);
});

test('expanded cookie settings stay reachable on a short phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.addInitScript(() => localStorage.removeItem('cookie_consent_preferences'));
  await page.goto('/');
  await expect(page.getByRole('button', { name: /Customize/i })).toBeVisible({ timeout: 5000 });
  await page.getByRole('button', { name: /Customize/i }).click();
  await expect(page.getByRole('button', { name: /Save Preferences/i })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(overflow).toBe(false);
});

test('reduced motion still shows a safe cookie banner layout', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => localStorage.removeItem('cookie_consent_preferences'));
  await page.goto('/');
  const banner = page.getByRole('dialog', { name: /we value your privacy/i });
  await expect(banner).toBeVisible({ timeout: 5000 });
  const cta = page.getByRole('button', { name: /Request a Project Estimate/i }).first();
  const bannerBox = await banner.boundingBox();
  const ctaBox = await cta.boundingBox();
  expect(boxesOverlap(bannerBox, ctaBox)).toBe(false);
});
