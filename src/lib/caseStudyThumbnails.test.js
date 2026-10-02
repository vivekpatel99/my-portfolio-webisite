// @vitest-environment node
import { build } from 'esbuild';
import { describe, expect, it } from 'vitest';
import { caseStudyThumbnailRegistry as buildRegistry } from '../../publication/case-study-derivatives.js';
import { caseStudyDisplaySrc, galleryThumbnailSrc } from './caseStudyThumbnails.js';

describe('case-study browser derivatives', () => {
  it('bundles browser helpers without build-only digests', async () => {
    const result = await build({
      entryPoints: ['src/lib/caseStudyThumbnails.js'],
      bundle: true,
      write: false,
      format: 'esm',
      minify: true,
    });
    // Full hashes in content-addressed image filenames are public URLs.
    const withoutFilenames = result.outputFiles[0].text.replace(/\/assets\/case-studies\/[^"'\s]+/g, '');
    expect(withoutFilenames.match(/[a-f0-9]{64}/gi) ?? []).toEqual([]);
  });

  it('resolves every reviewed browser URL to the derivative validated by the build', () => {
    for (const [src, entry] of Object.entries(buildRegistry)) {
      expect(galleryThumbnailSrc({ src })).toBe(entry.src);
      expect(galleryThumbnailSrc({ poster: src })).toBe(entry.src);
      expect(caseStudyDisplaySrc({ src })).toBe(entry.display?.src ?? src);
      expect(caseStudyDisplaySrc({ poster: src })).toBe(entry.display?.src ?? src);
    }
  });

  it('preserves source, poster and unregistered-media fallbacks', () => {
    expect(galleryThumbnailSrc({ src: '/unknown.png', poster: '/preview.webp' })).toBe('/preview.webp');
    expect(caseStudyDisplaySrc({ src: '/unknown.png', poster: '/preview.webp' })).toBe('/unknown.png');
    expect(galleryThumbnailSrc({ poster: '/preview.webp' })).toBe('/preview.webp');
    expect(caseStudyDisplaySrc({ poster: '/preview.webp' })).toBe('/preview.webp');
    expect(galleryThumbnailSrc()).toBeUndefined();
    expect(caseStudyDisplaySrc()).toBeUndefined();
  });
});
