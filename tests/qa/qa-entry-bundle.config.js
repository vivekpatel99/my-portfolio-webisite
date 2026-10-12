import { defineConfig, devices } from '@playwright/test';
import { mkdtempSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { assertLoopbackPreviewUrl } from './qa-local-only.js';

const baseURL = process.env.QA_ENTRY_BASE_URL || 'http://127.0.0.1:4264';
assertLoopbackPreviewUrl(baseURL);
process.env.QA_LOCAL_ONLY = '1';
process.env.QA_ENTRY_OUTPUT_DIR ||= mkdtempSync(path.join(os.tmpdir(), 'portfolio-entry-qa-'));
const outputDir = process.env.QA_ENTRY_OUTPUT_DIR;
export default defineConfig({
  testDir: '.', testMatch: 'qa-entry-bundle.spec.js', workers: 1,
  timeout: 240_000, expect: { timeout: 10_000 },
  outputDir: path.join(outputDir, 'results'),
  reporter: [['list'], ['json', { outputFile: path.join(outputDir, 'results.json') }]],
  use: { baseURL, serviceWorkers: 'block', screenshot: 'off', trace: 'off', video: 'off' },
  projects: [
    { name: 'entry-chromium-desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'entry-chromium-mobile', use: { ...devices['iPhone 14'], browserName: 'chromium', viewport: { width: 390, height: 900 } } },
    { name: 'entry-webkit-desktop', use: { ...devices['Desktop Safari'], viewport: { width: 1440, height: 900 } } },
    { name: 'entry-webkit-mobile', use: { ...devices['iPhone 14'], viewport: { width: 390, height: 900 } } },
  ],
});
