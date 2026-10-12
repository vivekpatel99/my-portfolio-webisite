import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { HOURLY_RATE_EUR, HOURLY_RATE_LABEL, HOURLY_FROM_LABEL } from '../src/config/pricing.js';
import pricingHtmlPlugin from './vite-plugin-pricing-html.js';

describe('pricing HTML', () => {
  it('renders the configured rate in bootstrap descriptions and structured data', () => {
    const template = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    const html = pricingHtmlPlugin().transformIndexHtml.handler(template);
    const data = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
      .map((match) => JSON.parse(match[1]));

    expect(HOURLY_RATE_LABEL).toBe(`€${HOURLY_RATE_EUR}/hour`);
    expect(HOURLY_FROM_LABEL).toBe(`from ${HOURLY_RATE_LABEL}`);
    expect(html).not.toContain('__HOURLY_');
    expect(html.split(HOURLY_RATE_LABEL)).toHaveLength(4);
    expect(data.find((item) => item['@type'] === 'ProfessionalService').priceRange).toBe(HOURLY_RATE_LABEL);
    expect(html).toContain('Production-ready AI systems.');
    expect(html).not.toContain('Top Rated Plus on Upwork');
  });
});
