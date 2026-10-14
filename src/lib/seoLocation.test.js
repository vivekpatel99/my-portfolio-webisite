import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { defaultSeo, routeSeo } from './seoConfig.js';
import { HOURLY_RATE_LABEL } from '../config/pricing.js';
import { replacePricingTokens } from '../../plugins/vite-plugin-pricing-html.js';

const HOME_DESCRIPTION =
    `Hire Vivek Patel - Freelance AI & Computer Vision Engineer based in Linz, Austria, serving clients worldwide. Document extraction, n8n automation, and computer vision for invoices, website data, and video. Top Rated Plus on Upwork. ${HOURLY_RATE_LABEL}.`;
const BOOTSTRAP_DESCRIPTION =
  `Hire Vivek Patel - Freelance AI & Computer Vision Engineer based in Linz, Austria, serving clients worldwide. Document extraction, n8n automation, and computer vision for invoices, website data, and video. Production-ready AI systems. ${HOURLY_RATE_LABEL}.`;
const TWITTER_DESCRIPTION =
  `Freelance AI Engineer based in Linz, Austria, serving clients worldwide. Document extraction, n8n automation, and computer vision for invoices, website data, and video. ${HOURLY_RATE_LABEL}.`;
const CONTACT_DESCRIPTION =
  `Hire Vivek Patel for your AI project. Freelance Computer Vision, Web Scraping & n8n Automation expert based in Linz, Austria, serving clients worldwide. Discuss your workflow and request a project estimate. ${HOURLY_RATE_LABEL}.`;
const INVENTED_CITY =
  /Vienna|Wien|Berlin|Munich|München|Zurich|Graz|Salzburg|Innsbruck|Wels|Leonding|Prague|Praha|Budapest|Linz an der Donau|Oberösterreich|Upper Austria/;
const LEFTOVER_BASE = /based\s*-?\s*in\s+europe/i;
const ADDRESS_KEYS =
  /streetAddress|PostalAddress|postalCode|addressLocality|addressCountry|postOfficeBoxNumber|"geo"|latitude|longitude|"address"\s*:/;

const readSrc = (relativePath) => readFileSync(resolve(process.cwd(), relativePath), 'utf8');
const keywordTokens = (keywords) => keywords.split(',').map((token) => token.trim());

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
  return [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map((match) =>
    JSON.parse(match[1]),
  );
}

