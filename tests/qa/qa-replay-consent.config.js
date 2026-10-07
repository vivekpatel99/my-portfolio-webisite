import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: 'qa-replay-consent.spec.js',
  outputDir: process.env.QA_REPLAY_OUTPUT_DIR ?? '/tmp/replay-consent-results',
  reporter: 'list',
  workers: 1,
  use: { baseURL: process.env.QA_REPLAY_URL ?? 'http://127.0.0.1:5401', serviceWorkers: 'block' },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
});
