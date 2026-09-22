import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  HOURLY_FROM_EUR,
  HOURLY_FROM_LABEL,
  serviceOffers,
  typicalDurationLabel,
} from './serviceOffers';

const TITLES = [
  'DATA EXTRACTION AUTOMATION SPRINT',
  'COMPUTER VISION PRODUCTION OPTIMIZATION',
  'AI WORKFLOW BUILDOUT',
];

const SKU_KEYS = ['price', 'total', 'hours', 'sku', 'guarantee', 'packagePrice', 'minHours', 'maxHours'];

const moduleSource = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), 'serviceOffers.js'),
  'utf8',
);

describe('serviceOffers catalog', () => {
  it('pins the public hourly amount at 45', () => {
    expect(HOURLY_FROM_EUR).toBe(45);
  });

  it('derives the offer rate label from that amount', () => {
    expect(HOURLY_FROM_LABEL).toBe('from €45/hour');
    expect(HOURLY_FROM_LABEL).toBe(`from €${HOURLY_FROM_EUR}/hour`);
  });

  it('keeps the three public titles in render order', () => {
    expect(serviceOffers.map((offer) => offer.title)).toEqual(TITLES);
  });

  it('gives every offer buyable fields and no SKU keys', () => {
    const ids = serviceOffers.map((offer) => offer.id);
    expect(new Set(ids).size).toBe(3);

    serviceOffers.forEach((offer) => {
      expect(offer.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(offer.title).toBeTruthy();
      expect(offer.summary.length).toBeGreaterThan(20);
      expect(Number.isInteger(offer.minWeeks)).toBe(true);
      expect(Number.isInteger(offer.maxWeeks)).toBe(true);
      expect(offer.minWeeks).toBeGreaterThanOrEqual(1);
      expect(offer.maxWeeks).toBeGreaterThanOrEqual(offer.minWeeks);
      expect(offer.inScope.length).toBeGreaterThanOrEqual(1);
      expect(offer.outOfScope.length).toBeGreaterThanOrEqual(1);
      SKU_KEYS.forEach((key) => expect(offer).not.toHaveProperty(key));
    });
  });

  it('labels duration as typical calendar weeks', () => {
    expect(typicalDurationLabel(serviceOffers[0])).toBe('Typically 1–2 weeks');
    expect(typicalDurationLabel(serviceOffers[1])).toBe('Typically 1–2 weeks');
    expect(typicalDurationLabel(serviceOffers[2])).toBe('Typically 2–4 weeks');
    serviceOffers.forEach((offer) => {
      expect(typicalDurationLabel(offer)).toMatch(/^Typically \d+–\d+ weeks$/);
      expect(typicalDurationLabel(offer)).not.toMatch(/€|hour|hr\b/i);
    });
  });

  it('keeps scope lists unique and non-overlapping', () => {
    serviceOffers.forEach((offer) => {
      const inScope = offer.inScope.map((item) => item.trim().toLowerCase());
      const outOfScope = offer.outOfScope.map((item) => item.trim().toLowerCase());
      expect(new Set(inScope).size).toBe(inScope.length);
      expect(new Set(outOfScope).size).toBe(outOfScope.length);
      inScope.forEach((item) => expect(outOfScope).not.toContain(item));
    });
  });

  it('mirrors the existing offer boundaries in summaries and scope', () => {
    const [extraction, vision, workflow] = serviceOffers;
    expect(extraction.summary).toMatch(/extractor/i);
    expect(extraction.summary).toMatch(/validation/i);
    expect(extraction.inScope.join(' ')).toMatch(/extractor|validation/i);
    expect(vision.summary).toMatch(/existing YOLO/i);
    expect(vision.outOfScope.join(' ')).toMatch(/from scratch|from zero/i);
    expect(workflow.summary).toMatch(/n8n/);
    expect(workflow.inScope.join(' ')).toMatch(/n8n|LLM/i);
  });

  it('keeps leftover package numbers and invented guarantees out of the catalog', () => {
    const serialized = JSON.stringify(serviceOffers);
    expect(serialized).not.toMatch(/€80|\$45\/hour|3,?600|7,?200|€3,\d{3}/);
    expect(serialized).not.toMatch(/guarantee|30-day|30 days of support|promised ROI|guaranteed ROI|\bSLA\b/i);
    expect(moduleSource).not.toMatch(/€80|\$45\/hour/);
    expect(HOURLY_FROM_LABEL).toContain('from €45/hour');
  });

  it('keeps euros out of bullets so money cannot sneak past the missing price key', () => {
    const copy = serviceOffers
      .flatMap((offer) => [offer.summary, ...offer.inScope, ...offer.outOfScope, typicalDurationLabel(offer)])
      .join('\n');
    expect(copy).not.toMatch(/€|\$/);
    const eurosInSource = [...moduleSource.matchAll(/€/g)];
    expect(eurosInSource).toHaveLength(1);
  });
});
