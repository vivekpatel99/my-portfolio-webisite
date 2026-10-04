import { chromium, expect, test } from './qa-test.js';
import { waitForConsentBannerEntrance } from './qa-consent-banner.js';
import { guardLocalNavigation, guardLocalWebSocket } from './qa-navigation-guard.js';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const viewports = [
  { name: 'narrow-phone', width: 320, height: 568 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'below-sm', width: 639, height: 800 },
  { name: 'sm', width: 640, height: 800 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 720 },
  { name: 'wide', width: 1920, height: 1080 },
];

for (const vp of viewports) {
  test(`home layout at ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto('/');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
    await expect(page.locator('#main-content')).toBeVisible();
  });
}

for (const width of [390, 1280]) {
  test(`header stays visible after scrolling at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, 1500));

    const header = page.getByRole('banner');
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThanOrEqual(1400);
    await expect.poll(async () => (await header.boundingBox())?.y).toBe(0);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);

    if (width === 390) {
      await header.getByRole('button', { name: 'Toggle navigation menu' }).click();
      await expect(page.getByRole('dialog', { name: 'Navigation menu' })
        .getByRole('link', { name: /Request a Project Estimate/i })).toBeVisible();
    } else {
      await expect(header.getByRole('link', { name: /Request Estimate/i })).toBeVisible();
    }
  });
}

test('anchor navigation leaves its section below the sticky header', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  await page.getByRole('banner').getByRole('link', { name: 'Services' }).click();

  await expect(page).toHaveURL(/#services$/);
  const section = page.locator('#services');
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(1000);
  await expect.poll(() => section.evaluate((element) => getComputedStyle(element.parentElement).transform))
    .toBe('none');
  await expect.poll(async () => (await section.boundingBox())?.y).toBeGreaterThanOrEqual(68);
  await expect.poll(async () => (await section.boundingBox())?.y).toBeLessThanOrEqual(150);
});

