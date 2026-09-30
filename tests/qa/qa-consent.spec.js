import { expect, test } from './qa-test.js';

const COOKIE_KEY = 'cookie_consent_preferences';
const TELEMETRY_HOSTS = /googletagmanager\.com|google-analytics\.com|sentry\.io|ingest\.sentry|telemetry\.invalid/;
const WIDTHS = [390, 1440];

async function clearConsentOnFirstLoad(page) {
  await page.addInitScript((key) => {
    if (window.self === window.top && !sessionStorage.getItem('qa-consent-cleared')) {
      localStorage.removeItem(key);
      sessionStorage.setItem('qa-consent-cleared', '1');
    }
  }, COOKIE_KEY);
}

async function geometry(page) {
  return page.evaluate(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    const rect = (el) => (el ? el.getBoundingClientRect() : null);
    const dialog = document.querySelector('[role="dialog"][aria-labelledby="cookie-consent-title"]');
    const settings = dialog?.querySelector('[data-state="open"][id]');
    return {
      headerBottom: rect(document.querySelector('header')).bottom,
      mainTop: rect(document.getElementById('main-content')).top,
      dialogBottom: rect(dialog)?.bottom ?? null,
      settingsBottom: rect(settings)?.bottom ?? null,
    };
  });
}

const settledLanding = (page) => () => page.evaluate(async () => {
  const read = () => {
    const dialog = document.querySelector('[role="dialog"][aria-labelledby="cookie-consent-title"]');
    const settings = dialog?.querySelector('[data-state="open"][id]');
    const bottoms = [dialog, settings].filter(Boolean).map((el) => el.getBoundingClientRect().bottom);
    return {
      scrollY: window.scrollY,
      headerBottom: document.querySelector('header').getBoundingClientRect().bottom,
      mainTop: document.getElementById('main-content').getBoundingClientRect().top,
      overlayBottom: bottoms.length ? Math.max(...bottoms) : null,
    };
  };
  const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
  await frame();
  const first = read();
  await frame();
  const second = read();
  return JSON.stringify(first) === JSON.stringify(second) ? second : null;
});

// The contract is that the control's visible center hits the control itself.
// Native focus scrolling may leave part of a control below the viewport edge.
async function expectUncovered(page, locator, label) {
  const state = await locator.evaluate((el) => {
    const box = el.getBoundingClientRect();
    const x = box.left + box.width / 2;
    const y = box.top + box.height / 2;
    const centerInViewport = x >= 0 && x < window.innerWidth && y >= 0 && y < window.innerHeight;
    const hit = centerInViewport ? document.elementFromPoint(x, y) : null;
    return { centerInViewport, hitsControl: !!hit && (hit === el || el.contains(hit)) };
  });
  expect(state, `${label} center should be in the viewport and hit the control`)
    .toEqual({ centerInViewport: true, hitsControl: true });
}

// Resolves once the still-focused control and the consent overlay keep the same geometry for two frames.
const settledFocusedControl = (handle) => () => handle.evaluate(async (el) => {
  const read = () => {
    const dialog = document.querySelector('[role="dialog"][aria-labelledby="cookie-consent-title"]');
    const settings = dialog?.querySelector('[data-state="open"][id]');
    const bottoms = [dialog, settings].filter(Boolean).map((node) => node.getBoundingClientRect().bottom);
    const box = el.getBoundingClientRect();
    const x = box.left + box.width / 2;
    const y = box.top + box.height / 2;
    const centerInViewport = x >= 0 && x < window.innerWidth && y >= 0 && y < window.innerHeight;
    const hit = centerInViewport ? document.elementFromPoint(x, y) : null;
    return {
      focused: document.activeElement === el,
      top: box.top,
      overlayBottom: bottoms.length ? Math.max(...bottoms) : null,
      centerInViewport,
      hitsControl: !!hit && (hit === el || el.contains(hit)),
    };
  };
  const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
  await frame();
  const first = read();
  await frame();
  const second = read();
  return second.focused && JSON.stringify(first) === JSON.stringify(second) ? second : null;
});

const dialogOf = (page) => page.getByRole('dialog', { name: /we value your privacy/i });

