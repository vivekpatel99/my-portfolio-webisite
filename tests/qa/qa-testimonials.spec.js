import { expect, test } from './qa-test.js';
import { testimonials as testimonialData } from '../../src/data/testimonials.js';

// Longer than one 6s rotation interval, so an unexpected advance is observable.
const OVER_ONE_INTERVAL_MS = 7_000;
const PERSISTENT_PAUSE_MS = 20_500;
const MIN_TARGET_PX = 24;
const slideCount = testimonialData.length;
const counterFor = (index) => `${String(index + 1).padStart(2, '0')} / ${String(slideCount).padStart(2, '0')}`;

test.beforeEach(async ({ page }) => {
  // Install before application timers; keep rendering and interactions running normally.
  await page.clock.install();
  // Keep the consent banner from covering the controls on narrow viewports.
  await page.addInitScript(() => {
    localStorage.setItem(
      'cookie_consent_preferences',
      JSON.stringify({ essential: true, analytics: false, sentry: false, decidedAt: new Date().toISOString() }),
    );
  });
});

async function openCarousel(page) {
  await page.goto('/');
  const section = page.locator('#testimonials');
  await section.scrollIntoViewIfNeeded();
  const carousel = section.getByRole('region', { name: 'Client testimonials' });
  await expect(carousel).toBeVisible();
  return {
    carousel,
    counter: section.locator('.count b'),
    quote: carousel.getByRole('group', { name: new RegExp(`of ${slideCount}$`) }),
    slides: carousel.getByRole('button', { name: /^Slide \d+$/ }),
  };
}

// Remove every transient stop reason: pointer outside the carousel and no focus inside it.
async function leaveCarousel(page) {
  await page.mouse.move(1, 1);
  await page.evaluate(() => document.activeElement?.blur());
}

async function activate(locator, hasTouch) {
  if (hasTouch) await locator.tap();
  else await locator.click();
}

test('autoplay advances until the current slide dot is selected, then stays stopped for 20s', async ({ page, hasTouch }) => {
  test.setTimeout(90_000);
  const { carousel, counter } = await openCarousel(page);
  await expect(carousel.getByRole('button', { name: /play|pause/i })).toHaveCount(0);
  await leaveCarousel(page);
  const startedAt = await counter.textContent();
  await page.clock.runFor(OVER_ONE_INTERVAL_MS);
  await expect(counter).not.toHaveText(startedAt, { timeout: OVER_ONE_INTERVAL_MS + 2_000 });

  await activate(carousel.locator('button[aria-current="true"]'), hasTouch);
  const pausedAt = await counter.textContent();

  await leaveCarousel(page);
  await page.clock.runFor(PERSISTENT_PAUSE_MS);
  await expect(counter).toHaveText(pausedAt);
});

// Touch taps emit compatibility mouseenter events without a matching mouseleave.
test('tapping the quote holds focus but resumes rotation when focus leaves without a mouse move', async ({ page, hasTouch }) => {
  test.skip(!hasTouch, 'Touch compatibility events only occur on touch devices.');
  test.setTimeout(60_000);
  const { counter, quote } = await openCarousel(page);

  await quote.tap();
  await quote.focus();
  await expect(quote).toBeFocused();
  const heldAt = await counter.textContent();
  await page.clock.runFor(OVER_ONE_INTERVAL_MS);
  await expect(counter).toHaveText(heldAt);

  // Clear only real focus so a lingering focus hold cannot mask or fake the resume.
  await page.evaluate(() => {
    if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
  });
  expect(await page.evaluate(() => document.activeElement?.tagName)).toBe('BODY');
  const resumedFrom = await counter.textContent();
  await page.clock.runFor(OVER_ONE_INTERVAL_MS);
  await expect(counter).not.toHaveText(resumedFrom, { timeout: OVER_ONE_INTERVAL_MS + 2_000 });
});

