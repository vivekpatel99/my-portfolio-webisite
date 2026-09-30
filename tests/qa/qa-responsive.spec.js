import { expect, test } from './qa-test.js';

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
        .getByRole('button', { name: /Request a Project Estimate/i })).toBeVisible();
    } else {
      await expect(header.getByRole('button', { name: /Request Estimate/i })).toBeVisible();
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
  await page.getByRole('dialog', { name: 'Navigation menu' }).getByRole('button', { name: /Request a Project Estimate/i }).click();
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
    const estimate = await hero.getByRole('button', { name: 'Request a Project Estimate' }).boundingBox();
    const caseStudies = await hero.getByRole('link', { name: 'View Case Studies' }).boundingBox();
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
      expect(role.x).toBeGreaterThan(name.x);
      const scanLabel = await invoiceElement.getByText('doc · extract · 0.97').boundingBox();
      expect(boxesOverlap(scanLabel, await invoiceTitle.boundingBox())).toBe(false);
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
// 720 is the 1440 px desktop at 200% zoom (#191).
for (const width of [320, 390, 720, 768, 1024, 1440]) {
  test(`hero invoice labels and actions keep their gaps at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const hero = page.locator('#main-content section').first();
    const invoice = hero.getByRole('article', { name: 'Profile invoice field parse' });
    const box = async (locator) => {
      await expect(locator).toBeVisible();
      return locator.boundingBox();
    };
    const bottom = (b) => b.y + b.height;

    const header = await box(page.getByRole('banner'));
    const pill = await box(hero.getByText('Inference online', { exact: true }).locator('..'));
    const scanLabel = await box(invoice.getByText('doc · extract · 0.97', { exact: true }));
    const title = await box(invoice.getByText('Profile Invoice', { exact: true }));
    const panel = await box(invoice);
    const estimate = await box(hero.getByRole('button', { name: 'Request a Project Estimate' }));
    const credentialValue = await box(invoice.getByText('Top Rated Plus', { exact: true }));
    const caption = await box(invoice.getByText('Upwork freelancer', { exact: true }));
    const rateLabel = await box(invoice.getByText('Rate', { exact: true }));
    const rateValue = await box(invoice.getByText('€45/hour', { exact: true }));

    expect(scanLabel.y - bottom(pill)).toBeGreaterThanOrEqual(4);
    expect(title.y - bottom(scanLabel)).toBeGreaterThanOrEqual(4);
    // #191 asks for one consistent panel-to-actions gap inside 16-24 px.
    expect(estimate.y - bottom(panel)).toBeCloseTo(20, 0);
    const captionToNextLabel = rateLabel.y - bottom(caption);
    expect(captionToNextLabel).toBeGreaterThanOrEqual(rateValue.y - bottom(rateLabel));
    expect(captionToNextLabel).toBeGreaterThanOrEqual(caption.y - bottom(credentialValue) + 4);
    if (width < 768) expect(pill.y - bottom(header)).toBeGreaterThanOrEqual(8);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
  });
}

test('mobile cookie banner leaves the hero estimate CTA clickable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.removeItem('cookie_consent_preferences'));
  await page.goto('/');
  const banner = page.getByRole('dialog', { name: /we value your privacy/i });
  await expect(banner).toBeVisible({ timeout: 5000 });
  const cta = page.getByRole('button', { name: /Request a Project Estimate/i }).first();
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
  const cta = page.getByRole('button', { name: /Request a Project Estimate/i }).first();
  const bannerBox = await banner.boundingBox();
  const ctaBox = await cta.boundingBox();
  expect(boxesOverlap(bannerBox, ctaBox)).toBe(false);
});
