import { expect, test } from './qa-test.js';

const HERO = 'section:has(article[aria-label="Profile invoice field parse"])';
const IN_VIEW_ANIMATIONS = [
  ...Array(6).fill('bg-drift'),
  ...Array(2).fill('bg-drift-pulse'),
  'ghost-trail-a', 'ghost-trail-b', 'ghost-trail-c', 'ghost-trail-d',
  'photo-scan',
].sort();
const MEASURE_MS = 2000;
const COOKIE_CONSENT_KEY = 'cookie_consent_preferences';

async function installWriteProbe(page) {
  await page.addInitScript((consentKey) => {
    // Hold consent constant so the first-visit banner spacer cannot shift hero layout mid-measurement.
    localStorage.setItem(consentKey, JSON.stringify({ necessary: true, analytics: false }));
    window.__heroMotionProbe = { writes: 0 };
    const setProperty = CSSStyleDeclaration.prototype.setProperty;
    CSSStyleDeclaration.prototype.setProperty = function probedSetProperty(name, ...rest) {
      if (name === '--px' || name === '--py') window.__heroMotionProbe.writes += 1;
      return setProperty.call(this, name, ...rest);
    };
  }, COOKIE_CONSENT_KEY);
}

const readWrites = (page) => page.evaluate(() => window.__heroMotionProbe.writes);

async function writesDuring(page, ms = MEASURE_MS) {
  const start = await readWrites(page);
  await page.waitForTimeout(ms);
  return (await readWrites(page)) - start;
}

const runningHeroAnimations = (page) => page.evaluate((selector) => {
  const hero = document.querySelector(selector);
  return document.getAnimations()
    .filter((animation) => animation.playState === 'running'
      && animation.animationName
      && hero.contains(animation.effect?.target))
    .map((animation) => animation.animationName)
    .sort();
}, HERO);

const hasFinePointer = (page) => page.evaluate(() => window.matchMedia('(pointer: fine)').matches);

async function openHome(page) {
  await installWriteProbe(page);
  await page.goto('/');
  await expect(page.locator(HERO)).toBeVisible();
}

const heroPointer = (page) => page.evaluate((selector) => {
  const hero = document.querySelector(selector);
  const rect = hero.getBoundingClientRect();
  const x = Math.round(rect.left + rect.width * 0.75);
  const y = Math.round(Math.max(rect.top, 0) + 120);
  if (!hero.contains(document.elementFromPoint(x, y))) throw new Error('hero pointer target is covered');
  return { x, y };
}, HERO);

const outsideHeroPointer = (page) => page.evaluate(() => {
  const rect = document.querySelector('header').getBoundingClientRect();
  return { x: Math.round(rect.left + 8), y: Math.round(rect.top + rect.height / 2) };
});

const expectedPositions = (page, point) => page.evaluate(({ selector, x, y }) => {
  const hero = document.querySelector(selector);
  const rect = hero.getBoundingClientRect();
  const targetX = (((x - rect.left) / rect.width) * 2 - 1) * 20;
  const targetY = (((y - rect.top) / rect.height) * 2 - 1) * 20;
  return Array.from(hero.querySelectorAll('[data-depth]'), (box) => {
    const depth = Number(box.getAttribute('data-depth'));
    return [`${(targetX * depth).toFixed(2)}px`, `${(targetY * depth).toFixed(2)}px`];
  });
}, { selector: HERO, ...point });

const boxPositions = (page) => page.evaluate((selector) => Array.from(
  document.querySelector(selector).querySelectorAll('[data-depth]'),
  (box) => [box.style.getPropertyValue('--px'), box.style.getPropertyValue('--py')],
), HERO);

const isNeutral = (positions) => positions.every((pair) => pair.every((value) => value === '' || parseFloat(value) === 0));

const layoutRects = (page) => page.evaluate((selector) => {
  const hero = document.querySelector(selector);
  const targets = [
    hero.querySelector('article[aria-label="Profile invoice field parse"]'),
    ...hero.querySelectorAll('[data-hero-field]'),
    ...hero.querySelectorAll('a, button'),
    hero.querySelector('img[alt="Tracked engineer portrait"]'),
  ];
  return targets.map((element) => {
    const { x, y, width, height } = element.getBoundingClientRect();
    return [x, y, width, height];
  });
}, HERO);

async function scrollHeroOffscreen(page) {
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
  await expect.poll(() => page.locator(HERO).evaluate((hero) => hero.getBoundingClientRect().bottom)).toBeLessThan(0);
}

async function scrollHeroIntoView(page) {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
}

