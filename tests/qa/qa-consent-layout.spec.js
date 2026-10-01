import { test, expect } from './qa-test.js';

const key = 'cookie_consent_preferences';
const probeOnly = process.env.QA_CONSENT_PROBE === '1';
const dialog = (page) => page.getByRole('dialog', { name: /we value your privacy/i });
const settle = (page) => page.waitForTimeout(350);
const readAnchor = (page) => page.locator('main p').first().evaluate((el) => ({
  top: el.getBoundingClientRect().top,
  y: scrollY,
  spacerHeight: document.querySelector('[data-testid="cookie-consent-spacer"]').getBoundingClientRect().height,
}));
async function attach(testInfo, name, value) {
  await testInfo.attach(name, { body: JSON.stringify(value, null, 2), contentType: 'application/json' });
}
async function seed(page) {
  await page.addInitScript((key) => localStorage.setItem(key, JSON.stringify({ necessary: true, analytics: false })), key);
}

for (const width of [390, 1280]) {
  for (const motion of ['no-preference', 'reduce']) {
    test(`shallow delayed arrival ${width} ${motion}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: motion });
      await page.goto('/');
      await page.locator('main p').first().waitFor();
      await page.evaluate(() => window.scrollTo({ top: 50, behavior: 'instant' }));
      await expect(dialog(page)).toBeHidden();
      const before = await readAnchor(page);
      await dialog(page).waitFor();
      await page.waitForTimeout(1700);
      const after = await readAnchor(page);
      await attach(testInfo, 'shallow-arrival', { before, after });
      expect(before.y).toBe(50);
      expect(Math.abs(after.top - before.top), JSON.stringify({ before, after })).toBeLessThanOrEqual(2);
    });

    test(`shallow consent changes and top clamp ${width} ${motion}`, async ({ page }, testInfo) => {
      await seed(page);
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: motion });
      await page.goto('/');
      await page.locator('main p').first().waitFor();
      const states = [];
      for (const depth of [100, 50, 0]) {
        await page.evaluate(() => window.dispatchEvent(new Event('manage-cookies')));
        await dialog(page).waitFor();
        await settle(page);
        await page.evaluate((depth) => window.scrollTo({ top: depth, behavior: 'instant' }), depth);
        await settle(page);
        for (const action of ['options', 'collapse', 'reject']) {
          const before = await readAnchor(page);
          await dialog(page).getByRole('button', { name: action === 'reject' ? 'Reject' : 'Options', exact: true }).click();
          await settle(page);
          const after = await readAnchor(page);
          const delta = after.spacerHeight - before.spacerHeight;
          const expectedY = before.y > 0 ? Math.max(0, before.y + delta) : 0;
          const expectedTop = before.top + delta - (expectedY - before.y);
          states.push({ depth, action, before, after, expectedY, expectedTop });
          expect(Math.abs(after.y - expectedY), JSON.stringify(states)).toBeLessThanOrEqual(2);
          expect(Math.abs(after.top - expectedTop), JSON.stringify(states)).toBeLessThanOrEqual(2);
        }
      }
      await attach(testInfo, 'shallow-changes', states);
    });
  }
}

for (const route of ['/', '/contact/', '/case-studies/', '/project/ai-invoice-processing-automation/']) {
  for (const motion of ['no-preference', 'reduce']) {
    test(`header gap and top reservation ${route} ${motion}`, async ({ page }, testInfo) => {
      await page.emulateMedia({ reducedMotion: motion });
      const measurements = [];
      for (const width of [320, 390, 768, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(route);
        await page.evaluate((key) => localStorage.removeItem(key), key);
        await page.reload();
        await dialog(page).waitFor();
        await settle(page);
        const geometry = await page.evaluate(() => {
          const header = document.querySelector('header').getBoundingClientRect();
          const banner = document.querySelector('[aria-labelledby="cookie-consent-title"]').getBoundingClientRect();
          return { headerBottom: header.bottom, bannerTop: banner.top, bannerBottom: banner.bottom,
            mainTop: document.querySelector('main').getBoundingClientRect().top,
            overflow: document.documentElement.scrollWidth > innerWidth };
        });
        measurements.push({ width, ...geometry });
        if (!probeOnly) {
          expect(geometry.bannerTop).toBe(geometry.headerBottom);
          expect(geometry.mainTop).toBeGreaterThanOrEqual(geometry.bannerBottom);
          expect(geometry.overflow).toBe(false);
        }
      }
      await attach(testInfo, 'geometry', measurements);
    });
  }
}

for (const route of ['/', '/contact/']) {
  for (const width of [390, 1280]) {
    for (const motion of ['no-preference', 'reduce']) {
      test(`reading anchor ${route} ${width} ${motion}`, async ({ page }, testInfo) => {
        await seed(page);
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ reducedMotion: motion });
        await page.goto(route);
        await page.locator('main p').first().waitFor();
        await page.waitForTimeout(1800);
        await page.evaluate(() => {
          window.scrollTo({ top: 293, behavior: 'instant' });
          window.consentAnchor = document.querySelector('main p');
        });
        await settle(page);
        const read = () => page.evaluate(() => ({ top: window.consentAnchor.getBoundingClientRect().top, y: scrollY }));
        const states = [{ state: 'before', ...await read() }];
        for (const action of ['open', 'options', 'collapse', 'reject', 'open', 'accept']) {
          if (action === 'open') await page.evaluate(() => window.dispatchEvent(new Event('manage-cookies')));
          else if (action === 'options' || action === 'collapse') await dialog(page).getByRole('button', { name: 'Options', exact: true }).click();
          else await dialog(page).getByRole('button', { name: action === 'accept' ? 'Accept' : 'Reject', exact: true }).click();
          await settle(page);
          states.push({ state: action, ...await read() });
        }
        await attach(testInfo, 'anchors', states);
        if (!probeOnly) for (const state of states) expect(Math.abs(state.top - states[0].top), JSON.stringify(states)).toBeLessThanOrEqual(2);
      });
    }
  }
}

for (const route of ['/', '/case-studies/', '/contact/']) {
  for (const viewport of [{ width: 412, height: 823 }, { width: 1350, height: 940 }]) {
    test(`cold CLS ${route} ${viewport.width}`, async ({ browser, browserName }, testInfo) => {
      test.skip(browserName !== 'chromium', 'LayoutShift and CDP throttling are Chromium-only.');
      const measurements = [];
      for (const seeded of [false, true]) {
        for (let run = 0; run < 3; run++) {
          const context = await browser.newContext({ viewport, serviceWorkers: 'block' });
          await context.route('**/*', (route) => {
            const url = new URL(route.request().url());
            return ['127.0.0.1', 'localhost'].includes(url.hostname) ? route.continue() : route.abort();
          });
          await context.addInitScript(({ seeded, key }) => {
            if (seeded) localStorage.setItem(key, JSON.stringify({ necessary: true, analytics: false }));
            window.consentShifts = [];
            new PerformanceObserver((list) => {
              for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.consentShifts.push({ value: entry.value, time: entry.startTime });
            }).observe({ type: 'layout-shift', buffered: true });
          }, { seeded, key });
          const page = await context.newPage();
          const cdp = await context.newCDPSession(page);
          await cdp.send('Network.enable');
          await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
          await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
          await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 200000, uploadThroughput: 93750, connectionType: 'cellular4g' });
          await page.goto(`${testInfo.project.use.baseURL || process.env.QA_CONSENT_BASE_URL || 'http://127.0.0.1:4318'}${route}`, { waitUntil: 'load' });
          await page.waitForTimeout(5500);
          const shifts = await page.evaluate(() => window.consentShifts);
          const cls = shifts.reduce((sum, entry) => sum + entry.value, 0);
          measurements.push({ seeded, run, cls, shifts });
          await context.close();
        }
      }
      await attach(testInfo, 'cls', measurements);
      if (!probeOnly && route === '/') for (const row of measurements.filter((row) => row.seeded)) expect(row.cls).toBeLessThanOrEqual(0.01);
    });
  }
}

for (const route of ['/', '/contact/']) {
  for (const width of [390, 1280]) {
    test(`delayed arrival and reading stability ${route} ${width}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.addInitScript(() => {
        const readFirstContentFrame = () => {
          const content = document.querySelector('main p');
          if (!content) return requestAnimationFrame(readFirstContentFrame);
          const banner = document.querySelector('[aria-labelledby="cookie-consent-title"]');
          window.firstConsentContentFrame = {
            bannerPresent: !!banner,
            mainTop: document.querySelector('main').getBoundingClientRect().top,
            bannerBottom: banner?.getBoundingClientRect().bottom ?? null,
          };
        };
        requestAnimationFrame(readFirstContentFrame);
      });
      await page.goto(route);
      await page.locator('main p').first().waitFor();
      await page.waitForTimeout(300);
      await page.evaluate(() => { window.scrollTo({ top: 293, behavior: 'instant' }); });
      await settle(page);
      if (!probeOnly) await expect(dialog(page)).toBeHidden();
      const before = await page.locator('main p').first().evaluate((el) => ({ top: el.getBoundingClientRect().top, y: scrollY }));
      await dialog(page).waitFor();
      await page.waitForTimeout(1700);
      const after = await page.locator('main p').first().evaluate((el) => ({ top: el.getBoundingClientRect().top, y: scrollY }));
      const firstFrame = await page.evaluate(() => window.firstConsentContentFrame);
      await attach(testInfo, 'delayed-arrival', { firstFrame, before, after });
      if (!probeOnly) {
        expect(firstFrame.bannerPresent).toBe(false);
        expect(Math.abs(after.top - before.top)).toBeLessThanOrEqual(2);
      }
    });
  }
}
