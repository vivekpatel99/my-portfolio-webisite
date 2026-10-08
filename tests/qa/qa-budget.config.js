import { defineConfig, devices } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { assertLoopbackPreviewUrl } from './qa-local-only.js';

const baseURL = process.env.QA_BUDGET_BASE_URL || 'http://127.0.0.1:4278';
assertLoopbackPreviewUrl(baseURL);
process.env.QA_LOCAL_ONLY = '1';
const outputDir = process.env.QA_BUDGET_OUTPUT_DIR || fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-budget-'));

export default defineConfig({
  testDir: '.',
  testMatch: 'qa-budget.spec.js',
  workers: 1,
  timeout: 40_000,
  use: { baseURL, serviceWorkers: 'block', screenshot: 'off', trace: 'off', video: 'off' },
  outputDir: path.join(outputDir, 'test-results'),
  reporter: [['list'], ['json', { outputFile: path.join(outputDir, 'qa-results.json') }]],
  projects: ['chromium', 'webkit'].flatMap(browserName =>
    [320, 390, 1440].flatMap(width =>
      ['no-preference', 'reduce'].map(reducedMotion => ({
        name: `${browserName}-${width}-${reducedMotion}`,
        use: {
          ...devices[browserName === 'webkit' ? (width === 1440 ? 'Desktop Safari' : 'iPhone 13') : 'Desktop Chrome'],
          browserName,
          viewport: { width, height: width === 1440 ? 900 : 844 },
          hasTouch: width < 1440,
          reducedMotion,
        },
      })),
    ),
  ),
});
