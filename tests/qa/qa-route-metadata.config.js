import { defineConfig } from '@playwright/test';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { assertLoopbackPreviewUrl } from './qa-local-only.js';

const baseURL = process.env.QA_PREVIEW_URL || 'http://127.0.0.1:3000';
assertLoopbackPreviewUrl(baseURL);
if (process.env.QA_LOCAL_ONLY !== '1') throw new Error('Route metadata QA requires QA_LOCAL_ONLY=1');
const outputDir = process.env.QA_METADATA_OUTPUT_DIR || fs.mkdtempSync(path.join(os.tmpdir(), 'horizons-route-metadata-'));

export default defineConfig({
  testDir: '.',
  testMatch: 'qa-route-metadata.spec.js',
  workers: 1,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  outputDir: path.join(outputDir, 'results'),
  reporter: [['list'], ['json', { outputFile: path.join(outputDir, 'results.json') }]],
  use: { baseURL, serviceWorkers: 'block', screenshot: 'off', trace: 'off', video: 'off' },
  projects: ['chromium', 'webkit'].flatMap((browserName) =>
    [390, 1280].flatMap((width) =>
      ['no-preference', 'reduce'].map((reducedMotion) => ({
        name: `${browserName}-${width}-${reducedMotion}`,
        use: { browserName, viewport: { width, height: width === 390 ? 844 : 800 }, reducedMotion },
      })),
    ),
  ),
});
