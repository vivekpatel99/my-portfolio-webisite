import { defineConfig } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { assertLoopbackPreviewUrl } from './qa-local-only.js';

const baseURL = process.env.QA_ACTION_BASE_URL || 'http://127.0.0.1:3000';
assertLoopbackPreviewUrl(baseURL);
process.env.QA_LOCAL_ONLY = '1';
const outputDir = process.env.QA_ACTION_OUTPUT_DIR || fs.mkdtempSync(path.join(os.tmpdir(), 'qa-action-family-'));
process.env.QA_ACTION_OUTPUT_DIR = outputDir;

export default defineConfig({
  testDir: '.',
  testMatch: 'qa-action-family.spec.js',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  workers: 2,
  outputDir: path.join(outputDir, 'test-results'),
  reporter: [['list'], ['json', { outputFile: path.join(outputDir, 'results.json') }]],
  use: { baseURL, serviceWorkers: 'block', screenshot: 'off', trace: 'off', video: 'off' },
  projects: ['chromium', 'webkit'].flatMap((browserName) =>
    [{ width: 1440, height: 900 }, { width: 980, height: 1324 }, { width: 390, height: 844 }, { width: 320, height: 740 }].flatMap((viewport) =>
      ['no-preference', 'reduce'].map((reducedMotion) => ({
        name: `${browserName}-${viewport.width}-${reducedMotion}`,
        use: { browserName, viewport, reducedMotion, hasTouch: viewport.width < 768 },
      })),
    )),
});
