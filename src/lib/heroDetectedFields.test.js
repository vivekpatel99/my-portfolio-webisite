import { describe, expect, it } from 'vitest';
import {
  HERO_DETECTED_FIELD_COUNT,
  HERO_INVOICE_FIELDS,
  pickDetectedFields,
} from './heroDetectedFields';

// mulberry32 PRNG: deterministic random() for a given integer seed.
const mulberry32 = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

describe('pickDetectedFields (#206)', () => {
  it('always picks exactly 3 distinct known fields', () => {
    for (let seed = 1; seed <= 200; seed += 1) {
      const picked = pickDetectedFields(mulberry32(seed));
      expect(picked.size).toBe(HERO_DETECTED_FIELD_COUNT);
      picked.forEach((id) => expect(HERO_INVOICE_FIELDS).toContain(id));
    }
  });

  it('handles random() boundary values 0 and just below 1', () => {
    expect([...pickDetectedFields(() => 0)].sort()).toEqual(['credential', 'role', 'success']);
    expect([...pickDetectedFields(() => 0.999999)].sort()).toEqual(['credential', 'name', 'role']);
  });

  it('is deterministic for the same seed and varies across seeds', () => {
    const key = (seed) => [...pickDetectedFields(mulberry32(seed))].sort().join(',');
    expect(key(42)).toBe(key(42));
    const distinct = new Set(Array.from({ length: 50 }, (_, i) => key(i + 1)));
    expect(distinct.size).toBeGreaterThan(1);
  });

  it('leaves Rate and Tags unboxed for every page-load selection (#297)', () => {
    for (let seed = 1; seed <= 200; seed += 1) {
      const picked = pickDetectedFields(mulberry32(seed));
      expect(picked.has('rate')).toBe(false);
      expect(picked.has('tags')).toBe(false);
    }
  });
});