test('keyboard traversal reaches quote and slides; chosen slide persists 20s', async ({ page }) => {
  test.setTimeout(90_000);
  const { carousel, counter, quote, slides } = await openCarousel(page);

  await quote.focus();
  await expect(quote).toBeFocused();
  for (let index = 0; index < slideCount; index += 1) {
    await page.keyboard.press('Tab');
    await expect(slides.nth(index)).toBeFocused();
  }
  await expect(carousel.getByRole('button')).toHaveCount(slideCount);
  await page.keyboard.press('Tab');
  expect(await carousel.evaluate((element) => element.contains(document.activeElement))).toBe(false);
  await slides.nth(1).focus();
  await page.keyboard.press('Enter');
  await expect(counter).toHaveText(counterFor(1));
  await expect(slides.nth(1)).toHaveAttribute('aria-current', 'true');

  await leaveCarousel(page);
  await page.clock.runFor(PERSISTENT_PAUSE_MS);
  await expect(counter).toHaveText(counterFor(1));
});

test('focusing the quote or a control stops auto-advance until focus leaves', async ({ page }) => {
  test.setTimeout(60_000);
  const { counter, quote, slides } = await openCarousel(page);
  await page.mouse.move(1, 1);

  for (const target of [quote, slides.nth(4)]) {
    await target.focus();
    const heldAt = await counter.textContent();
    await page.clock.runFor(OVER_ONE_INTERVAL_MS);
    await expect(counter).toHaveText(heldAt);
  }

  await leaveCarousel(page);
  const releasedAt = await counter.textContent();
  await page.clock.runFor(OVER_ONE_INTERVAL_MS);
  await expect(counter).not.toHaveText(releasedAt, { timeout: OVER_ONE_INTERVAL_MS + 2_000 });
});

test('overlapping hover and focus reasons each keep rotation stopped', async ({ page, hasTouch }) => {
  test.skip(hasTouch, 'Pointer hover is a desktop-only interaction.');
  test.setTimeout(60_000);
  const { carousel, counter, quote } = await openCarousel(page);

  await carousel.hover();
  await quote.focus();
  await page.mouse.move(1, 1);
  const heldByFocus = await counter.textContent();
  await page.clock.runFor(OVER_ONE_INTERVAL_MS);
  await expect(counter).toHaveText(heldByFocus);

  await carousel.hover();
  await page.evaluate(() => document.activeElement?.blur());
  await page.clock.runFor(OVER_ONE_INTERVAL_MS);
  await expect(counter).toHaveText(heldByFocus);

  await page.mouse.move(1, 1);
  await page.clock.runFor(OVER_ONE_INTERVAL_MS);
  await expect(counter).not.toHaveText(heldByFocus, { timeout: OVER_ONE_INTERVAL_MS + 2_000 });
});

test('controls are non-overlapping targets of at least 24x24 with decorative diamonds', async ({ page }) => {
  const { slides } = await openCarousel(page);
  const viewportWidth = page.viewportSize().width;

  const boxes = [];
  for (const target of await slides.all()) {
    const box = await target.boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(MIN_TARGET_PX);
    expect(box.height).toBeGreaterThanOrEqual(MIN_TARGET_PX);
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewportWidth);
    boxes.push(box);
  }
  for (let a = 0; a < boxes.length; a += 1) {
    for (let b = a + 1; b < boxes.length; b += 1) {
      const overlapX = Math.min(boxes[a].x + boxes[a].width, boxes[b].x + boxes[b].width) - Math.max(boxes[a].x, boxes[b].x);
      const overlapY = Math.min(boxes[a].y + boxes[a].height, boxes[b].y + boxes[b].height) - Math.max(boxes[a].y, boxes[b].y);
      expect(overlapX > 0.5 && overlapY > 0.5, `targets ${a} and ${b} overlap`).toBe(false);
    }
  }
  if (viewportWidth >= 640) {
    for (const box of boxes) {
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  }

  const marks = await slides.evaluateAll((buttons) => buttons.map((button) => {
    const mark = button.querySelector('span[aria-hidden="true"]');
    const style = mark ? getComputedStyle(mark) : null;
    return {
      buttonTransform: getComputedStyle(button).transform,
      markTransform: style?.transform ?? 'none',
      markColor: style?.backgroundColor ?? '',
      markSize: mark ? [mark.offsetWidth, mark.offsetHeight] : [],
      current: button.getAttribute('aria-current') === 'true',
    };
  }));
  for (const mark of marks) {
    expect(mark.buttonTransform).toBe('none');
    expect(mark.markTransform).not.toBe('none');
    expect(mark.markSize).toEqual(mark.current ? [8, 8] : [5, 5]);
  }
  expect(marks.find((mark) => mark.current).markColor).toBe('rgb(139, 92, 246)');
});