describe('public location copy', () => {
  const hero = readSrc('src/components/Hero.jsx');
  const seoConfig = readSrc('src/lib/seoConfig.js');
  const indexHtml = replacePricingTokens(readSrc('index.html'));
  const legal = readSrc('src/pages/Legal.jsx') + readSrc('src/components/PrivacyPolicyContent.jsx');
  const footer = readSrc('src/components/Footer.jsx');
  const contact = readSrc('src/pages/Contact.jsx');
  const dataPolicy = readSrc('src/pages/DataPolicy.jsx') + readSrc('src/components/CookiePolicyContent.jsx');
  const jsonLd = parseJsonLd(indexHtml);
  const person = jsonLd.find((node) => node['@type'] === 'Person');
  const service = jsonLd.find((node) => node['@type'] === 'ProfessionalService');
  const metaDescription = getMeta(indexHtml, 'description');
  const twitterDescription = getMeta(indexHtml, 'twitter:description');
  const homeTokens = keywordTokens(defaultSeo.keywords);
  const contactTokens = keywordTokens(routeSeo['/contact'].keywords);

  it('puts Linz, Austria in the hero LOCATION field and shows the shared rate once (#195, #266)', () => {
    expect(hero).toMatch(/fieldBoxProps\('location',[\s\S]*?Linz, Austria/);
    expect(hero.match(/Linz, Austria/g)).toHaveLength(1);
    expect(hero).not.toContain('Based in Linz, Austria');
    expect(hero).not.toContain(`Starting at ${HOURLY_RATE_LABEL}`);
    expect(hero.match(/\{HOURLY_RATE_LABEL\}/g)).toHaveLength(1);
    expect(hero.replace(/\s+/g, ' ')).not.toMatch(LEFTOVER_BASE);
  });

  it('keeps worldwide availability and the Linz base in home and contact SEO', () => {
    expect(defaultSeo.description).toBe(HOME_DESCRIPTION);
    expect(routeSeo['/contact'].description).toBe(CONTACT_DESCRIPTION);
    expect(LEFTOVER_BASE.test(defaultSeo.description)).toBe(false);
    expect(LEFTOVER_BASE.test(routeSeo['/contact'].description)).toBe(false);

    expect(homeTokens).toContain('AI Engineer Linz Austria');
    expect(homeTokens).toContain('Python Developer Worldwide');
    expect(homeTokens).not.toContain('AI Engineer Europe');
    expect(homeTokens).not.toContain('Hire AI Engineer Linz Austria');
    expect(contactTokens).toContain('Hire AI Engineer Linz Austria');
    expect(contactTokens).not.toContain('Hire AI Engineer Europe');
    expect(contactTokens).not.toContain('AI Engineer Europe');

    for (const source of [hero, seoConfig, indexHtml]) {
      expect(source).not.toContain('Engineer in Europe');
      expect(source).not.toContain('Freelance AI Engineer in Europe');
    }
  });

  it('separates the Linz work location from worldwide service availability', () => {
    expect(person.name).toBe('Vivek Patel');
    expect(person.workLocation['@type']).toBe('Place');
    expect(person.workLocation.name).toBe('Linz, Austria');
    expect(service.areaServed['@type']).toBe('Place');
    expect(service.areaServed.name).toBe('Worldwide');
    expect(person.workLocation.name).not.toBe(service.areaServed.name);
    expect(Array.isArray(service.areaServed)).toBe(false);
    expect(Object.keys(person.workLocation).sort()).toEqual(['@type', 'name']);
    expect(Object.keys(service.areaServed).sort()).toEqual(['@type', 'name']);
    expect(service.priceRange).toBe(HOURLY_RATE_LABEL);
    expect(JSON.stringify(jsonLd)).not.toMatch(ADDRESS_KEYS);
  });

  it('puts Linz in bootstrap meta without collapsing the Top Rated Plus / Production-ready split', () => {
    expect(metaDescription).toBe(BOOTSTRAP_DESCRIPTION);
    expect(twitterDescription).toBe(TWITTER_DESCRIPTION);
    expect(defaultSeo.description).not.toBe(metaDescription);
    expect(defaultSeo.description).toContain('Top Rated Plus on Upwork');
    expect(metaDescription).toContain('Production-ready AI systems');
    expect(getMeta(indexHtml, 'og:description')).not.toContain('Linz');
  });

  it('does not invent other cities or offices on marketing and nearby surfaces', () => {
    for (const source of [hero, seoConfig, indexHtml, footer, contact]) {
      expect(source).not.toMatch(INVENTED_CITY);
    }
    expect(footer).not.toMatch(/Linz|Austria|Europe|Headquarters|Based in|Hauptplatz|PostalAddress/);
    expect(contact).not.toMatch(/Linz|Austria|Europe|Based in/);
    expect(contact).toContain('within 24 hours');
  });

  it('keeps Legal EEA copy and leaves legal, cookie, and other sections city-free', () => {
    expect(legal).toContain(
      "If you are from the European Economic Area (EEA), Vivek Patel's legal basis for collecting and using the personal information described in this Privacy Policy depends on the Personal Data I collect and the specific context in which I collect it:",
    );
    expect(legal).toContain(
      'If you are a resident of the European Economic Area (EEA), you have certain data protection rights. I aim to take reasonable steps to allow you to correct, amend, delete, or limit the use of your Personal Data.',
    );
    expect(legal).toContain('General Data Protection Regulation (GDPR)');
    expect(legal).not.toMatch(/Linz|Austria|Based in/);
    expect(dataPolicy).not.toMatch(/Linz|Austria|Europe/);
    expect(routeSeo['/legal'].description).not.toMatch(/Linz|Austria/);
    expect(routeSeo['/data-policy'].description).not.toMatch(/Linz|Austria|Europe/);

    for (const relativePath of [
      'src/components/About.jsx',
      'src/components/CTA.jsx',
      'src/components/Header.jsx',
      'src/pages/Home.jsx',
      'src/lib/seo.js',
    ]) {
      expect(readSrc(relativePath)).not.toMatch(/Linz|Austria|Based in Europe/);
    }
  });

  it('carries Linz through built home and contact HTML when dist exists', () => {
    if (!existsSync(resolve(process.cwd(), 'dist/index.html'))) return;

    const distHome = readSrc('dist/index.html');
    const distContact = readSrc('dist/contact/index.html');
    const distLegal = readSrc('dist/legal/index.html');
    const distPerson = parseJsonLd(distHome).find((node) => node['@type'] === 'Person');
    const distService = parseJsonLd(distHome).find((node) => node['@type'] === 'ProfessionalService');

    expect(getMeta(distHome, 'description')).toContain('based in Linz, Austria, serving clients worldwide');
    expect(getMeta(distHome, 'description')).toContain('Top Rated Plus on Upwork');
    expect(getMeta(distContact, 'description')).toContain('based in Linz, Austria, serving clients worldwide');
    expect(getMeta(distContact, 'description')).not.toMatch(LEFTOVER_BASE);
    expect(getMeta(distLegal, 'description')).not.toContain('Linz');
    expect(distPerson.workLocation.name).toBe('Linz, Austria');
    expect(distService.areaServed.name).toBe('Worldwide');
    expect(distService.priceRange).toBe(HOURLY_RATE_LABEL);
  });
});
