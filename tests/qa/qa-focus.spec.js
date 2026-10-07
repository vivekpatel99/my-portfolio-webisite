import { expect, test } from './qa-test.js';

const clearFocusToBody = (page) => page.evaluate(() => document.activeElement?.blur());

// Issue #234: every mobile-drawer action must stay reachable in short viewports.
const MENU_ACTIONS = [
  'Vivek Patel home', 'Close navigation menu', 'Services', 'About', 'Case Studies',
  'Testimonials', 'Request a Project Estimate',
];
const DRAWER_VIEWPORTS = [
  { width: 568, height: 256 },
  { width: 320, height: 256 },
  { width: 320, height: 200 },
  { width: 320, height: 320 },
  { width: 390, height: 844 },
];
const DRAWER_CASES = [
  // The drawer is shared by every route; home gets the full matrix and one
  // non-home route covers the two shortest failing shapes.
  ...DRAWER_VIEWPORTS.flatMap((viewport) => ['no-preference', 'reduce'].map((motion) => ({ route: '/', viewport, motion }))),
  ...[DRAWER_VIEWPORTS[0], DRAWER_VIEWPORTS[2]].flatMap((viewport) => ['no-preference', 'reduce'].map((motion) => ({ route: '/case-studies/', viewport, motion }))),
];
const RECT_TOLERANCE = 0.5;

const useNecessaryOnlyConsent = (page) => page.addInitScript(() => {
  localStorage.setItem('cookie_consent_preferences', JSON.stringify({ necessary: true, analytics: false }));
});

const backgroundLandmarks = (page) => [
  page.locator('header'),
  page.locator('#main-content'),
  page.locator('#site-footer'),
  page.locator('a[href="#main-content"]'),
];

// Measures what a user can actually see and hit: the element box must sit
// inside the viewport and every clipping ancestor, and hit tests along its
// vertical centre line must land on the element itself (not on the drawer
// header or anything else painted above it).
const readDrawerActionVisibility = (locator) => locator.evaluate((element, tolerance) => {
  const rect = element.getBoundingClientRect();
  const clip = { top: 0, left: 0, bottom: window.innerHeight, right: window.innerWidth };
  for (let ancestor = element.parentElement; ancestor && ancestor !== document.documentElement; ancestor = ancestor.parentElement) {
    const style = window.getComputedStyle(ancestor);
    if (style.overflowX === 'visible' && style.overflowY === 'visible') continue;
    const box = ancestor.getBoundingClientRect();
    clip.top = Math.max(clip.top, box.top + ancestor.clientTop);
    clip.left = Math.max(clip.left, box.left + ancestor.clientLeft);
    clip.bottom = Math.min(clip.bottom, box.top + ancestor.clientTop + ancestor.clientHeight);
    clip.right = Math.min(clip.right, box.left + ancestor.clientLeft + ancestor.clientWidth);
  }
  const fullyVisible = rect.width > 0 && rect.height > 0
    && rect.top >= clip.top - tolerance
    && rect.bottom <= clip.bottom + tolerance
    && rect.left >= clip.left - tolerance
    && rect.right <= clip.right + tolerance;
  const centreX = rect.left + rect.width / 2;
  const probeYs = [rect.top + 1, rect.top + rect.height / 2, rect.bottom - 1];
  const hitsSelf = fullyVisible && probeYs.every((y) => {
    const hit = document.elementFromPoint(centreX, y);
    return Boolean(hit) && (hit === element || element.contains(hit));
  });
  const round = (value) => Math.round(value * 100) / 100;
  return {
    fullyVisible,
    hitsSelf,
    rect: { top: round(rect.top), bottom: round(rect.bottom), left: round(rect.left), right: round(rect.right) },
    clip: { top: round(clip.top), bottom: round(clip.bottom), left: round(clip.left), right: round(clip.right) },
  };
}, RECT_TOLERANCE);

