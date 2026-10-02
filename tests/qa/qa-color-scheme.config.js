import { defineConfig } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertLoopbackPreviewUrl } from './qa-local-only.js';

// Run against an existing production preview. Keeping build and QA separate
// permits the same probes to capture the original dist before rebuilding it.
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const baseURL = process.env.QA_COLOR_SCHEME_BASE_URL || 'http://127.0.0.1:4261';
assertLoopbackPreviewUrl(baseURL);
process.env.QA_LOCAL_ONLY = '1';
process.env.QA_COLOR_SCHEME_OUTPUT_DIR ||= fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-color-scheme-'));
const outputDir = path.resolve(process.env.QA_COLOR_SCHEME_OUTPUT_DIR);
if (outputDir === repoRoot || outputDir.startsWith(`${repoRoot}${path.sep}`)) {
  throw new Error('QA_COLOR_SCHEME_OUTPUT_DIR must be outside the repository');
}
if (process.env.QA_COLOR_SCHEME_PHASE && !['before', 'after'].includes(process.env.QA_COLOR_SCHEME_PHASE)) {
  throw new Error('QA_COLOR_SCHEME_PHASE must be before or after');
}
fs.mkdirSync(outputDir, { recursive: true });
process.env.QA_COLOR_SCHEME_OUTPUT_DIR = outputDir;

export default defineConfig({
  testDir: '.',
  testMatch: 'qa-color-scheme.spec.js',
  timeout: 120_000,
  expect: { timeout: 10_000 },
  workers: 1,
  outputDir: path.join(outputDir, 'test-results'),
  reporter: [['list']],
  use: { baseURL, screenshot: 'off', trace: 'off', video: 'off', serviceWorkers: 'block' },
  projects: ['chromium', 'webkit'].flatMap(browserName =>
    [390, 1440].flatMap(width =>
      ['no-preference', 'reduce'].map(reducedMotion => ({
        name: `${browserName}-${width}-${reducedMotion}`,
        use: { browserName, viewport: { width, height: width === 1440 ? 900 : 844 }, contextOptions: { reducedMotion } },
      })),
    ),
  ),
});
