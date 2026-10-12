import { defineConfig } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { assertLoopbackPreviewUrl } from './qa-local-only.js';

const baseURL = process.env.QA_CONTACT_SOCIAL_BASE_URL || 'http://127.0.0.1:4407';
assertLoopbackPreviewUrl(baseURL);
process.env.QA_LOCAL_ONLY = '1';
process.env.QA_CONTACT_SOCIAL_OUTPUT_DIR ||= fs.mkdtempSync(path.join(os.tmpdir(), 'horizons-contact-social-'));

export default defineConfig({
  testDir: '.',
  testMatch: 'qa-contact-social-targets.spec.js',
  timeout: 60_000,
  workers: 1,
  outputDir: path.join(process.env.QA_CONTACT_SOCIAL_OUTPUT_DIR, 'test-results'),
  reporter: [['list']],
  use: { baseURL, screenshot: 'off', trace: 'off', video: 'off', serviceWorkers: 'block' },
  projects: ['chromium', 'webkit'].flatMap(browserName =>
    [320, 390, 1440].flatMap(width =>
      ['no-preference', 'reduce'].map(reducedMotion => ({
        name: `${browserName}-${width}-${reducedMotion}`,
        use: {
          browserName,
          viewport: { width, height: width === 1440 ? 900 : width === 320 ? 740 : 844 },
          hasTouch: width < 1440,
          reducedMotion,
        },
      })),
    ),
  ),
});