const expectDrawerActionVisible = (locator, label) => expect.poll(
  () => readDrawerActionVisibility(locator),
  { message: `${label} should be fully visible and hittable`, intervals: [50, 100, 200, 400], timeout: 3000 },
).toMatchObject({ fullyVisible: true, hitsSelf: true });

// Short drawers overflow, so a native wheel over the drawer must scroll it and
// reveal the CTA. focus() and scrollIntoView() also scroll overflow:hidden
// containers; real wheel input proves user-scrollability where Playwright
// supports it (non-mobile contexts only).
const SHORT_DRAWER_MAX_HEIGHT = 256;
const wheelDrawerToCta = async (page, menu, cta) => {
  await menu.evaluate((element) => { element.scrollTop = 0; });
  const menuBox = await menu.boundingBox();
  // Left padding at mid-height: inside the drawer, away from a right-edge scrollbar.
  await page.mouse.move(menuBox.x + 10, menuBox.y + menuBox.height / 2);
  await page.mouse.wheel(0, 400);
  await expect.poll(
    async () => ({
      scrolled: await menu.evaluate((element) => element.scrollTop > 0),
      ...(await readDrawerActionVisibility(cta)),
    }),
    { message: 'wheel should scroll the drawer until the CTA is fully visible and hittable', intervals: [50, 100, 200, 400], timeout: 3000 },
  ).toMatchObject({ scrolled: true, fullyVisible: true, hitsSelf: true });
};

// Effective computed style, not the Tailwind class: the drawer must be a real
// user-scrollable container, not merely programmatically scrollable.
const expectDrawerScrollable = (menu) => expect.poll(
  () => menu.evaluate((element) => window.getComputedStyle(element).overflowY),
  { message: 'short drawer computed overflow-y must allow user scrolling', intervals: [50, 100, 200, 400], timeout: 3000 },
).toMatch(/^(auto|scroll)$/);

