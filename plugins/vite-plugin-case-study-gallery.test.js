// @vitest-environment node
import { describe, expect, it } from 'vitest';
import publicationPlugin from './vite-plugin-case-study-publication.js';

describe('gallery asset delivery', () => {
  it('emits gallery-only images and excludes unrelated retained assets', () => {
    const emitted = [];
    publicationPlugin().generateBundle.call({ emitFile: (asset) => emitted.push(asset.fileName) });
    expect(emitted).toContain('assets/case-studies/invoice-ocr-excel-results.png');
    expect(emitted).toContain('assets/case-studies/n8n-error-handler.png');
    expect(emitted).toContain('assets/case-studies/yoga-pose-output-5.jpg');
    expect(emitted).not.toContain('assets/case-studies/planning-graph.webp');
    expect(emitted).not.toContain('assets/case-studies/football-tracking.mp4');
    expect(new Set(emitted).size).toBe(emitted.length);
  });
  it('allows gallery-only dev requests but denies unrelated assets', () => {
    let middleware;
    publicationPlugin().configureServer({ middlewares: { use: (handler) => { middleware = handler; } } });
    let allowed = false;
    middleware({ url: '/assets/case-studies/invoice-ocr-excel-results.png' }, {}, (error) => { if (error) throw error; allowed = true; });
    expect(allowed).toBe(true);
    const response = { end() {} };
    middleware({ url: '/assets/case-studies/planning-graph.webp' }, response, () => { throw new Error('Unrelated image was allowed'); });
    expect(response.statusCode).toBe(404);
  });
});