for (const width of [390, 1280]) {
  test(`homepage sections stay visible before scroll, on anchor jumps, and in print at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');

    const sections = page.locator('#portfolio, #services, #testimonials, #cta');
    await expect(sections).toHaveCount(4);
    expect(await sections.evaluateAll((elements) => elements.map((element) => getComputedStyle(element.parentElement).opacity)))
      .toEqual(['1', '1', '1', '1']);

    const anchorOpacity = await page.evaluate(() => {
      location.hash = '#services';
      return getComputedStyle(document.querySelector('#services').parentElement).opacity;
    });
    expect(anchorOpacity).toBe('1');

    await page.emulateMedia({ media: 'print' });
    expect(await sections.evaluateAll((elements) => elements.map((element) => getComputedStyle(element.parentElement).transform)))
      .toEqual(['none', 'none', 'none', 'none']);
  });
}

test('mobile menu opens and closes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Toggle navigation menu' }).click();
  await expect(page.getByRole('dialog', { name: 'Navigation menu' })).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Navigation menu' }).getByRole('link', { name: 'Services' })).toBeVisible();
  await page.getByRole('button', { name: 'Close navigation menu' }).click();
  await expect(page.getByRole('dialog', { name: 'Navigation menu' })).toBeHidden();
});

test('mobile menu CTA navigates to contact', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Toggle navigation menu' }).click();
  await page.getByRole('dialog', { name: 'Navigation menu' }).getByRole('link', { name: /Request a Project Estimate/i }).click();
  await expect(page).toHaveURL(/\/contact/);
});

test('desktop shows nav links, mobile shows hamburger', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await expect(page.getByRole('navigation').getByRole('link', { name: 'Services', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Toggle navigation menu' })).toBeHidden();

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('button', { name: 'Toggle navigation menu' })).toBeVisible();
});

test('custom cursor disabled on touch emulation', async ({ page }) => {
  await page.addInitScript(() => {
    const nativeMatchMedia = window.matchMedia.bind(window);
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query) => {
        if (query.includes('pointer: fine')) {
          return {
            matches: false,
            media: query,
            addEventListener: () => {},
            removeEventListener: () => {},
          };
        }
        if (query.includes('pointer: coarse')) {
          return {
            matches: true,
            media: query,
            addEventListener: () => {},
            removeEventListener: () => {},
          };
        }
        return nativeMatchMedia(query);
      },
    });
  });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await expect(page.locator('html')).not.toHaveClass(/custom-cursor-enabled/);
});

test('skip link is focusable at 200% zoom', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 800 });
  await page.goto('/');
  const skipLink = page.getByRole('link', { name: 'Skip to main content' });
  await expect(skipLink).toBeAttached();
  await page.keyboard.press('Tab');
  await expect(skipLink).toBeFocused();
});

const boxesOverlap = (a, b) =>
  !(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y);

for (const width of [320, 1280]) {
  test(`case-study labels clear thumbnails and neighboring cards at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/case-studies/');
    await page.getByRole('button', { name: 'Load more', exact: true }).click();
    const cards = page.locator('main article');
    await expect(cards).toHaveCount(12);
    const statusBox = await page.getByRole('status').boundingBox();
    const cardBoxes = await Promise.all((await cards.all()).map((card) => card.boundingBox()));
    for (const [index, card] of (await cards.all()).entries()) {
      const label = card.locator('.detection-label');
      const labelBox = await label.boundingBox();
      const mediaBox = await card.getByRole('link').first().boundingBox();
      expect(labelBox.x).toBeGreaterThanOrEqual(0);
      expect(labelBox.x + labelBox.width).toBeLessThanOrEqual(width);
      expect(mediaBox.y - (labelBox.y + labelBox.height)).toBeGreaterThanOrEqual(3);
      await expect(label).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
      expect(boxesOverlap(labelBox, statusBox)).toBe(false);
      for (const [otherIndex, cardBox] of cardBoxes.entries()) {
        if (otherIndex !== index) expect(boxesOverlap(labelBox, cardBox)).toBe(false);
      }
    }
    if (width === 320) {
      const wrapped = cards.filter({ hasText: 'Maintainable n8n Pipelines' }).locator('.detection-label');
      const box = await wrapped.boundingBox();
      const lineHeight = await wrapped.evaluate((element) => parseFloat(getComputedStyle(element).lineHeight));
      expect(box.height).toBeGreaterThan(lineHeight);
    }
  });
}

const heroFoldViewports = [
  { width: 320, height: 640, stacked: true },
  { width: 390, height: 844, stacked: true },
  { width: 768, height: 900, stacked: true },
  { width: 1280, height: 720, stacked: false },
];

