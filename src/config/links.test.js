import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { imageSize } from 'image-size';
import { assetsLinks, logos, profileImages } from './links';

// #252: the portrait and header logo ship display-size derivatives next to the originals.
const publicFile = (url) => resolve(__dirname, '../../public', url.replace(/^\//, ''));
const candidates = (srcSet) => srcSet.split(',').map((entry) => entry.trim().split(/\s+/));
const sha256 = (url) => createHash('sha256').update(readFileSync(publicFile(url))).digest('hex');

// Digests of the sources the derivatives were made from. If a source is replaced,
// this fails until the derivatives are regenerated, renamed and this value is updated.
const SOURCE_SHA256 = {
  [profileImages.portrait]: '1129fba439219ea8c50dc9b79910b17a5ddab7323b253037f849df2b4699b72b',
  [logos.favicon]: '777f36c5561d94b3aa208a92416fd8073e88ac058d056dc22f1684b60d5674ee',
};

const derivativeUrls = (srcSet, source) => candidates(srcSet).map(([url]) => url).filter((url) => url !== source);

describe('derivative cache busting (#252)', () => {
  // /assets/* is cached immutable, so a regenerated file must never reuse a name.
  it.each([
    ['portrait', profileImages.portraitSrcSet, profileImages.portrait],
    ['logo', logos.logoSrcSet, logos.favicon],
  ])('names every %s derivative with the first 12 hex chars of its own SHA-256', (_, srcSet, source) => {
    const urls = derivativeUrls(srcSet, source);
    expect(urls.length).toBeGreaterThan(0);
    urls.forEach((url) => {
      expect(url).toMatch(/-[0-9a-f]{12}\.webp$/);
      expect(url.match(/-([0-9a-f]{12})\.webp$/)[1]).toBe(sha256(url).slice(0, 12));
    });
  });

  it.each(Object.entries(SOURCE_SHA256))('binds the derivatives to the reviewed source %s', (source, digest) => {
    expect(sha256(source)).toBe(digest);
  });
});

describe('portrait derivatives (#252)', () => {
  it('lists 480w and 720w derivatives plus the original, each matching its real width', () => {
    const entries = candidates(profileImages.portraitSrcSet);
    expect(entries.map(([, descriptor]) => descriptor)).toEqual(['480w', '720w', '1008w']);
    expect(entries.at(-1)[0]).toBe(profileImages.portrait);
    entries.forEach(([url, descriptor]) => {
      const { width, height } = imageSize(readFileSync(publicFile(url)));
      expect(`${width}w`).toBe(descriptor);
      // Same crop as the original: aspect ratio within one pixel of 1008×1367.
      expect(Math.abs(height - Math.round((width * 1367) / 1008))).toBeLessThanOrEqual(1);
    });
  });

  it('keeps the DPR 1.75 hero candidate within the 35 KB budget', () => {
    const [[url480]] = candidates(profileImages.portraitSrcSet);
    expect(statSync(publicFile(url480)).size).toBeLessThanOrEqual(35 * 1024);
  });
});

describe('header logo derivatives (#252)', () => {
  it('uses 60px (2x) and 90px (3x) square webp files of at most 3 KB for the 30px mark', () => {
    const entries = candidates(logos.logoSrcSet);
    expect(entries.map(([, descriptor]) => descriptor)).toEqual(['2x', '3x']);
    expect(logos.logo).toBe(entries[0][0]);
    entries.forEach(([url, descriptor]) => {
      const side = 30 * Number.parseInt(descriptor, 10);
      expect(imageSize(readFileSync(publicFile(url)))).toMatchObject({ width: side, height: side, type: 'webp' });
      expect(statSync(publicFile(url)).size).toBeLessThanOrEqual(3 * 1024);
    });
  });

  it('keeps the full-size PNG for the favicon and the generic logo link', () => {
    expect(logos.favicon).toBe('/assets/logos/mylogo.png');
    expect(assetsLinks.logo).toBe(logos.favicon);
    const indexHtml = readFileSync(resolve(__dirname, '../../index.html'), 'utf8');
    expect(indexHtml).toContain('href="/assets/logos/mylogo.png" media="(prefers-color-scheme: dark)"');
  });
});
