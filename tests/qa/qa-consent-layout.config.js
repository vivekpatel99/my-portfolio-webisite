import { defineConfig } from '@playwright/test';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import { assertLoopbackPreviewUrl } from './qa-local-only.js';

const baseURL = process.env.QA_CONSENT_BASE_URL || 'http://127.0.0.1:4318';
assertLoopbackPreviewUrl(baseURL);
const outputDir = process.env.QA_CONSENT_OUTPUT_DIR || fs.mkdtempSync(path.join(os.tmpdir(), 'horizons-consent-layout-'));
export default defineConfig({
  testDir: '.',
  testMatch: process.env.QA_CONSENT_EXISTING === '1' ? 'qa-consent.spec.js' : 'qa-consent-layout.spec.js',
  outputDir: path.join(outputDir, 'results'),
  reporter: [['list'], ['json', { outputFile: path.join(outputDir, 'report.json') }]],
  timeout: 90000,
  workers: 1,
  use: { baseURL, serviceWorkers: 'block', screenshot: 'off', trace: 'off', video: 'off' },
  projects: [
    { name: 'consent-chromium', use: { browserName: 'chromium' } },
    { name: 'consent-webkit', use: { browserName: 'webkit' } },
  ],
});