for (const vp of heroFoldViewports) {
  test(`hero CTAs start in the first screen at ${vp.width}x${vp.height}`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto('/');
    const hero = page.locator('#main-content section').first();
    const invoiceElement = hero.getByRole('article', { name: 'Profile invoice field parse' });
    const invoice = await invoiceElement.boundingBox();
    const estimate = await hero.getByRole('link', { name: 'Request a Project Estimate' }).boundingBox();
    const caseStudies = await hero.getByRole('link', { name: 'View Case Studies', exact: true }).boundingBox();
    const portrait = hero.getByAltText('Tracked engineer portrait');
    await expect(portrait).toBeVisible();
    const portraitBox = await portrait.boundingBox();

    expect(estimate.y).toBeLessThan(vp.height);
    if (vp.width === 320) {
      expect(estimate.y + estimate.height).toBeLessThanOrEqual(vp.height);
    }
    expect(estimate.y).toBeGreaterThanOrEqual(invoice.y + invoice.height);
    expect(invoice.x).toBeGreaterThanOrEqual(0);
    expect(invoice.x + invoice.width).toBeLessThanOrEqual(vp.width);
    const invoiceTitle = invoiceElement.getByText('Profile Invoice', { exact: true });
    await expect(invoiceTitle).toBeVisible();

    if (vp.width < 768) {
      const name = await invoiceElement.getByText('Name', { exact: true }).boundingBox();
      const role = await invoiceElement.getByText('Role', { exact: true }).boundingBox();
      if (vp.width < 360) {
        expect(role.y).toBeGreaterThanOrEqual(name.y + name.height);
      } else {
        expect(role.x).toBeGreaterThan(name.x);
      }
    }

    const ctaGap = vp.width < 768
      ? caseStudies.y - (estimate.y + estimate.height)
      : caseStudies.x - (estimate.x + estimate.width);
    expect(ctaGap).toBeGreaterThanOrEqual(8);

    if (vp.stacked) {
      expect(portraitBox.y).toBeGreaterThanOrEqual(Math.max(estimate.y + estimate.height, caseStudies.y + caseStudies.height));
    } else {
      expect(portraitBox.x).toBeGreaterThanOrEqual(invoice.x + invoice.width);
    }

    const labels = [
      hero.getByText('engineer · 0.99', { exact: true }),
      hero.getByText('ID 001 · TRACKED', { exact: true }),
      hero.getByText('REC', { exact: true }),
    ];
    for (const label of labels) await expect(label).toBeVisible();
    if (vp.stacked) {
      const faceZone = {
        x: portraitBox.x + portraitBox.width * 0.28,
        y: portraitBox.y + portraitBox.height * 0.12,
        width: portraitBox.width * 0.4,
        height: portraitBox.height * 0.36,
      };
      for (const label of labels) {
        const box = await label.boundingBox();
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(vp.width);
        expect(boxesOverlap(box, faceZone)).toBe(false);
      }
      const labelBoxes = await Promise.all(labels.map((label) => label.boundingBox()));
      for (let index = 0; index < labelBoxes.length; index += 1) {
        for (let next = index + 1; next < labelBoxes.length; next += 1) {
          expect(boxesOverlap(labelBoxes[index], labelBoxes[next])).toBe(false);
        }
      }
    }
  });
}

// #253: the invoice header stack, credential captions and actions keep visible gaps.
// Width 720 is a half-width layout check (useful reflow), not native browser zoom.
// AC6 (#191 200% zoom) is covered by the Chromium browser-zoom test below (chrome.tabs.setZoom).
const assertHeroInvoiceGaps = async (page, { requireMobileHeaderGap = false } = {}) => {
  const consentBanner = page.getByRole('dialog', { name: /we value your privacy/i });
  if (await page.evaluate(() => !localStorage.getItem('cookie_consent_preferences'))) {
    await expect(consentBanner).toBeVisible();
    await waitForConsentBannerEntrance(consentBanner);
  }
  const hero = page.locator('#main-content section').first();
  const invoice = hero.getByRole('article', { name: 'Profile invoice field parse' });
  const box = async (locator) => {
    await expect(locator).toBeVisible();
    return locator.boundingBox();
  };
  const bottom = (b) => b.y + b.height;

  const header = await box(page.getByRole('banner'));
  const pill = await box(hero.getByText('Inference online', { exact: true }).locator('..'));
  const title = await box(invoice.getByText('Profile Invoice', { exact: true }));
  const panel = await box(invoice);
  const estimate = await box(hero.getByRole('link', { name: 'Request a Project Estimate' }));
  const credentialValue = await box(invoice.getByText('Top Rated Plus', { exact: true }));
  const caption = await box(invoice.getByText('Upwork freelancer', { exact: true }));
  const rateLabel = await box(invoice.getByText('Rate', { exact: true }));
  const rateValue = await box(invoice.getByText('€45/hour', { exact: true }));

  expect(title.y - bottom(pill)).toBeGreaterThanOrEqual(8);
  // #191 asks for one consistent panel-to-actions gap inside 16-24 px.
  expect(estimate.y - bottom(panel)).toBeCloseTo(16, 0);
  const captionToNextLabel = rateLabel.y - bottom(caption);
  expect(captionToNextLabel).toBeGreaterThanOrEqual(rateValue.y - bottom(rateLabel));
  expect(captionToNextLabel).toBeGreaterThanOrEqual(caption.y - bottom(credentialValue) + 4);
  if (requireMobileHeaderGap) expect(pill.y - bottom(header)).toBeGreaterThanOrEqual(8);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);

  await expect(invoice).toBeVisible();
  for (const badge of ['engineer · 0.99', 'ID 001 · TRACKED', 'REC']) {
    await expect(hero.getByText(badge, { exact: true })).toBeVisible();
  }
  // Violet portrait L-brackets (the static frame corners) stay in the DOM.
  await expect(hero.locator('div.absolute.inset-1.pointer-events-none > span')).toHaveCount(4);
};