for (const width of WIDTHS) {
  test.describe(`consent spacer at ${width}px`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await clearConsentOnFirstLoad(page);
    });

    test('Reject/reload and Accept/reload share the header-to-main offset', async ({ page }) => {
      const offsets = {};
      for (const choice of ['Reject', 'Accept']) {
        await page.goto('/contact');
        await page.evaluate((key) => localStorage.removeItem(key), COOKIE_KEY);
        await page.reload();
        await dialogOf(page).getByRole('button', { name: choice, exact: true }).click({ timeout: 5000 });
        await expect(dialogOf(page)).toBeHidden();
        await page.reload();
        await page.waitForTimeout(2000);
        await expect(dialogOf(page)).toHaveCount(0);
        const { headerBottom, mainTop } = await geometry(page);
        offsets[choice] = mainTop - headerBottom;
      }
      expect(offsets.Reject).toBe(offsets.Accept);
      expect(offsets.Reject).toBe(0);
    });

    test('close and Save with analytics off leave no spacer', async ({ page }) => {
      await page.goto('/contact');
      await dialogOf(page).getByRole('button', { name: /close cookie consent/i }).click({ timeout: 5000 });
      let { headerBottom, mainTop } = await geometry(page);
      expect(mainTop).toBe(headerBottom);

      await page.getByRole('button', { name: /Manage Consent/i }).click();
      await dialogOf(page).getByRole('button', { name: /options/i }).click();
      await expect(page.getByRole('checkbox', { name: /analytics/i })).not.toBeChecked();
      await page.getByRole('button', { name: /save preferences/i }).click();
      await expect(dialogOf(page)).toBeHidden();
      await page.reload();
      await page.waitForTimeout(2000);
      ({ headerBottom, mainTop } = await geometry(page));
      expect(mainTop).toBe(headerBottom);
    });

    test('initial banner reserves space only once visible and keeps focused controls uncovered', async ({ page }) => {
      await page.goto('/contact');
      const early = await geometry(page);
      if (early.dialogBottom === null) expect(early.mainTop).toBe(early.headerBottom);

      const dialog = dialogOf(page);
      await expect(dialog).toBeVisible({ timeout: 5000 });
      const shown = await geometry(page);
      expect(shown.mainTop).toBeGreaterThanOrEqual(Math.floor(shown.dialogBottom));
      expect(shown.mainTop - shown.dialogBottom).toBeLessThan(2);

      for (const name of [/^accept$/i, /^reject$/i, /options/i, /close cookie consent/i]) {
        const control = dialog.getByRole('button', { name });
        await control.focus();
        await expectUncovered(page, control, `banner control ${name}`);
      }
      const firstMainControl = page.locator('#main-content').locator('a[href], button, input, select, textarea').first();
      await firstMainControl.focus();
      await expectUncovered(page, firstMainControl, 'first main-content control');
    });

    for (const reducedMotion of ['no-preference', 'reduce']) {
      test(`reopened manager and expanded settings reserve their actual space (${reducedMotion} motion)`, async ({ page }) => {
        await page.emulateMedia({ reducedMotion });
        await page.addInitScript((key) => {
          localStorage.setItem(key, JSON.stringify({ necessary: true, analytics: false }));
        }, COOKIE_KEY);
        await page.goto('/contact');
        const trigger = page.getByRole('button', { name: /Manage Consent/i });
        await trigger.focus();
        await page.keyboard.press('Enter');
        const dialog = dialogOf(page);
        await expect(dialog).toBeVisible();
        await expect(dialog).toBeFocused();

        const reopened = await geometry(page);
        expect(reopened.mainTop).toBeGreaterThanOrEqual(Math.floor(reopened.dialogBottom));

        await dialog.getByRole('button', { name: /options/i }).focus();
        await page.keyboard.press('Enter');
        const save = page.getByRole('button', { name: /save preferences/i });
        await expect(save).toBeVisible();
        await expect.poll(async () => (await geometry(page)).settingsBottom).not.toBeNull();
        const expanded = await geometry(page);
        expect(expanded.mainTop).toBeGreaterThanOrEqual(Math.floor(expanded.settingsBottom));

        for (const control of [page.getByRole('checkbox', { name: /analytics/i }), save]) {
          await control.focus();
          await expectUncovered(page, control, 'expanded settings control');
        }

        await dialog.getByRole('button', { name: 'Reject', exact: true }).focus();
        await page.keyboard.press('Enter');
        await expect(dialog).toBeHidden();
        await expect(trigger).toBeFocused();
        const closed = await geometry(page);
        expect(closed.mainTop).toBe(closed.headerBottom);
      });
    }

    for (const reducedMotion of ['no-preference', 'reduce']) {
      test(`skip link lands below the expanded manager, then normal padding returns (${reducedMotion} motion)`, async ({ page }) => {
        await page.emulateMedia({ reducedMotion });
        await page.addInitScript((key) => {
          localStorage.setItem(key, JSON.stringify({ necessary: true, analytics: false }));
        }, COOKIE_KEY);
        await page.goto('/contact');
        const normalPadding = await page.evaluate(() => getComputedStyle(document.documentElement).scrollPaddingTop);

        await page.getByRole('button', { name: /Manage Consent/i }).focus();
        await page.keyboard.press('Enter');
        const dialog = dialogOf(page);
        await expect(dialog).toBeFocused();
        await dialog.getByRole('button', { name: /options/i }).focus();
        await page.keyboard.press('Enter');
        await expect(page.getByRole('button', { name: /save preferences/i })).toBeVisible();

        const skipLink = page.getByRole('link', { name: /skip to main content/i });
        const activateSkipLink = async () => {
          await skipLink.focus();
          await page.keyboard.press('Enter');
        };
        const settledGeometry = async () => {
          let settled = null;
          await expect.poll(async () => (settled = await settledLanding(page)())).not.toBeNull();
          return settled;
        };

        await activateSkipLink();
        // ScrollToTop focuses main asynchronously after the hash navigation.
        await expect(page.locator('#main-content')).toBeFocused();
        const expanded = await settledGeometry();
        expect(expanded.mainTop).toBeGreaterThanOrEqual(Math.floor(expanded.overlayBottom));
        await page.keyboard.press('Tab');
        const firstFocused = page.locator('#main-content :focus');
        await expect(firstFocused).toHaveCount(1);
        const focusedHandle = await firstFocused.elementHandle();
        let afterTab = null;
        await expect.poll(async () => (afterTab = await settledFocusedControl(focusedHandle)())).not.toBeNull();
        expect(afterTab.overlayBottom).not.toBeNull();
        expect(afterTab.top, 'focused control must start below the complete consent overlay')
          .toBeGreaterThanOrEqual(afterTab.overlayBottom);
        expect(afterTab, 'focused control center should be in the viewport and hit the control')
          .toMatchObject({ centerInViewport: true, hitsControl: true });
        await focusedHandle.dispose();

        await dialog.getByRole('button', { name: 'Reject', exact: true }).focus();
        await page.keyboard.press('Enter');
        await expect(dialog).toBeHidden();
        const restored = await page.evaluate(() => ({
          padding: getComputedStyle(document.documentElement).scrollPaddingTop,
          property: document.documentElement.style.getPropertyValue('--consent-banner-bottom'),
        }));
        expect(restored).toEqual({ padding: normalPadding, property: '' });

        // The hash is unchanged here, so ScrollToTop does not refocus main; only geometry is checked.
        await activateSkipLink();
        const collapsed = await settledGeometry();
        expect(collapsed.overlayBottom).toBeNull();
        expect(collapsed.mainTop).toBeGreaterThanOrEqual(collapsed.headerBottom);
      });
    }

    test('reduced motion: Reject reload has no spacer and sends no telemetry', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const telemetry = [];
      page.on('request', (request) => {
        if (TELEMETRY_HOSTS.test(request.url())) telemetry.push(new URL(request.url()).hostname);
      });
      await page.goto('/contact');
      await dialogOf(page).getByRole('button', { name: 'Reject', exact: true }).click({ timeout: 5000 });
      await page.reload();
      await page.waitForTimeout(2000);
      const { headerBottom, mainTop } = await geometry(page);
      expect(mainTop).toBe(headerBottom);
      expect(telemetry).toEqual([]);
    });
  });
}
