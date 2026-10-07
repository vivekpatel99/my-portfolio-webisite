import { expect, test } from './qa-test.js';

test.skip(process.env.QA_LOCAL_ONLY !== '1', 'Fragment regressions require a loopback-only preview.');
test.use({ viewport: { width: 1280, height: 720 }, reducedMotion: 'reduce' });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('cookie_consent_preferences', JSON.stringify({ necessary: true, analytics: false }));
    window.__fragmentNavigationCalls = [];
    for (const method of ['scrollIntoView', 'focus']) {
      const original = HTMLElement.prototype[method];
      HTMLElement.prototype[method] = function (...args) {
        if (['services', 'about', 'portfolio', 'main-content'].includes(this.id)) {
          const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop);
          const destination = this.getBoundingClientRect().top + window.scrollY - padding;
          const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
          window.__fragmentNavigationCalls.push({
            method,
            id: this.id,
            expectedScrollY: method === 'scrollIntoView' ? Math.max(0, Math.min(destination, maxScroll)) : null,
          });
        }
        return original.apply(this, args);
      };
    }
  });
});

const expectUsableShell = async (page) => {
  await expect(page.locator('header')).toBeVisible();
  await expect(page.locator('#main-content')).toBeVisible();
  await expect(page.locator('#site-footer')).toBeVisible();
  await expect(page.getByText(/^Something went wrong\./)).toHaveCount(0);
  await expect(page.locator('[data-route-error]')).toHaveCount(0);
};

const expectAnchorArrival = async (page, id) => {
  const target = page.locator(`#${id}`);
  await expect(target).toBeFocused();
  await expect.poll(() => page.evaluate((targetId) => {
    const arrival = window.__fragmentNavigationCalls.findLast((call) => call.method === 'scrollIntoView' && call.id === targetId);
    return arrival ? Math.abs(window.scrollY - arrival.expectedScrollY) : Infinity;
  }, id)).toBeLessThan(2);
  await expect(target).toBeInViewport();
};

const followHeaderFragment = async (page, fragment) => {
  const link = page.locator('header nav').getByRole('link', { name: 'Services', exact: true });
  await link.evaluate((element, hash) => element.setAttribute('href', `/${hash}`), fragment);
  await link.focus();
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => window.location.hash)).toBe(fragment);
};

for (const fragment of ['#%E0%A4%A', '#%']) {
  for (const navigation of ['cold load', 'SPA link', 'native hash']) {
    test(`${navigation} with ${fragment} preserves the shell without anchor effects`, async ({ page }) => {
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      let previousScroll = 0;
      let hasSourceFocus = false;

      if (navigation === 'cold load') {
        await page.goto(`/${fragment}`);
      } else {
        await page.goto('/');
        await expectUsableShell(page);
        if (navigation === 'SPA link') {
          await page.locator('header nav').getByRole('link', { name: 'Services', exact: true }).focus();
        } else {
          await page.locator('header').getByRole('link', { name: 'Vivek Patel home' }).focus();
        }
        await page.evaluate(() => { window.__fragmentSource = document.activeElement; });
        hasSourceFocus = true;
        previousScroll = await page.evaluate(() => window.scrollY);
        await page.evaluate(() => { window.__fragmentNavigationCalls = []; });
        if (navigation === 'SPA link') {
          await followHeaderFragment(page, fragment);
        } else {
          await page.evaluate((hash) => { window.location.hash = hash; }, fragment);
          await expect.poll(() => page.evaluate(() => window.location.hash)).toBe(fragment);
        }
      }

      await expectUsableShell(page);
      await page.waitForTimeout(2200);
      expect(errors).toEqual([]);
      expect(await page.evaluate(() => window.__fragmentNavigationCalls)).toEqual([]);
      expect(await page.evaluate(() => window.scrollY)).toBe(previousScroll);
      if (hasSourceFocus) {
        expect(await page.evaluate(() => document.activeElement === window.__fragmentSource)).toBe(true);
      } else {
        expect(await page.evaluate(() => document.activeElement.tagName)).toBe('BODY');
      }

      const recovery = page.locator('#site-footer').getByRole('link', { name: 'Services', exact: true });
      await recovery.focus();
      await page.keyboard.press('Enter');
      await expectAnchorArrival(page, 'services');
      await expectUsableShell(page);
      expect(errors).toEqual([]);
    });
  }
}

for (const navigation of ['cold load', 'SPA link', 'native hash']) {
  test(`${navigation} decodes a valid percent-encoded fragment`, async ({ page }) => {
    if (navigation === 'cold load') {
      await page.goto('/#%73ervices');
    } else {
      await page.goto('/');
      await expectUsableShell(page);
      if (navigation === 'SPA link') {
        await followHeaderFragment(page, '#%73ervices');
      } else {
        await page.evaluate(() => { window.location.hash = '#%73ervices'; });
      }
    }
    await expectAnchorArrival(page, 'services');
    await expectUsableShell(page);
  });
}

for (const [name, id] of [['Services', 'services'], ['About', 'about'], ['Portfolio', 'portfolio']]) {
  test(`ordinary footer ${name} link preserves anchor position and focus`, async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    await expect.poll(() => page.locator(`#${id}`).evaluate(async (target) => {
      const animator = target.closest('[data-section-animator]');
      const documentTop = () => target.getBoundingClientRect().top + window.scrollY;
      const before = documentTop();
      await new Promise(requestAnimationFrame);
      const after = documentTop();
      await new Promise(requestAnimationFrame);
      return (!animator || getComputedStyle(animator).transform === 'none')
        && before === after && after === documentTop();
    })).toBe(true);
    const link = page.locator('#site-footer').getByRole('link', { name, exact: true });
    await link.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(new RegExp(`/#${id}$`));
    await expectAnchorArrival(page, id);
    await expectUsableShell(page);
  });
}
