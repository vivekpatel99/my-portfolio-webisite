import { expect, test } from './qa-test.js';

const cursorDot = (page) => page.locator('[data-custom-cursor]');
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
  await expect(cursorDot(page)).toHaveCount(1);
  await page.mouse.move(400, 400);
  await expect(html(page)).toHaveClass(/custom-cursor-enabled/);
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.body).cursor)).toBe('none');
};

const pointInside = (locator) => locator.evaluate((element) => {
  const bounds = element.getBoundingClientRect();
  return { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 };
});

const expectCursorOver = async (page, point, surfaceSelector) => {
  await page.mouse.move(point.x, point.y);
  await expect.poll(() => page.evaluate(({ expectedPoint, expectedSurface }) => {
    const cursor = document.querySelector('[data-custom-cursor]');
    const overlay = document.querySelector('.case-gallery-overlay');
    const surface = document.elementFromPoint(expectedPoint.x, expectedPoint.y);
    if (!cursor || !surface?.closest(expectedSurface)) return false;

    const cursorBounds = cursor.getBoundingClientRect();
    const cursorStyle = getComputedStyle(cursor);
    const overlayStyle = overlay ? getComputedStyle(overlay) : null;
    const inertAncestors = [];
    for (let ancestor = cursor.parentElement; ancestor; ancestor = ancestor.parentElement) {
      if (ancestor.inert) inertAncestors.push(ancestor);
    }
    const previousPointerEvents = cursor.style.pointerEvents;
    let cursorIsPaintedOnTop = false;
    try {
      inertAncestors.forEach((ancestor) => { ancestor.inert = false; });
      cursor.style.pointerEvents = 'auto';
      cursorIsPaintedOnTop = document.elementsFromPoint(expectedPoint.x, expectedPoint.y)[0] === cursor;
    } finally {
      cursor.style.pointerEvents = previousPointerEvents;
      inertAncestors.forEach((ancestor) => { ancestor.inert = true; });
    }

    return cursorStyle.visibility === 'visible'
      && Math.abs(cursorBounds.left + cursorBounds.width / 2 - expectedPoint.x) < 1
      && Math.abs(cursorBounds.top + cursorBounds.height / 2 - expectedPoint.y) < 1
      && (!overlayStyle || Number(cursorStyle.zIndex) > Number(overlayStyle.zIndex))
      && cursorIsPaintedOnTop;
  }, { expectedPoint: point, expectedSurface: surfaceSelector })).toBe(true);
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

test('keeps the native cursor before movement and centers the dot on the first move', async ({ page }, testInfo) => {
  skipUnlessDesktop(testInfo);
  await page.goto('/');
  await expect(cursorDot(page)).toHaveCount(1);
  await expect(cursorDot(page)).toHaveCSS('visibility', 'hidden');
  await expect(html(page)).not.toHaveClass(/custom-cursor-enabled/);
  await expectNativeCursor(page);

  await expectCursorOver(page, { x: 317, y: 263 }, 'body');
  await expect(html(page)).toHaveClass(/custom-cursor-enabled/);
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.body).cursor)).toBe('none');
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

test('keeps the custom dot visible over the case-study lightbox', async ({ page }, testInfo) => {
  skipUnlessDesktop(testInfo);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/project/ai-invoice-processing-automation/');
  await page.locator('.case-gallery-open').click();

  const overlay = page.locator('.case-gallery-overlay');
  const dialog = page.getByRole('dialog', { name: 'Enlarged case study images' });
  const image = dialog.locator('.case-gallery-viewport img');
  const viewport = dialog.locator('.case-gallery-viewport');
  const zoomIn = dialog.getByRole('button', { name: 'Zoom in' });
  await expect(overlay).toBeVisible();
  await expect(image).toBeVisible();

  await expectCursorOver(page, await pointInside(image), '.case-gallery-viewport img');
  await expectCursorOver(page, { x: 12, y: 400 }, '.case-gallery-overlay');
  await expectCursorOver(page, await pointInside(zoomIn), 'button[aria-label="Zoom in"]');
  await zoomIn.click();
  await expect(viewport.locator('img')).toHaveAttribute('style', /width: 150%/);
  await expectCursorOver(page, await pointInside(viewport), '.case-gallery-viewport');
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
