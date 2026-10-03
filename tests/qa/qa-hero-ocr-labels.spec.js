import { expect, test } from './qa-test.js';

const expectedLabels = [
  'Name · 0.99',
  'Role · 0.97',
  'Credential · 0.98',
  'Success · 0.96',
  'Rate · 0.95',
  'Location · 0.94',
  'Tags · 0.93',
];

const selections = [
  ['name', 'role'],
  ['credential', 'success'],
  ['rate', 'location'],
];

async function advancePair(page, hero, delay = 2000) {
  await page.clock.runFor(delay);
  await expect(hero).toHaveAttribute('data-hero-highlight-phase', 'leaving');
  await page.clock.runFor(100);
  await expect(hero).toHaveAttribute('data-hero-highlight-phase', 'entering');
  await page.clock.runFor(100);
  await expect(hero).toHaveAttribute('data-hero-highlight-phase', 'steady');
}

const viewports = [
  { width: 1440, height: 900 },
  { width: 980, height: 1324 },
  { width: 768, height: 900 },
  { width: 390, height: 844 },
  { width: 320, height: 740 },
];

for (const { width, height } of viewports) {
  for (const [index, selected] of selections.entries()) {
    test(`OCR labels stay attached at ${width}x${height} with annotation state ${index}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.clock.install({ time: new Date('2026-10-03T08:00:00Z') });
      await page.goto('/');
      await page.clock.pauseAt(new Date('2026-10-03T08:00:01Z'));
      const invoice = page.getByRole('article', { name: 'Profile invoice field parse' });
      await expect(invoice.getByText('OCR simulation', { exact: true })).toBeVisible();
      const hero = page.locator('section[data-hero-highlight-index]');
      await expect(hero).toHaveAttribute('data-hero-highlight-index', '0');
      await page.getByRole('button', { name: 'Pause highlights', exact: true }).click();
      await page.getByRole('button', { name: 'Resume highlights', exact: true }).click();
      for (let step = 0; step < index; step += 1) await advancePair(page, hero, step === 0 ? 2000 : 1800);
      await expect(hero).toHaveAttribute('data-hero-highlight-index', String(index));
      await page.getByRole('button', { name: 'Pause highlights', exact: true }).click();
      await expect(hero).toHaveAttribute('data-hero-highlights', 'paused');
      await expect(invoice.locator('.hero-field-label')).toHaveText(expectedLabels);

      const measurements = await invoice.locator('[data-hero-field]').evaluateAll((fields) => fields.map((field) => {
        const bounds = field.getBoundingClientRect();
        const label = field.querySelector('.hero-field-label').getBoundingClientRect();
        const value = field.querySelector('.hero-field-value').getBoundingClientRect();
        return {
          id: field.dataset.heroField,
          leftClearance: label.left - bounds.left,
          rightClearance: bounds.right - label.right,
          labelCenter: label.top + label.height / 2 - bounds.top,
          cornerTop: parseFloat(getComputedStyle(field, '::before').top),
          valueGap: value.top - label.bottom,
          valueLeft: value.left - bounds.left,
          valueRight: bounds.right - value.right,
          columnLeft: bounds.left - field.parentElement.getBoundingClientRect().left,
          columnRight: field.parentElement.getBoundingClientRect().right - bounds.right,
          highlighted: field.classList.contains('invoice-field-corners'),
          labelOpacity: Number(getComputedStyle(field.querySelector('.hero-field-label')).opacity),
        };
      }));

      expect(measurements).toHaveLength(7);
      expect(measurements.filter((field) => field.highlighted).map((field) => field.id).sort()).toEqual([...selected].sort());
      for (const field of measurements) {
        expect(field.leftClearance, `${field.id} left stroke clearance`).toBeCloseTo(17, 1);
        expect(field.rightClearance, `${field.id} right stroke clearance`).toBeGreaterThanOrEqual(16.9);
        expect(field.valueGap, `${field.id} value stays below label`).toBeGreaterThanOrEqual(1.9);
        expect(field.valueLeft, `${field.id} value inside left frame`).toBeGreaterThanOrEqual(6.9);
        expect(field.valueRight, `${field.id} value inside right frame`).toBeGreaterThanOrEqual(6.9);
        if (field.id !== 'tags') {
          expect(field.columnLeft, `${field.id} stays in its column`).toBeGreaterThanOrEqual(-0.1);
          expect(field.columnRight, `${field.id} stays in its column`).toBeGreaterThanOrEqual(-0.1);
        }
        if (field.highlighted) expect(field.labelCenter).toBeCloseTo(field.cornerTop, 1);
        expect(field.labelOpacity, `${field.id} annotation visibility`).toBe(selected.includes(field.id) || field.id === 'tags' ? 1 : 0);
        if (field.id === 'tags') expect(field.highlighted).toBe(false);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

      const labelsBefore = await invoice.locator('.hero-field-label').evaluateAll((labels) => labels.map((label) => {
        const { x, y, width, height } = label.getBoundingClientRect();
        return { text: label.textContent, x, y, width, height };
      }));
      await page.mouse.move(width - 20, 200);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const labelsAfter = await invoice.locator('.hero-field-label').evaluateAll((labels) => labels.map((label) => {
        const { x, y, width, height } = label.getBoundingClientRect();
        return { text: label.textContent, x, y, width, height };
      }));
      expect(labelsAfter).toEqual(labelsBefore);

      const portraitTag = page.getByText('engineer · 0.99', { exact: true });
      const tag = await portraitTag.boundingBox();
      const frame = await portraitTag.locator('..').boundingBox();
      expect(tag.x - frame.x).toBeCloseTo(29, 1);
      expect(Math.abs(tag.y + tag.height / 2 - frame.y)).toBeLessThanOrEqual(0.5);
      expect(frame.x + frame.width - tag.x - tag.width).toBeGreaterThanOrEqual(29);
    });
  }
}

const annotationState = (page) => page.locator('[data-hero-field]').evaluateAll((fields) => fields.map((field) => ({
  id: field.dataset.heroField,
  selected: field.classList.contains('invoice-field-corners'),
  labelOpacity: Number(getComputedStyle(field.querySelector('.hero-field-label')).opacity),
  cornerOpacity: Number(getComputedStyle(field, '::before').opacity),
  valueOpacity: Number(getComputedStyle(field.querySelector('.hero-field-value')).opacity),
})));

const fieldBounds = (page) => page.locator('[data-hero-field], section[data-hero-highlight-index] a, section[data-hero-highlight-index] button')
  .evaluateAll((elements) => elements.map((element) => {
    const { x, y, width, height } = element.getBoundingClientRect();
    return { text: element.textContent, x, y, width, height };
  }));

test.describe('animated OCR experiment', () => {
  test('normal motion completes the three-pair cycle with synchronized annotations and stationary values', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => localStorage.setItem('cookie_consent_preferences', JSON.stringify({ necessary: true, analytics: false })));
    await page.goto('/');
    const hero = page.locator('section[data-hero-highlight-index]');
    await expect(hero).toHaveAttribute('data-hero-highlight-index', '0');
    const initialBounds = await fieldBounds(page);
    await page.evaluate(() => {
      window.__heroPairProbe = { active: true, frames: 0, maximum: 0, mismatches: 0 };
      const sample = () => {
        const probe = window.__heroPairProbe;
        const fields = [...document.querySelectorAll('.hero-rotating-annotation')];
        const opacities = fields.map((field) => {
          const label = Number(getComputedStyle(field.querySelector('.hero-field-label')).opacity);
          const corner = Number(getComputedStyle(field, '::before').opacity);
          if (Math.abs(label - corner) > 0.001) probe.mismatches += 1;
          return Math.max(label, corner);
        });
        probe.frames += 1;
        probe.maximum = Math.max(probe.maximum, opacities.filter((opacity) => opacity > 0.001).length);
        if (probe.active) requestAnimationFrame(sample);
      };
      sample();
    });
    for (const index of [1, 2, 0]) {
      await expect(hero).toHaveAttribute('data-hero-highlight-index', String(index), { timeout: 3500 });
      await expect.poll(async () => (await annotationState(page)).filter((field) => field.selected).map((field) => field.labelOpacity), { intervals: [20] }).toEqual([1, 1]);
      const state = await annotationState(page);
      expect(state.filter((field) => field.selected).map((field) => field.id).sort()).toEqual([...selections[index]].sort());
      expect(state.filter((field) => field.id !== 'tags' && field.labelOpacity > 0)).toHaveLength(2);
      for (const field of state) {
        expect(field.valueOpacity).toBe(1);
        if (field.id !== 'tags') expect(field.cornerOpacity).toBeCloseTo(field.labelOpacity, 2);
      }
      expect(await fieldBounds(page)).toEqual(initialBounds);
      await expect(page.locator('.hero-field-label')).toHaveText(expectedLabels);
    }
    const sampled = await page.evaluate(() => {
      window.__heroPairProbe.active = false;
      return window.__heroPairProbe;
    });
    expect(sampled.frames).toBeGreaterThan(100);
    expect(sampled.maximum, 'visible annotation count during every sampled handoff').toBe(2);
    expect(sampled.mismatches, 'labels and corners share opacity on every sampled frame').toBe(0);
  });
});

test('annotation controls freeze, resume, and honor reduced motion and offscreen suspension', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-03T08:00:00Z') });
  await page.goto('/');
  await page.clock.pauseAt(new Date('2026-10-03T08:00:01Z'));
  const hero = page.locator('section[data-hero-highlight-index]');
  await expect(hero).toHaveAttribute('data-hero-highlight-index', '0');
  await page.getByRole('button', { name: 'Pause highlights', exact: true }).click();
  await page.getByRole('button', { name: 'Resume highlights', exact: true }).click();
  await advancePair(page, hero);
  await expect(hero).toHaveAttribute('data-hero-highlight-index', '1');
  const pause = page.getByRole('button', { name: 'Pause highlights', exact: true });
  await pause.focus();
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: 'Resume highlights', exact: true })).toBeFocused();
  await page.clock.runFor(6000);
  await expect(hero).toHaveAttribute('data-hero-highlight-index', '1');
  await page.keyboard.press('Enter');
  await page.clock.runFor(1999);
  await expect(hero).toHaveAttribute('data-hero-highlight-index', '1');
  await advancePair(page, hero, 1);
  await expect(hero).toHaveAttribute('data-hero-highlight-index', '2');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(hero).toHaveAttribute('data-hero-highlight-index', '0');
  await expect(hero).toHaveAttribute('data-hero-highlights', 'paused');
  await page.clock.runFor(10000);
  await expect(hero).toHaveAttribute('data-hero-highlight-index', '0');
  await expect(page.locator('.hero-field-label')).toHaveText(expectedLabels);

  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.getByRole('contentinfo').scrollIntoViewIfNeeded();
  await expect(hero).toHaveAttribute('data-hero-highlights', 'paused');
  const frozen = await hero.getAttribute('data-hero-highlight-index');
  await page.clock.runFor(10000);
  await expect(hero).toHaveAttribute('data-hero-highlight-index', frozen);
  await page.getByRole('article', { name: 'Profile invoice field parse' }).scrollIntoViewIfNeeded();
  await expect(hero).toHaveAttribute('data-hero-highlights', 'running');
  await page.clock.runFor(1999);
  await expect(hero).toHaveAttribute('data-hero-highlight-index', frozen);
  await advancePair(page, hero, 1);
  await expect(hero).toHaveAttribute('data-hero-highlight-index', String((Number(frozen) + 1) % 3));
});
