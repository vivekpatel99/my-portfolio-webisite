import { expect, test } from '@playwright/test';

test('home has exactly one main landmark', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('main')).toHaveCount(1);
});

test('project page uses a single main landmark', async ({ page }) => {
  await page.goto('/project/social-media-app');
  await expect(page.locator('main')).toHaveCount(1);
});

test('contact social icon links have accessible names', async ({ page }) => {
  await page.goto('/contact');
  const links = page.locator('a[href*="linkedin"], a[href*="github"]').filter({
    has: page.locator('svg'),
  });
  const count = await links.count();
  for (let i = 0; i < count; i++) {
    const link = links.nth(i);
    const ariaLabel = await link.getAttribute('aria-label');
    const text = await link.textContent();
    if (!text?.trim()) {
      expect(ariaLabel, `Icon link ${i} should have aria-label`).toBeTruthy();
    }
  }
});

test('mobile menu closes on Escape', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Toggle navigation menu' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('reduced motion disables custom cursor', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('html')).not.toHaveClass(/custom-cursor-enabled/);
});

test('form inputs have associated labels', async ({ page }) => {
  await page.goto('/contact');
  for (const id of ['name', 'email', 'description']) {
    const label = page.locator(`label[for="${id}"]`);
    await expect(label).toBeVisible();
  }
});

test('services section exists for anchor target', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#services')).toBeAttached();
  await expect(page.locator('#about')).toBeAttached();
  await expect(page.locator('#portfolio')).toBeAttached();
  await expect(page.locator('#testimonials')).toBeAttached();
});

test('section anchors include scroll-margin-top for fixed header navigation', async ({ page }) => {
  await page.goto('/');
  for (const id of ['services', 'about', 'portfolio', 'testimonials']) {
    const margin = await page.locator(`#${id}`).evaluate((el) =>
      getComputedStyle(el).scrollMarginTop
    );
    expect(margin === '0px' || margin === '', `#${id} scroll-margin-top is ${margin}`).toBeFalsy();
  }
});