for (const width of [320, 390, 720, 768, 1024, 1440]) {
  test(`hero invoice labels and actions keep their gaps at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await assertHeroInvoiceGaps(page, { requireMobileHeaderGap: width < 768 });
  });
}

// #253 AC6 / #191: real Chromium browser zoom (chrome.tabs.setZoom), not CDP page scale.
// Browser zoom changes the layout viewport (innerWidth halves); pinch/visual zoom does not.
test('hero invoice gaps hold under Chromium 200% browser zoom', async ({ browserName }, testInfo) => {
  test.skip(browserName !== 'chromium', 'chrome.tabs.setZoom needs Chromium with a loaded MV3 extension.');

  const extensionPath = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    'fixtures/browser-zoom-extension',
  );
  const userDataDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'qa-browser-zoom-'));
  let context;
  try {
    // Claim project-merged keys so runBeforeCreateBrowserContext cannot inject
    // iPhone isMobile/hasTouch or Desktop/iPhone deviceScaleFactor (incompatible with
    // viewport:null). Always allow service workers so the zoom extension SW can load
    // even under QA_LOCAL_ONLY (project would otherwise set serviceWorkers:block).
    context = await chromium.launchPersistentContext(userDataDir, {
      channel: 'chromium',
      headless: true,
      viewport: null,
      isMobile: false,
      hasTouch: false,
      // undefined claims the key so runBeforeCreateBrowserContext will not merge
      // project deviceScaleFactor (Desktop Chrome=1 / iPhone=3); omit would still merge.
      deviceScaleFactor: undefined,
      serviceWorkers: 'allow',
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--window-size=1440,900',
      ],
    });

    // Persistent context bypasses qa-test.js auto fixtures — install guards explicitly.
    if (process.env.QA_LOCAL_ONLY === '1') {
      await context.routeWebSocket('**/*', guardLocalWebSocket);
      await context.route('**/*', async (route) => {
        await guardLocalNavigation(route);
      });
    }

    let [serviceWorker] = context.serviceWorkers();
    if (!serviceWorker) {
      serviceWorker = await context.waitForEvent('serviceworker', { timeout: 15_000 });
    }

    const page = context.pages()[0] || await context.newPage();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const baseURL = testInfo.project.use.baseURL;
    await page.goto(baseURL);

    const before = await page.evaluate(() => ({
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      scale: window.visualViewport?.scale ?? 1,
    }));

    await serviceWorker.evaluate(async (targetOrigin) => {
      const tabs = await chrome.tabs.query({});
      const tab = tabs.find((candidate) => candidate.url?.startsWith(targetOrigin))
        || tabs.find((candidate) => candidate.active);
      if (!tab?.id) throw new Error(`No tab found for ${targetOrigin}`);
      await chrome.tabs.setZoom(tab.id, 2);
    }, new URL(baseURL).origin);

    await expect.poll(async () => {
      const metrics = await page.evaluate(() => ({
        innerWidth: window.innerWidth,
        scale: window.visualViewport?.scale ?? 1,
      }));
      return metrics.innerWidth <= before.innerWidth * 0.55 && Math.abs(metrics.scale - 1) < 0.05;
    }, { timeout: 15_000 }).toBe(true);

    const after = await page.evaluate(() => ({
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      scale: window.visualViewport?.scale ?? 1,
    }));
    testInfo.annotations.push({ type: 'native-zoom-viewport', description: JSON.stringify({ before, after }) });
    // Prove browser zoom (layout viewport shrinks), not pinch/visual zoom.
    expect(after.scale).toBeCloseTo(1, 1);
    expect(after.innerWidth).toBeGreaterThanOrEqual(Math.floor(before.innerWidth / 2) - 2);
    expect(after.innerWidth).toBeLessThanOrEqual(Math.ceil(before.innerWidth / 2) + 2);

    await assertHeroInvoiceGaps(page, {
      requireMobileHeaderGap: after.innerWidth < 768,
    });

    // #297 labels are not on production yet. This file also runs in prod-* projects.
    if (!testInfo.project.name.startsWith('prod-')) {
      const invoice = page.getByRole('article', { name: 'Profile invoice field parse' });
      const labels = invoice.locator('.hero-field-label');
      const expectedLabels = ['Name · 0.99', 'Role · 0.97', 'Credential · 0.98', 'Success · 0.96', 'Rate · 0.95', 'Location · 0.94'];
      const readGeometry = () => invoice.locator('[data-hero-field]').evaluateAll((fields) => fields.map((field) => {
        const frame = field.getBoundingClientRect();
        const label = field.querySelector('.hero-field-label').getBoundingClientRect();
        const value = field.querySelector('.hero-field-value').getBoundingClientRect();
        const column = field.parentElement.getBoundingClientRect();
        return {
          id: field.dataset.heroField,
          x: frame.x, y: frame.y, width: frame.width, height: frame.height,
          labelLeft: label.left - frame.left,
          labelRight: frame.right - label.right,
          labelCenter: label.top + label.height / 2 - frame.top,
          cornerTop: Number.parseFloat(getComputedStyle(field, '::before').top),
          valueGap: value.top - label.bottom,
          valueLeft: value.left - frame.left,
          valueRight: frame.right - value.right,
          columnLeft: frame.left - column.left,
          columnRight: column.right - frame.right,
        };
      }));
      const initialGeometry = await readGeometry();
      for (const field of initialGeometry) {
        expect(field.labelLeft, `${field.id}: 5px gap after 12px stroke at native zoom`).toBeCloseTo(17, 1);
        expect(field.labelRight, `${field.id}: right corner clearance`).toBeGreaterThanOrEqual(16.9);
        expect(field.labelCenter).toBeCloseTo(field.cornerTop, 1);
        expect(field.valueGap).toBeGreaterThanOrEqual(1.9);
        expect(field.valueLeft).toBeGreaterThanOrEqual(6.9);
        expect(field.valueRight).toBeGreaterThanOrEqual(6.9);
        expect(field.columnLeft).toBeGreaterThanOrEqual(-0.1);
        expect(field.columnRight).toBeGreaterThanOrEqual(-0.1);
      }
      await expect(labels).toHaveText(expectedLabels);
      const portrait = page.getByText('engineer · 0.99', { exact: true });
      const tag = await portrait.boundingBox();
      const frame = await portrait.locator('..').boundingBox();
      expect(tag.x - frame.x).toBeCloseTo(29, 1);
      expect(Math.abs(tag.y + tag.height / 2 - frame.y)).toBeLessThanOrEqual(0.5);
      expect(frame.x + frame.width - tag.x - tag.width).toBeGreaterThanOrEqual(29);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

      await page.clock.install({ time: new Date('2026-10-04T08:00:00Z') });
      await page.clock.pauseAt(new Date('2026-10-04T08:00:01Z'));
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      const hero = page.locator('section[data-hero-highlight-index]');
      for (const [index, pair] of [['name', 'role'], ['credential', 'success'], ['rate', 'location']].entries()) {
        if (index) await page.clock.runFor(index === 1 ? 2200 : 2000);
        await expect(hero).toHaveAttribute('data-hero-highlight-index', String(index));
        await expect.poll(() => invoice.locator('.hero-field-label').evaluateAll((elements) => elements
          .filter((element) => Number(getComputedStyle(element).opacity) === 1)
          .map((element) => element.parentElement.dataset.heroField))).toEqual(pair);
        await expect(labels).toHaveText(expectedLabels);
        expect(await readGeometry()).toEqual(initialGeometry);
      }
    }

  } finally {
    await context?.close();
    await fs.promises.rm(userDataDir, { recursive: true, force: true });
  }
});

// #252: the portrait `sizes` values are hard-coded to the measured frames. If a frame
// widens without a `sizes` update, the browser keeps picking a candidate that is too small.
const portraitDensityCases = [
  { width: 390, height: 844, dpr: 3 },
  { width: 412, height: 823, dpr: 1.75 },
  { width: 768, height: 1024, dpr: 2 },
  { width: 1440, height: 900, dpr: 2 },
];

// #298: the About crop has 64 source pixels above the first hair at y=182
// in the authentic photograph. Its 800x664 geometry is exactly 64px taller
// than 4:3, so bottom + 5px positioning puts that landmark at 5 CSS pixels.
for (const viewport of [
  { width: 1440, height: 900 },
  { width: 980, height: 1324 },
  { width: 390, height: 844 },
  { width: 320, height: 844 },
]) {
  for (const arrival of ['cold scroll', 'direct anchor']) {
    test(`About portrait has fixed hair headroom and loads on ${arrival} at ${viewport.width}px (#298)`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name.startsWith('prod-'), 'The About crop must be released before asserting it on production.');
      await page.setViewportSize(viewport);
      let releaseImages;
      const imagesReleased = new Promise((resolve) => { releaseImages = resolve; });
      await page.route('**/vivek-about-*.webp', async (route) => {
        await imagesReleased;
        await route.continue();
      });
      await page.goto(arrival === 'direct anchor' ? '/#about' : '/', { waitUntil: 'domcontentloaded' });
      const image = page.getByAltText('Portrait of Vivek Patel');
      if (arrival === 'direct anchor') await expect(image).toBeInViewport();
      else await image.scrollIntoViewIfNeeded();
      const before = await image.boundingBox();
      releaseImages();
      // Lazy loading/srcset selection can still be pending after scrolling.
      // Wait for the chosen image before decode(), which rejects if it changes.
      await expect.poll(() => image.evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
      await image.evaluate((img) => img.decode());
      await expect(image).toBeInViewport();
      const after = await image.boundingBox();
      expect(after.width).toBe(before.width);
      expect(after.height).toBe(before.height);

      const composition = await image.evaluate((img) => {
        const box = img.getBoundingClientRect();
        const photo = img.closest('.photo-area').getBoundingClientRect();
        const scale = Math.max(box.width / 800, box.height / 664);
        return {
          complete: img.complete && img.naturalWidth > 0,
          currentSrc: img.currentSrc,
          objectFit: getComputedStyle(img).objectFit,
          objectPosition: getComputedStyle(img).objectPosition,
          ratio: photo.width / photo.height,
          hairGap: box.height - 664 * scale + 5 + 64 * scale,
          sources: img.srcset.split(',').map((entry) => entry.trim().split(/\s+/)[0]),
        };
      });
      expect(composition.complete).toBe(true);
      expect(composition.currentSrc).toContain('/vivek-about-');
      expect(composition.objectFit).toBe('cover');
      expect(composition.objectPosition).toBe('50% calc(100% + 5px)');
      expect(composition.ratio).toBeCloseTo(4 / 3, 2);
      // Chromium quantizes the 4:3 frame to 1/64 CSS px (980px is 0.0078px short).
      expect(Math.abs(composition.hairGap - 5)).toBeLessThanOrEqual(1 / 64);

      // A missing candidate must fail even when a different srcset choice loads.
      for (const url of composition.sources) {
        const response = await page.request.get(url);
        expect(response.status(), url).toBe(200);
        expect(response.headers()['content-type'], url).toContain('image/webp');
        expect(await page.evaluate(async (src) => {
          const candidate = new Image();
          candidate.src = src;
          await candidate.decode();
          return candidate.complete && candidate.naturalWidth > 0;
        }, url)).toBe(true);
      }
    });
  }
}

