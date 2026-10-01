import { expect, test } from './qa-test.js';

const controlsFor = (page) => [
  { area: 'hero', destination: '/contact/' },
  { area: 'closing', destination: '/case-studies/' },
  { area: 'closing-estimate', destination: '/contact/' },
  { area: page.viewportSize().width < 768 ? 'drawer' : 'header', destination: '/contact/' },
];

async function findControl(page, area, keyboard = false) {
  if (area === 'drawer') {
    const toggle = page.getByRole('button', { name: 'Toggle navigation menu' });
    if (keyboard) {
      await toggle.focus();
      await page.keyboard.press('Enter');
    } else {
      await toggle.click();
    }
    return page.getByRole('dialog').getByRole('link', { name: 'Request a Project Estimate', exact: true });
  }
  if (area === 'header') {
    return page.locator('header').getByRole('link', { name: 'Request Estimate', exact: true });
  }
  if (area === 'hero') {
    return page.locator('section[data-hero-motion]').getByRole('link', { name: 'Request a Project Estimate', exact: true });
  }
  return page.locator('#cta').getByRole('link', {
    name: area === 'closing-estimate' ? 'Request a Project Estimate' : 'View case studies',
    exact: true,
  });
}

async function expectBackgroundReleased(page) {
  for (const selector of ['header', '#main-content', '#site-footer', 'a[href="#main-content"]']) {
    await expect(page.locator(selector)).not.toHaveAttribute('inert', '');
    await expect(page.locator(selector)).not.toHaveAttribute('aria-hidden', 'true');
  }
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('cookie_consent_preferences', JSON.stringify({ necessary: true, analytics: false }));
  });
});

for (const [activation, clickOptions] of [
  ['modifier click', { modifiers: ['ControlOrMeta'] }],
  ['middle click', { button: 'middle' }],
]) {
  test(`${activation} opens native new tabs without routing or closing the source drawer`, async ({ page, context, browserName }) => {
    test.fail(process.platform === 'darwin' && browserName === 'webkit' && activation === 'middle click',
      'Playwright WebKit on macOS routes even a plain native anchor in the source tab on middle click; physical Safari remains unverified.');
    for (const { area, destination } of controlsFor(page)) {
      await test.step(area, async () => {
        await page.goto('/');
        const sourceURL = page.url();
        const link = await findControl(page, area);
        await expect(link).toHaveAttribute('href', destination);
        const newPage = context.waitForEvent('page', { timeout: 5_000 });
        await link.click(clickOptions);
        const opened = await newPage;
        await opened.waitForURL(new URL(destination, sourceURL).href);
        await expect(opened.locator('#main-content')).toBeVisible();
        expect(context.pages()).toHaveLength(2);
        await expect(page).toHaveURL(sourceURL);
        if (area === 'drawer') {
          await expect(page.getByRole('dialog')).toBeVisible();
          await expect(page.locator('#main-content')).toHaveAttribute('inert', '');
        }
        await opened.close();
        await page.bringToFront();
        if (area === 'drawer') {
          await page.keyboard.press('Escape');
          await expect(page.getByRole('dialog')).toHaveCount(0);
          await expectBackgroundReleased(page);
        }
      });
    }
  });
}

test('plain clicks and keyboard Enter client-route, focus main and restore drawer state', async ({ page, browserName }) => {
  for (const { area, destination } of controlsFor(page)) {
    for (const activation of ['click', 'Enter']) {
      await test.step(`${area}: ${activation}`, async () => {
        await page.goto('/');
        await page.evaluate(() => { window.__navigationCtaDocument = 'source'; });
        const link = await findControl(page, area, activation === 'Enter');
        await expect(link).toHaveAttribute('href', destination);
        if (activation === 'Enter') {
          await link.focus();
          // Safari needs Option+Tab for native links; the drawer owns its Tab sequence.
          await page.keyboard.press(browserName === 'webkit' && area !== 'drawer' ? 'Alt+Tab' : 'Tab');
          await page.keyboard.press(browserName === 'webkit' && area !== 'drawer' ? 'Alt+Shift+Tab' : 'Shift+Tab');
          await expect(link).toBeFocused();
          expect(await page.evaluate(() => document.hasFocus())).toBe(true);
          expect(await link.evaluate((element) => {
            const style = getComputedStyle(element);
            return element.matches(':focus-visible')
              && ((style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0)
                || style.boxShadow !== 'none');
          })).toBe(true);
          await page.keyboard.press('Enter');
        } else {
          await link.click();
        }
        await expect(page).toHaveURL(new RegExp(`${destination}$`));
        await expect(page.locator('#main-content')).toBeFocused();
        expect(await page.evaluate(() => window.__navigationCtaDocument)).toBe('source');
        await expect(page.getByRole('dialog')).toHaveCount(0);
        await expectBackgroundReleased(page);
        if (area === 'drawer') {
          await page.getByRole('button', { name: 'Toggle navigation menu' }).click();
          await expect(page.getByRole('dialog')).toBeVisible();
          await page.keyboard.press('Escape');
          await expect(page.getByRole('button', { name: 'Toggle navigation menu' })).toBeFocused();
          await expectBackgroundReleased(page);
        }
      });
    }
  }
});
