import { expect, test } from '@playwright/test';

test.describe('navigation', () => {
  test('header hash nav scrolls to section on home', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.getByRole('banner').getByRole('link', { name: 'Services' }).click();
    await expect
      .poll(async () => {
        const box = await page.locator('#services').boundingBox();
        return box && box.y < 200;
      })
      .toBeTruthy();
    const top = await page.locator('#services').boundingBox();
    expect(top.y).toBeGreaterThanOrEqual(80);
  });

  test('cross-page hash nav from contact reaches services', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/contact');
    await page.getByRole('banner').getByRole('link', { name: 'Services' }).click();
    await expect(page).toHaveURL(/\/#services$/);
    await expect
      .poll(async () => {
        const box = await page.locator('#services').boundingBox();
        return box && box.y >= 80 && box.y < 180;
      }, { timeout: 5000 })
      .toBeTruthy();
  });

  test('repeated cross-page hash nav from contact reaches services', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    for (let i = 0; i < 2; i += 1) {
      await page.goto('/contact');
      await page.getByRole('banner').getByRole('link', { name: 'Services' }).click();
      await expect(page).toHaveURL(/\/#services$/);
      await expect
        .poll(async () => {
          const box = await page.locator('#services').boundingBox();
          return box && box.y >= 80 && box.y < 180;
        }, { timeout: 5000 })
        .toBeTruthy();
    }
  });

  test('mobile menu opens and navigates to contact', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Toggle navigation menu' }).click();
    await expect(page.getByRole('dialog', { name: 'Navigation menu' })).toBeVisible();
    await page.getByRole('dialog').getByRole('button', { name: /Hire Me/i }).click();
    await expect(page).toHaveURL(/\/contact/);
  });

  test('mobile menu closes on Escape and returns focus to toggle', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const toggle = page.getByRole('button', { name: 'Toggle navigation menu' });
    await toggle.click();
    await expect(page.getByRole('dialog', { name: 'Navigation menu' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Navigation menu' })).toBeHidden();
    await expect(toggle).toBeFocused();
  });

  test('mobile menu locks body scroll and keeps Tab inside dialog', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Toggle navigation menu' }).click();
    const dialog = page.getByRole('dialog', { name: 'Navigation menu' });
    await expect(dialog).toBeVisible();
    await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');

    for (let i = 0; i < 8; i += 1) {
      await page.keyboard.press('Tab');
      const isInsideDialog = await page.evaluate(() => {
        const dialogElement = document.querySelector('[role="dialog"][aria-label="Navigation menu"]');
        return dialogElement?.contains(document.activeElement) ?? false;
      });
      expect(isInsideDialog).toBe(true);
    }
  });

  test('portfolio cards open external links and project pages redirect home', async ({ page }) => {
    await page.goto('/');
    const popupPromise = page.waitForEvent('popup');
    await page.getByRole('button', { name: /View project: Automated Data Extraction/i }).click();
    const popup = await popupPromise;
    expect(popup.url()).toContain('upwork.com');
    await popup.close();

    await page.goto('/project/social-media-app');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText('Next-Gen Banking UI')).toHaveCount(0);
  });

  test('rendered routes expose one main landmark', async ({ page }) => {
    for (const route of ['/', '/contact', '/legal', '/data-policy']) {
      await page.goto(route);
      await expect(page.locator('main')).toHaveCount(1);
    }
  });

  test('legacy policy routes redirect to canonical pages', async ({ page }) => {
    await page.goto('/privacy-policy');
    await expect(page).toHaveURL(/\/legal$/);
    await page.goto('/cookie-policy');
    await expect(page).toHaveURL(/\/data-policy$/);
  });

  test('unknown route redirects home', async ({ page }) => {
    await page.goto('/nonexistent-page');
    await expect(page).toHaveURL(/\/$/);
  });
});