test.describe('hero motion work (#232)', () => {
  test('idle hero and keyboard focus perform no parallax writes while CSS animations run', async ({ page }) => {
    await openHome(page);
    await expect.poll(() => runningHeroAnimations(page)).toEqual(IN_VIEW_ANIMATIONS);
    expect(await writesDuring(page), 'idle --px/--py writes').toBe(0);

    const cta = page.locator('section[data-hero-motion]').getByRole('link', { name: 'Request a Project Estimate', exact: true });
    for (let presses = 0; presses < 40 && !(await cta.evaluate((el) => el === document.activeElement)); presses += 1) {
      await page.keyboard.press('Tab');
    }
    await expect(cta).toBeFocused();
    expect(await writesDuring(page, 1000), 'keyboard focus --px/--py writes').toBe(0);
  });

  test('fine pointer move applies the existing parallax, settles exactly, then goes idle', async ({ page }) => {
    await openHome(page);
    test.skip(!(await hasFinePointer(page)), 'requires a fine primary pointer');
    const hero = page.locator(HERO);
    const layoutBefore = await layoutRects(page);

    const point = await heroPointer(page);
    const target = await expectedPositions(page, point);
    expect(isNeutral(target), 'test pointer must produce a visible shift').toBe(false);
    await page.mouse.move(point.x, point.y, { steps: 4 });
    await expect.poll(() => readWrites(page)).toBeGreaterThan(0);
    await expect.poll(() => boxPositions(page), { timeout: 5000 }).toEqual(target);
    expect(await writesDuring(page), 'settled --px/--py writes').toBe(0);

    expect(await layoutRects(page)).toEqual(layoutBefore);
    for (const badge of ['Inference online', 'doc · extract · 0.97', 'engineer · 0.99', 'ID 001 · TRACKED', 'REC']) {
      await expect(hero.getByText(badge, { exact: true })).toBeVisible();
    }
    await expect(hero.locator('[data-hero-field].invoice-field-corners')).toHaveCount(2);
    await expect.poll(() => runningHeroAnimations(page)).toEqual(IN_VIEW_ANIMATIONS);

    const outside = await outsideHeroPointer(page);
    await page.mouse.move(outside.x, outside.y);
    await expect.poll(async () => isNeutral(await boxPositions(page)), { timeout: 5000 }).toBe(true);
    expect(await writesDuring(page), 'after-leave --px/--py writes').toBe(0);
  });

  test('offscreen hero stops writes and named animations, and resumes without a loop', async ({ page }) => {
    await openHome(page);
    const fine = await hasFinePointer(page);
    if (fine) {
      const point = await heroPointer(page);
      await page.mouse.move(point.x, point.y, { steps: 4 });
      const outside = await outsideHeroPointer(page);
      await page.mouse.move(outside.x, outside.y);
    }

    await scrollHeroOffscreen(page);
    await page.waitForTimeout(250);
    expect(await writesDuring(page), 'offscreen --px/--py writes').toBe(0);
    expect(await runningHeroAnimations(page), 'offscreen running hero animations').toEqual([]);

    await scrollHeroIntoView(page);
    await expect.poll(() => runningHeroAnimations(page)).toEqual(IN_VIEW_ANIMATIONS);
    expect(await writesDuring(page, 1000), 'resumed idle --px/--py writes').toBe(0);

    if (fine) {
      const point = await heroPointer(page);
      const target = await expectedPositions(page, point);
      await page.mouse.move(point.x, point.y, { steps: 4 });
      await expect.poll(() => boxPositions(page), { timeout: 5000 }).toEqual(target);
    }
  });

  test('coarse primary pointer input starts no parallax loop', async ({ page }) => {
    await openHome(page);
    test.skip(await hasFinePointer(page), 'requires a coarse primary pointer');
    await expect.poll(() => runningHeroAnimations(page)).toEqual(IN_VIEW_ANIMATIONS);

    const point = await heroPointer(page);
    await page.touchscreen.tap(point.x, point.y);
    await page.mouse.move(point.x, point.y, { steps: 4 });
    expect(await writesDuring(page), 'coarse pointer --px/--py writes').toBe(0);
    expect(isNeutral(await boxPositions(page))).toBe(true);
  });

  test('reduced motion disables parallax and named animations, including changes after load', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openHome(page);
    const fine = await hasFinePointer(page);
    const point = await heroPointer(page);

    await page.mouse.move(point.x, point.y, { steps: 4 });
    expect(await writesDuring(page), 'reduced-motion --px/--py writes').toBe(0);
    expect(await runningHeroAnimations(page)).toEqual([]);

    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await expect.poll(() => runningHeroAnimations(page)).toEqual(IN_VIEW_ANIMATIONS);
    if (fine) {
      const target = await expectedPositions(page, point);
      await page.mouse.move(point.x + 1, point.y, { steps: 2 });
      await page.mouse.move(point.x, point.y);
      await expect.poll(() => boxPositions(page), { timeout: 5000 }).toEqual(target);
    }

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect.poll(() => runningHeroAnimations(page)).toEqual([]);
    expect(isNeutral(await boxPositions(page))).toBe(true);
    await page.mouse.move(point.x - 40, point.y, { steps: 4 });
    expect(await writesDuring(page), 'reduced-motion change --px/--py writes').toBe(0);
  });
});
