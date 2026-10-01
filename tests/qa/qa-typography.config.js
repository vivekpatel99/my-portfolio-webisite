import { defineConfig } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { assertLoopbackPreviewUrl } from './qa-local-only.js';

const baseURL = process.env.QA_TYPOGRAPHY_BASE_URL || 'http://127.0.0.1:4260';
assertLoopbackPreviewUrl(baseURL);
process.env.QA_LOCAL_ONLY = '1';
const outputDir = process.env.QA_TYPOGRAPHY_OUTPUT_DIR || fs.mkdtempSync(path.join(os.tmpdir(), 'horizons-typography-'));
process.env.QA_TYPOGRAPHY_OUTPUT_DIR = outputDir;

export default defineConfig({
  testDir: '.',
  testMatch: 'qa-typography.spec.js',
  timeout: 60_000,
  workers: 2,
  use: { baseURL, serviceWorkers: 'block', screenshot: 'off', trace: 'off', video: 'off' },
  outputDir: path.join(outputDir, 'test-results'),
  reporter: [['list'], ['json', { outputFile: path.join(outputDir, 'results.json') }]],
  projects: ['chromium', 'webkit'].flatMap((browserName) => [320, 360, 390, 430, 1024, 1440].flatMap((width) =>
    ['no-preference', 'reduce'].map((reducedMotion) => ({
      name: `${browserName}-${width}-${reducedMotion}`,
      use: { browserName, viewport: { width, height: width < 500 ? 844 : 900 }, reducedMotion },
    })))),
});
