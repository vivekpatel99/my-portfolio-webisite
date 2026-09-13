import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, '../..');
const baseURL = 'http://127.0.0.1:4192';
const artifactDir = path.join(repoRoot, 'playwright-output/contact-lifecycle');

export default defineConfig({
  testDir,
  testMatch: 'qa-contact-lifecycle.spec.js',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  use: {
    ...devices['Desktop Chrome'],
    baseURL,
    serviceWorkers: 'block',
    screenshot: 'off',
    trace: 'off',
    video: 'off',
  },
  outputDir: path.join(artifactDir, 'test-results'),
  reporter: [['list'], ['json', { outputFile: path.join(artifactDir, 'qa-results.json') }]],
  webServer: {
    command: 'NODE_ENV=development VITE_CONVEX_URL=https://qa-contact-lifecycle.convex.cloud VITE_SENTRY_DSN= VITE_GA_TRACKING_ID= vite --config tests/qa/qa-contact-lifecycle.vite.config.js --host 127.0.0.1 --port 4192 --strictPort',
    cwd: repoRoot,
    url: baseURL,
    timeout: 120_000,
    reuseExistingServer: false,
  },
});
