import { expect, test } from './qa-test.js';

const cursorDot = (page) => page.locator('div.fixed.rounded-full.pointer-events-none.z-\\[9999\\]');
const html = (page) => page.locator('html');

const nativeCursors = (page) => page.evaluate(() => {
  const link = Object.assign(document.createElement('a'), { href: '#cursor-probe', textContent: 'probe' });
  const button = Object.assign(document.createElement('button'), { type: 'button', textContent: 'probe' });
  document.body.append(link, button);
  const cursors = [document.documentElement, document.body, link, button].map((element) => getComputedStyle(element).cursor);
  link.remove();
  button.remove();
  return cursors;
});

const expectNativeCursor = async (page) => {
  await expect.poll(() => nativeCursors(page)).not.toContain('none');
};

const expectCustomCursor = async (page) => {
  await page.mouse.move(400, 400);
  await expect(html(page)).toHaveClass(/custom-cursor-enabled/);
  await expect(cursorDot(page)).toHaveCount(1);
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.body).cursor)).toBe('none');
};

const skipUnlessDesktop = (testInfo) => {
  test.skip(testInfo.project.name.includes('mobile'), 'Fine-pointer behavior is covered by the desktop project.');
};

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('keeps the native cursor', async ({ page }) => {
    await page.goto('/');
    await expect(html(page)).not.toHaveClass(/custom-cursor-enabled/);
    await expectNativeCursor(page);
  });
});

test('keeps the native cursor when entry scripts are blocked', async ({ page }) => {
  await page.route('**/*', (route) => (
    route.request().resourceType() === 'script' ? route.abort() : route.fallback()
  ));
  await page.goto('/');
  await expect(html(page)).not.toHaveClass(/custom-cursor-enabled/);
  await expectNativeCursor(page);
});

test('keeps the native cursor until the custom cursor is enabled', async ({ page }, testInfo) => {
  skipUnlessDesktop(testInfo);
  let releaseScripts;
  const scriptsReleased = new Promise((resolve) => { releaseScripts = resolve; });
  await page.route('**/*', async (route) => {
    if (route.request().resourceType() === 'script') await scriptsReleased;
    await route.fallback();
  });
  await page.goto('/', { waitUntil: 'commit' });
  await page.waitForFunction(() => [...document.styleSheets].some((sheet) => sheet.href?.includes('/assets/')));
  await expect(html(page)).not.toHaveClass(/custom-cursor-enabled/);
  await expectNativeCursor(page);
  releaseScripts();
  await expectCustomCursor(page);
});

test('fine pointer renders the dot and hides the native cursor', async ({ page }, testInfo) => {
  skipUnlessDesktop(testInfo);
  await page.goto('/');
  await expectCustomCursor(page);
  await expect.poll(() => cursorDot(page).evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      width: style.width, height: style.height, backgroundColor: style.backgroundColor, mixBlendMode: style.mixBlendMode,
    };
  })).toEqual({
    width: '16px', height: '16px', backgroundColor: 'rgb(147, 114, 255)', mixBlendMode: 'difference',
  });
  expect(await nativeCursors(page)).toEqual(['none', 'none', 'none', 'none']);
});

test('reduced motion restores and releases the native cursor', async ({ page }, testInfo) => {
  skipUnlessDesktop(testInfo);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await expectCustomCursor(page);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(html(page)).not.toHaveClass(/custom-cursor-enabled/);
  await expect(cursorDot(page)).toHaveCount(0);
  await expectNativeCursor(page);

  await page.evaluate(() => document.documentElement.classList.add('custom-cursor-enabled'));
  expect(await nativeCursors(page)).not.toContain('none');
  await page.evaluate(() => document.documentElement.classList.remove('custom-cursor-enabled'));

  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expectCustomCursor(page);
});

test('coarse pointer keeps the native cursor', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'), 'Coarse-pointer behavior is covered by the mobile project.');
  await page.goto('/');
  expect(await page.evaluate(() => matchMedia('(pointer: coarse)').matches)).toBe(true);
  await expect(html(page)).not.toHaveClass(/custom-cursor-enabled/);
  await expect(cursorDot(page)).toHaveCount(0);
  await expectNativeCursor(page);
});
