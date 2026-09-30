import { describe, expect, it } from 'vitest';
import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { imageSize } from 'image-size';
import { logos, profileImages } from './links';

// #252: the portrait and header logo ship display-size derivatives next to the originals.
const publicFile = (url) => resolve(__dirname, '../../public', url.replace(/^\//, ''));
const candidates = (srcSet) => srcSet.split(',').map((entry) => entry.trim().split(/\s+/));

describe('portrait derivatives (#252)', () => {
  it('lists 480w and 720w derivatives plus the original, each matching its real width', () => {
    const entries = candidates(profileImages.portraitSrcSet);
    expect(entries.map(([, descriptor]) => descriptor)).toEqual(['480w', '720w', '1008w']);
    expect(entries.at(-1)[0]).toBe(profileImages.aboutPhoto);
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
    expect(logos.logo).toBe('/assets/logos/mylogo-60.webp');
    const entries = candidates(logos.logoSrcSet);
    expect(entries).toEqual([
      ['/assets/logos/mylogo-60.webp', '2x'],
      ['/assets/logos/mylogo-90.webp', '3x'],
    ]);
    entries.forEach(([url, descriptor]) => {
      const side = 30 * Number.parseInt(descriptor, 10);
      expect(imageSize(readFileSync(publicFile(url)))).toMatchObject({ width: side, height: side, type: 'webp' });
      expect(statSync(publicFile(url)).size).toBeLessThanOrEqual(3 * 1024);
    });
  });

  it('keeps the full-size PNG for the favicon', () => {
    expect(logos.favicon).toBe('/assets/logos/mylogo.png');
    const indexHtml = readFileSync(resolve(__dirname, '../../index.html'), 'utf8');
    expect(indexHtml).toContain('href="/assets/logos/mylogo.png" media="(prefers-color-scheme: dark)"');
  });
});