const openDrawer = async (page, { route, viewport, motion }) => {
  await page.setViewportSize(viewport);
  await page.emulateMedia({ reducedMotion: motion });
  await useNecessaryOnlyConsent(page);
  await page.goto(route);
  await page.waitForLoadState('domcontentloaded');

  const toggle = page.getByRole('button', { name: 'Toggle navigation menu' });
  const menu = page.getByRole('dialog', { name: 'Navigation menu' });
  await expect(toggle).toBeVisible();
  const previousScrollY = await page.evaluate(() => window.scrollY);
  await toggle.click();
  await expect(menu).toBeVisible();
  await expect(menu.getByRole('button', { name: 'Close navigation menu' })).toBeFocused();
  for (const landmark of backgroundLandmarks(page)) {
    await expect(landmark).toHaveAttribute('inert', '');
  }

  const actions = menu.locator('a[href], button');
  await expect.poll(() => actions.evaluateAll((elements) => elements.map((element) => (
    element.getAttribute('aria-label') || element.querySelector('img')?.alt || element.textContent.trim()
  )))).toEqual(MENU_ACTIONS);
  return { toggle, menu, actions, previousScrollY };
};

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
    await page.evaluate(() => {
      document.querySelector('[aria-label="Toggle navigation menu"]').click();
    });
    const menu = page.getByRole('dialog', { name: 'Navigation menu' });
    await expect(menu).toBeVisible();
    await expect(page.getByRole('button', { name: 'Close navigation menu' })).toBeFocused();
    await expect(page.locator('#main-content')).toHaveAttribute('inert', '');
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(previousScrollY);

    const focusables = menu.locator('a[href], button');
    await expect.poll(() => focusables.evaluateAll((elements) => elements.map((element) => (
      element.getAttribute('aria-label') || element.querySelector('img')?.alt || element.textContent.trim()
    )))).toEqual([
      'Vivek Patel home', 'Close navigation menu', 'Services', 'About', 'Case Studies',
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

  test('resizing an open mobile menu to desktop restores navigation and page interaction', async ({ page }) => {
    await page.setViewportSize({ width: 767, height: 844 });
    await page.goto('/');
    const toggle = page.getByRole('button', { name: 'Toggle navigation menu' });
    const menu = page.getByRole('dialog', { name: 'Navigation menu' });
    const main = page.locator('#main-content');
    const footer = page.locator('#site-footer');
    await toggle.click();
    await expect(menu).toBeVisible();
    await expect(main).toHaveAttribute('inert', '');

    await page.setViewportSize({ width: 768, height: 844 });
    await expect(page.locator('#mobile-menu')).toHaveCount(0);
    for (const background of [page.locator('header'), main, footer, page.locator('a[href="#main-content"]')]) {
      await expect(background).not.toHaveAttribute('inert', '');
      await expect(background).not.toHaveAttribute('aria-hidden', 'true');
    }
    const desktopEstimate = page.getByRole('link', { name: 'Request Estimate', exact: true });
    await expect(desktopEstimate).toBeVisible();
    await expect(desktopEstimate).toBeFocused();
    const caseStudies = page.getByRole('navigation').getByRole('link', { name: 'Case Studies' });
    await caseStudies.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/case-studies\/?$/);
    await expect(page.getByRole('heading', { name: /Selected Case Studies/i })).toBeVisible();

    await page.setViewportSize({ width: 767, height: 844 });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await toggle.click();
    await expect(menu).toBeVisible();
    await expect(footer).toHaveAttribute('inert', '');
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(toggle).toBeFocused();
    await expect(main).not.toHaveAttribute('inert', '');
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
    await expect(page.locator('#main-content')).toBeFocused();
  });

  test('mobile menu releases every landmark across the desktop breakpoint and can reopen by keyboard', async ({ page }) => {
    await page.setViewportSize({ width: 767, height: 844 });
    await page.addInitScript(() => {
      localStorage.setItem('cookie_consent_preferences', JSON.stringify({ necessary: true, analytics: false }));
    });
    await page.goto('/');

    const header = page.locator('header');
    const main = page.locator('#main-content');
    const siteFooter = page.locator('#site-footer');
    const logo = page.getByRole('link', { name: 'Vivek Patel home' }).first();
    const toggle = page.getByRole('button', { name: 'Toggle navigation menu' });
    const menu = page.getByRole('dialog', { name: 'Navigation menu' });

    await toggle.click();
    await expect(menu).toBeVisible();
    await expect(header).toHaveAttribute('inert', '');
    await expect(main).toHaveAttribute('inert', '');

    await page.setViewportSize({ width: 768, height: 844 });
    await expect(menu).toHaveCount(0);
    await expect(header).not.toHaveAttribute('inert', '');
    await expect(main).not.toHaveAttribute('inert', '');
    await expect(siteFooter).not.toHaveAttribute('inert', '');
    await expect(header.getByRole('link', { name: 'Request Estimate' })).toBeFocused();

    const desktopControls = [
      page.getByRole('navigation').getByRole('link', { name: 'Services', exact: true }),
      page.getByRole('navigation').getByRole('link', { name: 'About', exact: true }),
      page.getByRole('navigation').getByRole('link', { name: 'Case Studies', exact: true }),
      page.getByRole('navigation').getByRole('link', { name: 'Testimonials', exact: true }),
      header.getByRole('link', { name: 'Request Estimate' }),
      main.getByRole('link', { name: 'Request a Project Estimate' }).first(),
    ];
    for (const control of desktopControls) {
      await expect(control).toBeVisible();
      await control.focus();
      await expect(control).toBeFocused();
    }

    const footerHome = siteFooter.getByRole('link', { name: 'Home' });
    await footerHome.focus();
    await expect(footerHome).toBeFocused();
    const footerServices = siteFooter.getByRole('link', { name: 'Services' });
    await footerServices.focus();
    await expect(footerServices).toBeFocused();

    await logo.focus();
    await page.setViewportSize({ width: 767, height: 844 });
    await expect(logo).toBeFocused();
    await expect(toggle).toBeVisible();
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(menu).toBeVisible();
    await expect(page.getByRole('button', { name: 'Close navigation menu' })).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(menu).toHaveCount(0);
    await expect(toggle).toBeFocused();
    await expect(header).not.toHaveAttribute('inert', '');
    await expect(main).not.toHaveAttribute('inert', '');
    await expect(siteFooter).not.toHaveAttribute('inert', '');
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

  for (const drawerCase of DRAWER_CASES) {
    const { route, viewport, motion } = drawerCase;
    test(`mobile menu keeps every action reachable at ${viewport.width}x${viewport.height} on ${route} (${motion} motion)`, async ({ page, isMobile }) => {
      const { toggle, menu, actions, previousScrollY } = await openDrawer(page, drawerCase);
      const closeButton = menu.getByRole('button', { name: 'Close navigation menu' });
      const firstNavItem = menu.getByRole('link', { name: 'Services', exact: true });

      // Scroll start: the first item begins below the drawer header and is usable.
      const drawerHeaderBottom = await closeButton.evaluate((button) => button.parentElement.getBoundingClientRect().bottom);
      const firstNavItemTop = await firstNavItem.evaluate((link) => link.getBoundingClientRect().top);
      expect(firstNavItemTop, 'first menu item must not overlap the drawer header').toBeGreaterThanOrEqual(drawerHeaderBottom - RECT_TOLERANCE);
      await expectDrawerActionVisible(closeButton, 'Close navigation menu at scroll start');
      await expectDrawerActionVisible(firstNavItem, 'Services at scroll start');

      // Keyboard: every focused action is brought fully into view, both directions.
      for (const index of [2, 3, 4, 5, 6, 0, 1]) {
        await page.keyboard.press('Tab');
        await expect(actions.nth(index)).toBeFocused();
        await expectDrawerActionVisible(actions.nth(index), `Tab to ${MENU_ACTIONS[index]}`);
      }
      for (const index of [0, 6, 5, 4, 3, 2, 1]) {
        await page.keyboard.press('Shift+Tab');
        await expect(actions.nth(index)).toBeFocused();
        await expectDrawerActionVisible(actions.nth(index), `Shift+Tab to ${MENU_ACTIONS[index]}`);
      }

      // Programmatic scrollIntoView: each action can be scrolled into view, to the end and back.
      for (const index of [6, 0, 1, 2, 3, 4, 5, 6]) {
        await actions.nth(index).evaluate((element) => element.scrollIntoView({ block: 'nearest', inline: 'nearest' }));
        await expectDrawerActionVisible(actions.nth(index), `scrollIntoView ${MENU_ACTIONS[index]}`);
      }

      // Harness limit: Playwright rejects mouse.wheel in touch-emulated WebKit,
      // and has no native touch-scroll gesture API, so every isMobile context
      // uses computed overflow-y plus the scrollIntoView reachability above.
      // That is not proof of a native touch gesture; wheel stays for desktop.
      const isShortDrawer = viewport.height <= SHORT_DRAWER_MAX_HEIGHT;
      const useNativeWheel = isShortDrawer && !isMobile;
      if (isShortDrawer) {
        await expectDrawerScrollable(menu);
      }
      if (useNativeWheel) {
        await wheelDrawerToCta(page, menu, menu.getByRole('link', { name: 'Request a Project Estimate' }));
      }

      await page.keyboard.press('Escape');
      await expect(menu).toBeHidden();
      await expect(toggle).toBeFocused();
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(previousScrollY);
      for (const landmark of backgroundLandmarks(page)) {
        await expect(landmark).not.toHaveAttribute('inert', '');
        await expect(landmark).not.toHaveAttribute('aria-hidden', 'true');
      }

      // The final CTA is reachable by a real pointer hit at its measured centre.
      await toggle.click();
      await expect(menu).toBeVisible();
      const cta = menu.getByRole('link', { name: 'Request a Project Estimate' });
      if (isShortDrawer) {
        await expectDrawerScrollable(menu);
      }
      if (useNativeWheel) {
        await wheelDrawerToCta(page, menu, cta);
      } else {
        await cta.evaluate((element) => element.scrollIntoView({ block: 'nearest', inline: 'nearest' }));
      }
      await expectDrawerActionVisible(cta, 'Request a Project Estimate before click');
      const ctaBox = await cta.boundingBox();
      await page.mouse.click(ctaBox.x + ctaBox.width / 2, ctaBox.y + ctaBox.height / 2);
      await expect(page).toHaveURL(/\/contact\/?$/);
      await expect(menu).toBeHidden();
      await expect(page.locator('#main-content')).not.toHaveAttribute('inert', '');
    });
  }

  for (const drawerCase of [
    { route: '/', viewport: { width: 568, height: 256 }, motion: 'no-preference' },
    { route: '/case-studies/', viewport: { width: 320, height: 200 }, motion: 'reduce' },
  ]) {
    const { route, viewport } = drawerCase;
    test(`short mobile menu scrolled to its CTA releases landmarks at 768px on ${route} (${viewport.width}x${viewport.height})`, async ({ page }) => {
      const { menu } = await openDrawer(page, drawerCase);
      const cta = menu.getByRole('link', { name: 'Request a Project Estimate' });
      await cta.focus();
      await expectDrawerActionVisible(cta, 'Request a Project Estimate before resize');

      await page.setViewportSize({ width: 768, height: viewport.height });
      await expect(page.locator('#mobile-menu')).toHaveCount(0);
      for (const landmark of backgroundLandmarks(page)) {
        await expect(landmark).not.toHaveAttribute('inert', '');
        await expect(landmark).not.toHaveAttribute('aria-hidden', 'true');
      }
      await expect(page.locator('header').getByRole('link', { name: 'Request Estimate', exact: true })).toBeFocused();
    });
  }
});

test.describe('cookie-policy consent opener', () => {
  for (const width of [390, 1440]) {
    for (const [activation, dismissal] of [['mouse', 'close'], ['Enter', 'Reject'], ['Space', 'Save Preferences']]) {
      test(`cookie-policy opener at ${width}px uses ${activation} and restores focus after ${dismissal}`, async ({ page }) => {
        const COOKIE_KEY = 'cookie_consent_preferences';
        const preferences = { necessary: true, analytics: false };
        await page.setViewportSize({ width, height: 900 });
        await page.addInitScript(({ key, preferences }) => {
          localStorage.setItem(key, JSON.stringify(preferences));
        }, { key: COOKIE_KEY, preferences });
        await page.goto('/data-policy/');
        const opener = page.getByRole('button', { name: 'Manage Your Cookie Consent', exact: true });
        await expect(opener).toHaveAttribute('type', 'button');
        const initialURL = page.url();

        if (activation === 'mouse') {
          await opener.click();
        } else {
          await opener.focus();
          await page.keyboard.press(activation);
        }

        const manager = page.getByRole('dialog', { name: 'We value your privacy', exact: true });
        await expect(manager).toBeVisible();
        await expect(manager).toBeFocused();
        expect(page.url()).toBe(initialURL);
        expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), COOKIE_KEY)).toEqual(preferences);

        if (dismissal === 'Save Preferences') {
          await manager.getByRole('button', { name: 'Options', exact: true }).click();
          await expect(manager.getByRole('checkbox', { name: 'Analytics', exact: true })).not.toBeChecked();
        }
        await manager.getByRole('button', {
          name: dismissal === 'close' ? /close cookie consent/i : dismissal,
          exact: dismissal !== 'close',
        }).click();
        await expect(manager).toBeHidden();
        await expect(opener).toBeFocused();
        expect(page.url()).toBe(initialURL);
        expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), COOKIE_KEY)).toEqual(preferences);
      });
    }

  }
});
