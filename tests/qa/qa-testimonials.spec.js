import { expect, test } from './qa-test.js';
import { testimonials as testimonialData } from '../../src/data/testimonials.js';
import { socialLinks } from '../../src/config/links.js';

// Longer than one 6s rotation interval, so an unexpected advance is observable.
const OVER_ONE_INTERVAL_MS = 7_000;
const PERSISTENT_PAUSE_MS = 20_500;
const MIN_TARGET_PX = 44;
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

  // Exercise touch compatibility events without opening the external profile in this focus test.
  await quote.evaluate((element) => element.addEventListener('click', (event) => event.preventDefault(), { once: true }));
  await quote.tap();
  await quote.getByRole('link').focus();
  await expect(quote.getByRole('link')).toBeFocused();
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

test('keyboard traversal reaches the named card action and slides; chosen slide persists 20s', async ({ page }) => {
  test.setTimeout(90_000);
  const { carousel, counter, slides } = await openCarousel(page);

  const profileLink = carousel.getByRole('link', { name: 'View my Upwork profile (opens in a new tab)' });
  await profileLink.focus();
  await expect(profileLink).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  expect(await carousel.evaluate(element => element.contains(document.activeElement))).toBe(false);
  await page.keyboard.press('Tab');
  await expect(profileLink).toBeFocused();
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

test('focusing the profile link or a control stops auto-advance until focus leaves', async ({ page }) => {
  test.setTimeout(60_000);
  const { carousel, counter, quote, slides } = await openCarousel(page);
  await page.mouse.move(1, 1);

  for (const target of [carousel.getByRole('link'), slides.nth(4)]) {
    await target.focus();
    await expect(quote).toHaveAttribute('aria-live', 'polite');
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
  await quote.getByRole('link').focus();
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

test('controls are non-overlapping targets of at least 44x44 with decorative diamonds', async ({ page }) => {
  const { slides } = await openCarousel(page);
  const viewportWidth = page.viewportSize().width;

  // Capture one layout frame: entrance motion can move wrapped rows between
  // separate boundingBox calls and make disjoint targets appear to overlap.
  const boxes = await slides.evaluateAll((buttons) => buttons.map((button) => {
    const { x, y, width, height } = button.getBoundingClientRect();
    return { x, y, width, height };
  }));
  for (const box of boxes) {
    expect(box.width).toBeGreaterThanOrEqual(MIN_TARGET_PX);
    expect(box.height).toBeGreaterThanOrEqual(MIN_TARGET_PX);
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewportWidth);
  }
  for (let a = 0; a < boxes.length; a += 1) {
    for (let b = a + 1; b < boxes.length; b += 1) {
      const overlapX = Math.min(boxes[a].x + boxes[a].width, boxes[b].x + boxes[b].width) - Math.max(boxes[a].x, boxes[b].x);
      const overlapY = Math.min(boxes[a].y + boxes[a].height, boxes[b].y + boxes[b].height) - Math.max(boxes[a].y, boxes[b].y);
      expect(overlapX > 0.5 && overlapY > 0.5, `targets ${a} and ${b} overlap`).toBe(false);
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

test('focused card action and controls show a visible outline during keyboard traversal', async ({ page }) => {
  const { carousel, quote, slides } = await openCarousel(page);
  const expectVisibleOutline = async (target) => {
    await expect(target).toBeFocused();
    const outline = await target.evaluate((element) => {
      const style = getComputedStyle(element);
      return { style: style.outlineStyle, width: parseFloat(style.outlineWidth) };
    });
    expect(outline.style).not.toBe('none');
    expect(outline.width).toBeGreaterThanOrEqual(2);
  };

  const profileLink = carousel.getByRole('link');
  await profileLink.focus();
  await expectVisibleOutline(profileLink);
  const cardOutline = await quote.evaluate((element) => {
    const style = getComputedStyle(element);
    return { style: style.outlineStyle, width: parseFloat(style.outlineWidth) };
  });
  expect(cardOutline.style).not.toBe('none');
  expect(cardOutline.width).toBeGreaterThanOrEqual(2);
  await page.keyboard.press('Tab');
  await expectVisibleOutline(slides.first());
  for (let index = 1; index < slideCount; index += 1) {
    await page.keyboard.press('Tab');
    await expectVisibleOutline(slides.nth(index));
  }
});

for (const width of [320, 390]) {
  test(`profile sources and recorded feedback dates fit ${width}px and remain keyboard accessible`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const { carousel, quote, slides } = await openCarousel(page);
    const expectWithinViewport = async (locator) => {
      await expect(locator).toBeVisible();
      const box = await locator.boundingBox();
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width);
    };
    const checkSummarySource = async (source) => {
      await expect(source).toHaveAttribute('href', socialLinks.upwork);
      await page.keyboard.press('Tab');
      await source.focus();
      await expect(source).toBeFocused();
      await expectWithinViewport(source);
      const outline = await source.evaluate((link) => ({
        style: getComputedStyle(link).outlineStyle,
        width: parseFloat(getComputedStyle(link).outlineWidth),
      }));
      expect(outline.style).not.toBe('none');
      expect(outline.width).toBeGreaterThanOrEqual(2);
    };

    await checkSummarySource(page.getByRole('group', { name: 'Detected credentials' })
      .getByRole('link', { name: 'View Upwork profile for credentials and client feedback' }));

    for (const [index, review] of testimonialData.entries()) {
      await slides.nth(index).click();
      await expect(quote.locator('blockquote')).toContainText(review.content);
      await expect(quote).toContainText(review.clientName);
      const source = carousel.getByRole('link', { name: 'View my Upwork profile (opens in a new tab)' });
      await expect(source).toHaveAttribute('href', socialLinks.upwork);
      await expect(source).toHaveAttribute('target', '_blank');
      await expect(source).toHaveAttribute('rel', 'noopener noreferrer');
      await expect(quote.getByRole('link')).toHaveCount(1);
      await expect(source.locator('a, button, [tabindex]')).toHaveCount(0);
      await expect(quote.locator('.source')).toHaveText(review.source);
      await source.focus();
      await expect(source).toBeFocused();
      await expectWithinViewport(source);
      await expectWithinViewport(quote);
      const date = quote.locator('time');
      if (review.feedbackDate) {
        await expect(date).toHaveAttribute('datetime', review.feedbackDate.slice(0, 7));
        await expect(date).toHaveText(new Intl.DateTimeFormat('en-GB', {
          month: 'long', year: 'numeric', timeZone: 'UTC',
        }).format(new Date(`${review.feedbackDate}T00:00:00Z`)));
        await expectWithinViewport(date);
      } else {
        await expect(date).toHaveCount(0);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }

    await page.goto('/contact/');
    await checkSummarySource(page.getByRole('link', { name: 'View Upwork profile for credentials and client feedback' }));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}

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

test('the card opens the exact public profile by pointer and its single named native link by keyboard', async ({ page, context, hasTouch }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await context.route(socialLinks.upwork, (route) => route.fulfill({
    contentType: 'text/html', body: '<title>Local profile destination check</title>',
  }));
  const { carousel, slides } = await openCarousel(page);
  const card = carousel.locator('.testimonial-card');
  const link = card.getByRole('link', { name: 'View my Upwork profile (opens in a new tab)' });
  const openProfile = async (activateCard) => {
    const popupPromise = page.waitForEvent('popup');
    await activateCard();
    const popup = await popupPromise;
    await popup.waitForURL(socialLinks.upwork);
    expect(await popup.evaluate(() => window.opener)).toBeNull();
    await popup.close();
  };
  await openProfile(() => hasTouch ? card.tap({ position: { x: 12, y: 20 } }) : card.click({ position: { x: 12, y: 20 } }));
  await slides.nth(7).click();
  await expect(card.locator('.source')).toHaveText('Direct');
  await expect(card).not.toHaveAttribute('tabindex');
  await link.focus();
  await expect(link).toBeFocused();
  await expect(link).toHaveAccessibleName('View my Upwork profile (opens in a new tab)');
  await expect(link).toHaveAttribute('href', socialLinks.upwork);
  await openProfile(() => page.keyboard.press('Enter'));
  await link.focus();
  await page.keyboard.press('Tab');
  await expect(slides.first()).toBeFocused();
  await expect(card.locator('blockquote')).toContainText(testimonialData[7].content);
});

test('dragging review text selects it without opening the profile; middle click remains native', async ({ page, context, hasTouch }) => {
  test.skip(hasTouch, 'Mouse text selection and middle click are desktop interactions.');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await context.route(socialLinks.upwork, (route) => route.fulfill({
    contentType: 'text/html', body: '<title>Local profile destination check</title>',
  }));
  const { carousel } = await openCarousel(page);
  const card = carousel.locator('.testimonial-card');
  const link = card.getByRole('link');
  await card.locator('blockquote').scrollIntoViewIfNeeded();
  const textPoints = await card.locator('blockquote').evaluate((quote) => {
    const text = quote.childNodes[1];
    const range = document.createRange();
    range.setStart(text, 2);
    range.setEnd(text, 12);
    const rect = range.getClientRects()[0];
    return { startX: rect.left + 1, endX: rect.right - 1, y: rect.top + rect.height / 2 };
  });
  const initialPages = context.pages().length;
  await page.mouse.move(textPoints.startX, textPoints.y);
  await page.mouse.down();
  await page.mouse.move(textPoints.endX, textPoints.y, { steps: 12 });
  await page.mouse.up();
  expect(await page.evaluate(() => getSelection().toString().length)).toBeGreaterThan(0);
  expect(context.pages()).toHaveLength(initialPages);
  await page.evaluate(() => getSelection().removeAllRanges());
  const popupPromise = context.waitForEvent('page');
  await link.click({ button: 'middle' });
  const popup = await popupPromise;
  await popup.waitForURL(socialLinks.upwork);
  await popup.close();
});
