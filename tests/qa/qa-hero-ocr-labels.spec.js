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

const viewports = [
  { width: 1440, height: 900 },
  { width: 980, height: 1324 },
  { width: 768, height: 900 },
  { width: 390, height: 844 },
  { width: 320, height: 740 },
];

for (const { width, height } of viewports) {
  for (const random of [0, 0.4, 0.6, 0.999999]) {
    test(`OCR labels stay attached at ${width}x${height} with page-load selection ${random}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.addInitScript((value) => { Math.random = () => value; }, random);
      await page.goto('/');
      const invoice = page.getByRole('article', { name: 'Profile invoice field parse' });
      await expect(invoice.getByText('OCR simulation', { exact: true })).toBeVisible();
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
        };
      }));

      expect(measurements).toHaveLength(7);
      expect(measurements.filter((field) => field.highlighted)).toHaveLength(3);
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
        if (['rate', 'tags'].includes(field.id)) expect(field.highlighted).toBe(false);
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
