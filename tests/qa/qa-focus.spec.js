import { expect, test } from './qa-test.js';

const clearFocusToBody = (page) => page.evaluate(() => document.activeElement?.blur());

test.describe('keyboard focus regressions', () => {
  test('pointer-open mobile menu wraps focus and restores the toggle on Escape', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 600 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const scrollTarget = await page.evaluate(() => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      return Math.min(300, Math.max(150, Math.floor(maxScroll * 0.5)));
    });
    
    await page.evaluate((target) => window.scrollTo({ top: target, behavior: 'instant' }), scrollTarget);
    await expect.poll(() => page.evaluate(() => window.scrollY), { 
      intervals: [50, 100, 100, 100, 200],
      timeout: 3000 
    }).toBeGreaterThan(0);
    const previousScrollY = await page.evaluate(() => window.scrollY);

    const toggle = page.getByRole('button', { name: 'Toggle navigation menu' });
    await toggle.click();
    const menu = page.getByRole('dialog', { name: 'Navigation menu' });
    await expect(menu).toBeVisible();
    await expect(page.getByRole('button', { name: 'Close navigation menu' })).toBeFocused();
    await expect(page.locator('#main-content')).toHaveAttribute('inert', '');
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(previousScrollY);

    const focusables = menu.locator('a[href], button');
    await expect.poll(() => focusables.evaluateAll((elements) => elements.map((element) => (
      element.getAttribute('aria-label') || element.querySelector('img')?.alt || element.textContent.trim()
    )))).toEqual([
      'Vivek Patel Logo', 'Close navigation menu', 'Services', 'About', 'Case Studies',
      'Testimonials', 'Request a Project Estimate',
    ]);

    // Traverse the complete sequence in both directions, including links that
    // WebKit may skip during its native keyboard navigation.
    await page.keyboard.press('Shift+Tab');
    await expect(focusables.nth(0)).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(focusables.nth(6)).toBeFocused();
    for (const index of [5, 4, 3, 2, 1, 0]) {
      await page.keyboard.press('Shift+Tab');
      await expect(focusables.nth(index)).toBeFocused();
    }
    for (const index of [1, 2, 3, 4, 5, 6, 0]) {
      await page.keyboard.press('Tab');
      await expect(focusables.nth(index)).toBeFocused();
    }
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Close navigation menu' })).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(toggle).toBeFocused();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(previousScrollY);
    await expect(page.locator('#main-content')).not.toHaveAttribute('inert', '');
  });

  test('mobile menu navigation closes cleanly and keeps route navigation working', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const toggle = page.getByRole('button', { name: 'Toggle navigation menu' });
    await toggle.click();
    await page.getByRole('dialog', { name: 'Navigation menu' }).getByRole('link', { name: 'Case Studies' }).click();

    await expect(page).toHaveURL(/\/case-studies\/?$/);
    await expect(page.getByRole('heading', { name: /Selected Case Studies/i })).toBeVisible();
    await expect(page.getByRole('dialog', { name: 'Navigation menu' })).toBeHidden();
    await expect(page.locator('#main-content')).not.toHaveAttribute('inert', '');
    await expect(toggle).toBeFocused();
  });

  test('pointer gallery controls still close with Escape and restore their opener', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/project/invoice-ocr-extraction/');

    const gallery = page.getByRole('region', { name: 'Case study images' });
    const opener = gallery.locator('.case-gallery-open');
    const dialog = page.getByRole('dialog', { name: 'Enlarged case study images' });

    for (const control of ['zoom', 'arrow', 'thumbnail']) {
      await opener.click();
      await expect(dialog).toBeVisible();
      await expect(page.locator('#root')).toHaveAttribute('inert', '');

      if (control === 'zoom') await dialog.getByRole('button', { name: 'Zoom in' }).click();
      if (control === 'arrow') await dialog.getByRole('button', { name: 'Next image' }).click();
      if (control === 'thumbnail') await dialog.locator('.case-gallery-thumbnail').nth(1).click();

      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();
      await expect(opener).toBeFocused();
      await expect(gallery).not.toHaveAttribute('inert', '');
      await expect(page.locator('#root')).not.toHaveAttribute('inert', '');
      await expect.poll(() => page.evaluate(() => [document.body.style.overflow, document.documentElement.style.overflow]))
        .toEqual(['', '']);
    }
  });

  test('gallery Escape still closes when pointer interaction leaves focus on BODY', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/project/invoice-ocr-extraction/');

    const gallery = page.getByRole('region', { name: 'Case study images' });
    const opener = gallery.locator('.case-gallery-open');
    const dialog = page.getByRole('dialog', { name: 'Enlarged case study images' });
    await opener.click();
    await dialog.getByRole('button', { name: 'Zoom in' }).click();

    // Recover both traversal directions if a pointer update leaves focus on BODY.
    await clearFocusToBody(page);
    await page.keyboard.press('Tab');
    await expect(dialog.getByRole('button', { name: 'Close enlarged image' })).toBeFocused();
    await clearFocusToBody(page);
    await page.keyboard.press('Shift+Tab');
    await expect(dialog.getByRole('button', { name: /^Show image 2:/ })).toBeFocused();

    // This is the WebKit gallery state documented under issue #77.
    await clearFocusToBody(page);
    await expect.poll(() => page.evaluate(() => document.activeElement?.tagName)).toBe('BODY');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
    await expect(page.locator('#root')).not.toHaveAttribute('inert', '');
  });
});
