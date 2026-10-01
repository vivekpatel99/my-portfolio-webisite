// @vitest-environment node
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import publicationPlugin, {
  assertCaseStudyBinding,
  assertDisplayDimensions,
  assertDisplayFilenameHash,
  assertThumbnailDimensions,
  assertThumbnailFilenameHash,
} from './vite-plugin-case-study-publication.js';

const SOURCE = '/assets/case-studies/n8n-openai-data-extraction-b11f57c86cd2e19c810cc72df7925d1ac3a65c0aabfcdf29a7298f78c5b6dc82.png';
const THUMBNAIL = '/assets/case-studies/n8n-openai-data-extraction-e6fbcc7caa954b217adfa063990d460059e44d08808ad85c9e8988418920104c-thumb-bd1dc61ef269.jpg';
const DISPLAY = '/assets/case-studies/case-study-display-b11f57c86cd2-3d31a82cd9be.webp';
const SOURCE_SHA256 = 'b11f57c86cd2e19c810cc72df7925d1ac3a65c0aabfcdf29a7298f78c5b6dc82';
const DISPLAY_SHA256 = '3d31a82cd9be1728715aee6dcbad56c026e00cdc32420c2073698cba9751dc13';

describe('gallery asset delivery', () => {
  it('emits published originals and their bounded derivatives only once', () => {
    const emitted = [];
    publicationPlugin().generateBundle.call({ emitFile: (asset) => emitted.push(asset.fileName) });
    expect(emitted).toContain(SOURCE.replace(/^\//, ''));
    expect(emitted).toContain(THUMBNAIL.replace(/^\//, ''));
    expect(emitted).toContain(DISPLAY.replace(/^\//, ''));
    expect(emitted.filter((fileName) => fileName.startsWith('assets/case-studies/case-study-display-'))).toHaveLength(23);
    expect(emitted).not.toContain('assets/case-studies/planning-graph.webp');
    expect(emitted).not.toContain('assets/case-studies/browser-search-to-spreadsheet-9ec23dd3d88e872e69136f02c3e8dcf5f4fa16f853591f7bff1417780711534c-thumb-4e197d56ac0d.jpg');
    expect(emitted).not.toContain('assets/case-studies/football-tracking.mp4');
    expect(new Set(emitted).size).toBe(emitted.length);
  });

  it('allows published display requests but denies unpublished registered assets', () => {
    let middleware;
    publicationPlugin().configureServer({ middlewares: { use: (handler) => { middleware = handler; } } });
    let allowed = false;
    middleware({ url: DISPLAY }, {}, (error) => { if (error) throw error; allowed = true; });
    expect(allowed).toBe(true);

    const response = { end() {} };
    middleware({ url: '/assets/case-studies/browser-search-to-spreadsheet-9ec23dd3d88e872e69136f02c3e8dcf5f4fa16f853591f7bff1417780711534c-thumb-4e197d56ac0d.jpg' }, response, () => { throw new Error('Unpublished thumbnail was allowed'); });
    expect(response.statusCode).toBe(404);
    middleware({ url: '/assets/case-studies/case-study-display-deadbeefdead-deadbeefdead.webp' }, response, () => { throw new Error('Unpublished display derivative was allowed'); });
    expect(response.statusCode).toBe(404);
  });

  it('rejects tampered source, thumbnail and display bytes', () => {
    const directory = mkdtempSync(path.join(os.tmpdir(), 'case-study-display-binding-'));
    const publicDirectory = path.join(directory, 'public');
    const copy = (publicPath) => {
      const target = path.join(publicDirectory, publicPath.replace(/^\//, ''));
      mkdirSync(path.dirname(target), { recursive: true });
      cpSync(`public${publicPath}`, target);
      return target;
    };
    const sourceFile = copy(SOURCE);
    const thumbnailFile = copy(THUMBNAIL);
    const displayFile = copy(DISPLAY);
    try {
      expect(() => assertCaseStudyBinding(publicDirectory, SOURCE, { requireDisplay: true })).not.toThrow();
      writeFileSync(sourceFile, 'tampered source');
      expect(() => assertCaseStudyBinding(publicDirectory, SOURCE, { requireDisplay: true })).toThrow(/source changed/i);

      cpSync(`public${SOURCE}`, sourceFile);
      writeFileSync(thumbnailFile, 'tampered thumbnail');
      expect(() => assertCaseStudyBinding(publicDirectory, SOURCE, { requireDisplay: true })).toThrow(/thumbnail changed/i);

      cpSync(`public${THUMBNAIL}`, thumbnailFile);
      writeFileSync(displayFile, 'tampered display');
      expect(() => assertCaseStudyBinding(publicDirectory, SOURCE, { requireDisplay: true })).toThrow(/display derivative changed/i);

      writeFileSync(displayFile, Buffer.alloc(100_001));
      expect(() => assertCaseStudyBinding(publicDirectory, SOURCE, { requireDisplay: true })).toThrow(/exceeds 100000 bytes/i);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('rejects display format, registered dimensions and stale filename hashes', () => {
    expect(() => assertDisplayDimensions({ type: 'png', width: 2049, height: 600 }, DISPLAY, { width: 2049, height: 600 })).toThrow(/WebP/i);
    expect(() => assertDisplayDimensions({ type: 'webp', width: 2048, height: 600 }, DISPLAY, { width: 2049, height: 600 })).toThrow(/dimensions/i);
    expect(() => assertDisplayDimensions({ type: 'webp', width: 2049, height: 600 }, DISPLAY, { width: 2049, height: 600 })).not.toThrow();
    expect(() => assertDisplayFilenameHash('/assets/case-studies/case-study-display-deadbeefdead-3d31a82cd9be.webp', SOURCE_SHA256, DISPLAY_SHA256)).toThrow(/source and derivative hashes/i);
    expect(() => assertDisplayFilenameHash('/assets/case-studies/case-study-display-b11f57c86cd2-deadbeefdead.webp', SOURCE_SHA256, DISPLAY_SHA256)).toThrow(/source and derivative hashes/i);
    expect(() => assertDisplayFilenameHash(DISPLAY, SOURCE_SHA256, DISPLAY_SHA256)).not.toThrow();
  });

  it('keeps the bounded JPEG thumbnail contract', () => {
    expect(() => assertThumbnailDimensions({ type: 'png', width: 320, height: 200 }, '/thumb.png')).toThrow(/JPEG/i);
    expect(() => assertThumbnailDimensions({ type: 'jpg', width: 321, height: 200 }, '/thumb.jpg')).toThrow(/320px/i);
    expect(() => assertThumbnailDimensions({ type: 'jpg', width: 200, height: 321 }, '/thumb.jpg')).toThrow(/320px/i);
    expect(() => assertThumbnailDimensions({ type: 'jpg', width: 320, height: 200 }, '/thumb.jpg')).not.toThrow();
    expect(() => assertThumbnailFilenameHash('/assets/case-studies/example-thumb-deadbeefdead.jpg', '0123456789abcdef')).toThrow(/derivative hash/i);
    expect(() => assertThumbnailFilenameHash('/assets/case-studies/example-thumb-0123456789ab.jpg', '0123456789abcdef')).not.toThrow();
  });
});