const loadedPortraitDensity = (image) => image.evaluate(async (img) => {
  // A plain Image without srcset reports the chosen file's real pixel width.
  const file = new Image();
  file.src = img.currentSrc;
  await file.decode();
  return {
    currentSrc: img.currentSrc,
    fileWidth: file.naturalWidth,
    neededWidth: img.getBoundingClientRect().width * window.devicePixelRatio,
  };
});

for (const vp of portraitDensityCases) {
  test.describe(`portrait candidates at ${vp.width}x${vp.height}@${vp.dpr}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.dpr });

    test('hero and About portraits load a file at least as wide as their device pixels', async ({ page }) => {
      await page.goto('/');
      for (const alt of ['Tracked engineer portrait', 'Portrait of Vivek Patel']) {
        const image = page.getByAltText(alt);
        await image.scrollIntoViewIfNeeded();
        await expect.poll(() => image.evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
        const density = await loadedPortraitDensity(image);
        expect(density.fileWidth, `${alt} → ${density.currentSrc}`).toBeGreaterThanOrEqual(Math.floor(density.neededWidth));
      }
    });
  });
}

test('mobile cookie banner leaves the hero estimate CTA clickable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.removeItem('cookie_consent_preferences'));
  await page.goto('/');
  const banner = page.getByRole('dialog', { name: /we value your privacy/i });
  await expect(banner).toBeVisible({ timeout: 5000 });
  await waitForConsentBannerEntrance(banner);
  const cta = page.getByRole('link', { name: /Request a Project Estimate/i }).first();
  const bannerBox = await banner.boundingBox();
  const ctaBox = await cta.boundingBox();
  expect(bannerBox).toBeTruthy();
  expect(ctaBox).toBeTruthy();
  expect(boxesOverlap(bannerBox, ctaBox)).toBe(false);
  await cta.click();
  await expect(page).toHaveURL(/\/contact/);
});

test('desktop cookie banner is a full-width horizontal strip', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.addInitScript(() => localStorage.removeItem('cookie_consent_preferences'));
  await page.goto('/');
  const banner = page.getByRole('dialog', { name: /we value your privacy/i });
  await expect(banner).toBeVisible({ timeout: 5000 });
  await waitForConsentBannerEntrance(banner);
  const box = await banner.boundingBox();
  expect(box.width).toBeGreaterThan(1200);
  expect(box.x).toBeLessThan(10);
  expect(box.y).toBeGreaterThan(60);
  expect(box.y).toBeLessThan(80);
});

test('expanded cookie settings stay reachable on a short phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.addInitScript(() => localStorage.removeItem('cookie_consent_preferences'));
  await page.goto('/');
  const optionsButton = page.getByRole('button', { name: /Options/i });
  await expect(optionsButton).toBeVisible({ timeout: 5000 });
  await expect(optionsButton).toBeEnabled();
  await optionsButton.click();
  await expect(page.getByRole('button', { name: /Save Preferences/i })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(overflow).toBe(false);
});

test('reduced motion still shows a safe cookie banner layout', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => localStorage.removeItem('cookie_consent_preferences'));
  await page.goto('/');
  const banner = page.getByRole('dialog', { name: /we value your privacy/i });
  await expect(banner).toBeVisible({ timeout: 5000 });
  await waitForConsentBannerEntrance(banner);
  const cta = page.getByRole('link', { name: /Request a Project Estimate/i }).first();
  const bannerBox = await banner.boundingBox();
  const ctaBox = await cta.boundingBox();
  expect(boxesOverlap(bannerBox, ctaBox)).toBe(false);
});