test('focused quote and controls show a visible outline during keyboard traversal', async ({ page }) => {
  const { quote, slides } = await openCarousel(page);
  const expectVisibleOutline = async (target) => {
    await expect(target).toBeFocused();
    const outline = await target.evaluate((element) => {
      const style = getComputedStyle(element);
      return { style: style.outlineStyle, width: parseFloat(style.outlineWidth) };
    });
    expect(outline.style).not.toBe('none');
    expect(outline.width).toBeGreaterThanOrEqual(2);
  };

  await quote.focus();
  await expectVisibleOutline(quote);
  await page.keyboard.press('Tab');
  await expectVisibleOutline(slides.first());
  for (let index = 1; index < slideCount; index += 1) {
    await page.keyboard.press('Tab');
    await expectVisibleOutline(slides.nth(index));
  }
});

test('reduced motion shows autoplay off, offers no playback control, and keeps manual slides usable', async ({ page, hasTouch }) => {
  test.setTimeout(60_000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const { carousel, counter, slides } = await openCarousel(page);

  await expect(counter).toHaveText(counterFor(0));
  await expect(carousel.getByText('Autoplay off · Reduced motion')).toBeVisible();
  await expect(carousel.getByRole('button', { name: /play|pause/i })).toHaveCount(0);

  await activate(slides.nth(2), hasTouch);
  await expect(counter).toHaveText(counterFor(2));
  await expect(slides.nth(2)).toHaveAttribute('aria-current', 'true');

  await leaveCarousel(page);
  await page.clock.runFor(OVER_ONE_INTERVAL_MS * 2);
  await expect(counter).toHaveText(counterFor(2));
});

test('motion-preference changes preserve the focused slide hold until focus leaves', async ({ page }) => {
  test.setTimeout(60_000);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const { carousel, counter, slides } = await openCarousel(page);

  await page.mouse.move(1, 1);
  await slides.first().focus();
  const heldAt = await counter.textContent();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(carousel.getByText('Autoplay off · Reduced motion')).toBeVisible();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(carousel.getByText('Autoplay off · Reduced motion')).toHaveCount(0);
  await expect(slides.first()).toBeFocused();
  await page.clock.runFor(OVER_ONE_INTERVAL_MS);
  await expect(counter).toHaveText(heldAt);

  await leaveCarousel(page);
  expect(await page.evaluate(() => document.activeElement === document.body)).toBe(true);
  const releasedAt = await counter.textContent();
  await page.clock.runFor(OVER_ONE_INTERVAL_MS);
  await expect(counter).not.toHaveText(releasedAt, { timeout: OVER_ONE_INTERVAL_MS + 2_000 });
});

test('a manually chosen slide stays stopped after reduced motion is switched off', async ({ page, hasTouch }) => {
  test.setTimeout(60_000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const { counter, slides } = await openCarousel(page);
  await activate(slides.nth(1), hasTouch);
  await expect(counter).toHaveText(counterFor(1));
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await leaveCarousel(page);
  await page.clock.runFor(PERSISTENT_PAUSE_MS);
  await expect(counter).toHaveText(counterFor(1));
});
