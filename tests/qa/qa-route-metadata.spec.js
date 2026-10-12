import { expect, test } from './qa-test.js';

test('failed route metadata and keyboard recovery', async ({ page, browserName }, testInfo) => {
  await page.addInitScript(() => {
    localStorage.setItem('cookie_consent_preferences', JSON.stringify({ necessary: true, analytics: false }));
  });
  await page.goto('/');
  const homeTitle = await page.title();
  await page.route(/\/assets\/ContactRoute-[^/]+\.js(?:\?.*)?$/, (route) => route.abort('failed'));
  const contact = page.locator('#site-footer').getByRole('link', { name: 'Contact Me', exact: true });
  await contact.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/contact\/?$/);
  const fallback = page.locator('[data-route-error]');
  const heading = fallback.getByRole('heading', { name: "This page didn't load", exact: true });
  await expect(heading).toBeFocused();
  await page.evaluate(() => document.fonts.ready);
  const geometry = await fallback.evaluate((section) => {
    const box = (element) => {
      const rect = element.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    };
    return {
      section: box(section),
      elements: [...section.querySelectorAll('h1,p,button,a')].map((element) => ({
        text: element.textContent,
        rect: box(element),
        color: getComputedStyle(element).color,
        fontSize: getComputedStyle(element).fontSize,
      })),
      overflow: document.documentElement.scrollWidth > innerWidth,
    };
  });
  await testInfo.attach('geometry', { body: JSON.stringify(geometry), contentType: 'application/json' });
  await testInfo.attach('fallback', { body: await fallback.screenshot(), contentType: 'image/png' });
  expect(geometry.overflow).toBe(false);
  await expect(page).toHaveTitle('Page unavailable | Vivek Patel');
  const robots = page.locator('meta[name="robots"]');
  await expect(robots).toHaveCount(1);
  await expect(robots).toHaveAttribute('content', 'noindex, nofollow');
  const tabKey = browserName === 'webkit' ? 'Alt+Tab' : 'Tab';
  await page.keyboard.press(tabKey);
  await expect(fallback.getByRole('button', { name: 'Retry', exact: true })).toBeFocused();
  await page.keyboard.press(tabKey);
  await expect(fallback.getByRole('link', { name: 'Back to Home', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/$/);
  await expect(fallback).toHaveCount(0);
  await expect(page).toHaveTitle(homeTitle);
  await expect(robots).toHaveCount(1);
  await expect(robots).toHaveAttribute('content', 'index, follow');
  await expect(page.locator('#main-content')).toBeFocused();
  await page.locator('#site-footer').getByRole('link', { name: 'Privacy Policy', exact: true }).click();
  await expect(page).toHaveTitle('Privacy Policy | Vivek Patel');
  await expect(robots).toHaveCount(1);
  await expect(robots).toHaveAttribute('content', 'index, follow');
});
