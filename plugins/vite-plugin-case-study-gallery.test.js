// @vitest-environment node
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import publicationPlugin, { assertThumbnailBinding, assertThumbnailDimensions, assertThumbnailFilenameHash } from './vite-plugin-case-study-publication.js';

// Legacy asset fixtures stay independent of the current staged content library.
vi.mock('../publication/compile-case-studies.js', async (importOriginal) => {
  const actual = await importOriginal();
  const { caseStudyPublicationBaseline } = await import('../publication/case-study-manifest.js');
  return { ...actual, compileCaseStudyPublication: (options = {}) => actual.compileCaseStudyPublication({ ...options, manifest: caseStudyPublicationBaseline }) };
});

describe('gallery asset delivery', () => {
  it('emits gallery-only images and excludes unrelated retained assets', () => {
    const emitted = [];
    publicationPlugin().generateBundle.call({ emitFile: (asset) => emitted.push(asset.fileName) });
    expect(emitted).toContain('assets/case-studies/invoice-ocr-excel-results.png');
    expect(emitted).toContain('assets/case-studies/n8n-error-handler.png');
    expect(emitted).toContain('assets/case-studies/yoga-pose-output-5.jpg');
    expect(emitted).toContain('assets/case-studies/n8n-excel-to-json-thumb-7d0eae27bff6.jpg');
    expect(emitted).toContain('assets/case-studies/yoga-pose-thumb-734c037c9f53.jpg');
    expect(emitted).not.toContain('assets/case-studies/planning-graph.webp');
    expect(emitted.some((fileName) => fileName.startsWith('assets/case-studies/planning-graph-thumb-'))).toBe(false);
    expect(emitted).not.toContain('assets/case-studies/football-tracking.mp4');
    expect(new Set(emitted).size).toBe(emitted.length);
  });
  it('allows gallery-only dev requests but denies unrelated assets', () => {
    let middleware;
    publicationPlugin().configureServer({ middlewares: { use: (handler) => { middleware = handler; } } });
    let allowed = false;
    middleware({ url: '/assets/case-studies/invoice-ocr-excel-results.png' }, {}, (error) => { if (error) throw error; allowed = true; });
    expect(allowed).toBe(true);
    let thumbnailAllowed = false;
    middleware({ url: '/assets/case-studies/invoice-ocr-excel-results-thumb-baf8afeedb27.jpg' }, {}, (error) => { if (error) throw error; thumbnailAllowed = true; });
    expect(thumbnailAllowed).toBe(true);
    const response = { end() {} };
    middleware({ url: '/assets/case-studies/planning-graph.webp' }, response, () => { throw new Error('Unrelated image was allowed'); });
    expect(response.statusCode).toBe(404);
    middleware({ url: '/assets/case-studies/planning-graph-thumb-deadbeefdead.jpg' }, response, () => { throw new Error('Unrelated thumbnail was allowed'); });
    expect(response.statusCode).toBe(404);
  });

  it('rejects tampered source and derivative bytes in an isolated fixture', () => {
    const directory = mkdtempSync(path.join(os.tmpdir(), 'case-study-thumbnail-binding-'));
    const publicDirectory = path.join(directory, 'public');
    const sourcePath = path.join(publicDirectory, 'assets/case-studies/invoice-ocr-excel-results.png');
    const thumbnailPath = path.join(publicDirectory, 'assets/case-studies/invoice-ocr-excel-results-thumb-baf8afeedb27.jpg');
    try {
      mkdirSync(path.dirname(sourcePath), { recursive: true });
      cpSync('public/assets/case-studies/invoice-ocr-excel-results.png', sourcePath, { recursive: false });
      cpSync('public/assets/case-studies/invoice-ocr-excel-results-thumb-baf8afeedb27.jpg', thumbnailPath, { recursive: false });
      writeFileSync(sourcePath, 'tampered source');
      expect(() => assertThumbnailBinding(publicDirectory, '/assets/case-studies/invoice-ocr-excel-results-thumb-baf8afeedb27.jpg'))
        .toThrow(/source changed/i);

      cpSync('public/assets/case-studies/invoice-ocr-excel-results.png', sourcePath, { recursive: false });
      writeFileSync(thumbnailPath, 'tampered thumbnail');
      expect(() => assertThumbnailBinding(publicDirectory, '/assets/case-studies/invoice-ocr-excel-results-thumb-baf8afeedb27.jpg'))
        .toThrow(/thumbnail changed/i);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('rejects derivative dimensions outside the bounded JPEG contract', () => {
    expect(() => assertThumbnailDimensions({ type: 'png', width: 320, height: 200 }, '/thumb.png'))
      .toThrow(/JPEG/i);
    expect(() => assertThumbnailDimensions({ type: 'jpg', width: 321, height: 200 }, '/thumb.jpg'))
      .toThrow(/320px/i);
    expect(() => assertThumbnailDimensions({ type: 'jpg', width: 200, height: 321 }, '/thumb.jpg'))
      .toThrow(/320px/i);
    expect(() => assertThumbnailDimensions({ type: 'jpg', width: 320, height: 200 }, '/thumb.jpg')).not.toThrow();
  });

  it('requires the derivative filename to carry its registered hash prefix', () => {
    expect(() => assertThumbnailFilenameHash('/assets/case-studies/example-thumb-deadbeefdead.jpg', '0123456789abcdef'))
      .toThrow(/derivative hash/i);
    expect(() => assertThumbnailFilenameHash('/assets/case-studies/example-thumb-0123456789ab.jpg', '0123456789abcdef'))
      .not.toThrow();
  });
});
