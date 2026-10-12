import { describe, expect, it } from 'vitest';
import { HERO_DETECTED_FIELD_COUNT, HERO_DETECTED_FIELD_WINDOWS, HERO_INVOICE_FIELDS } from './heroDetectedFields';

describe('hero annotation windows', () => {
  it('uses the three agreed row pairs in order', () => {
    expect(HERO_DETECTED_FIELD_WINDOWS).toEqual([
      ['name', 'role'],
      ['credential', 'success'],
      ['rate', 'location'],
    ]);
  });

  it('selects two distinct eligible fields and covers every field equally', () => {
    const coverage = Object.fromEntries(HERO_INVOICE_FIELDS.map((id) => [id, 0]));
    HERO_DETECTED_FIELD_WINDOWS.forEach((window) => {
      expect(new Set(window).size).toBe(HERO_DETECTED_FIELD_COUNT);
      window.forEach((id) => {
        expect(HERO_INVOICE_FIELDS).toContain(id);
        coverage[id] += 1;
      });
      expect(window).not.toContain('tags');
    });
    expect(Object.values(coverage)).toEqual([1, 1, 1, 1, 1, 1]);
  });

  it('replaces both annotations at each boundary, including the loop', () => {
    HERO_DETECTED_FIELD_WINDOWS.forEach((window, index) => {
      const next = HERO_DETECTED_FIELD_WINDOWS[(index + 1) % HERO_DETECTED_FIELD_WINDOWS.length];
      expect(window.filter((id) => next.includes(id))).toHaveLength(0);
    });
  });
});
