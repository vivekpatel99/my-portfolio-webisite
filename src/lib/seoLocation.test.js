import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { defaultSeo, routeSeo } from './seoConfig.js';

const readSrc = (relativePath) => readFileSync(resolve(process.cwd(), relativePath), 'utf8');

function getMeta(html, name) {
  const patterns = [
    new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)`, 'i'),
    new RegExp(`<meta[^>]+property=["']${name}["'][^>]+content=["']([^"']+)`, 'i'),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function parseJsonLd(html) {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((match) =>
    JSON.parse(match[1]),
  );
}

describe('public location copy', () => {
  const hero = readSrc('src/components/Hero.jsx');
  const seoConfig = readSrc('src/lib/seoConfig.js');
  const indexHtml = readSrc('index.html');
  const jsonLd = parseJsonLd(indexHtml);
  const person = jsonLd.find((node) => node['@type'] === 'Person');
  const service = jsonLd.find((node) => node['@type'] === 'ProfessionalService');
  const metaDescription = getMeta(indexHtml, 'description');
  const twitterDescription = getMeta(indexHtml, 'twitter:description');

  it('puts Linz, Austria on the hero pill and keeps the €45 rate', () => {
    expect(hero).toContain('Based in Linz, Austria');
    expect(hero).not.toContain('Based in Europe');
    expect(hero).toContain('Starting at €45/hour');
  });

  it('puts Linz, Austria in home and contact SEO without Europe-only base lines', () => {
    expect(defaultSeo.description).toContain('Linz, Austria');
    expect(defaultSeo.description).toContain('€45/hour');
    expect(defaultSeo.description).not.toContain('Engineer in Europe');
    expect(defaultSeo.description).not.toContain('based in Europe');

    expect(routeSeo['/contact'].description).toContain('Linz, Austria');
    expect(routeSeo['/contact'].description).toContain('€45/hour');
    expect(routeSeo['/contact'].description).not.toContain('based in Europe');

    expect(defaultSeo.keywords).not.toContain('AI Engineer Europe');
    expect(routeSeo['/contact'].keywords).not.toContain('AI Engineer Europe');
    expect(defaultSeo.keywords).toContain('Python Developer Europe');
  });

  it('names Linz in JSON-LD Place fields without a postal address', () => {
    expect(person.workLocation.name).toBe('Linz, Austria');
    expect(service.areaServed.name).toBe('Linz, Austria and Europe');
    expect(service.priceRange).toBe('€45/hour');

    const serialized = JSON.stringify(jsonLd);
    expect(serialized).not.toContain('streetAddress');
    expect(serialized).not.toContain('PostalAddress');
    expect(serialized).not.toContain('"address"');
  });

  it('puts Linz in the bootstrap meta descriptions', () => {
    expect(metaDescription).toContain('Linz');
    expect(metaDescription).toContain('€45/hour');
    expect(metaDescription).not.toContain('Engineer in Europe');

    expect(twitterDescription).toContain('Linz');
    expect(twitterDescription).toContain('€45/hour');
    expect(twitterDescription).not.toContain('Engineer in Europe');
  });

  it('does not invent other cities in the three location owners', () => {
    for (const source of [hero, seoConfig, indexHtml]) {
      expect(source).not.toMatch(/Vienna|Berlin|Munich|Zurich/);
    }
  });
});
