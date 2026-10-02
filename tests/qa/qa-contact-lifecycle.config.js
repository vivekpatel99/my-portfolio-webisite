import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, '../..');
const port = Number(process.env.QA_CONTACT_LIFECYCLE_PORT || 4192);
const baseURL = `http://127.0.0.1:${port}`;
const artifactDir = process.env.QA_CONTACT_LIFECYCLE_ARTIFACT_DIR
  ? path.resolve(process.env.QA_CONTACT_LIFECYCLE_ARTIFACT_DIR)
  : path.join(repoRoot, 'playwright-output/contact-lifecycle');

export default defineConfig({
  testDir,
  testMatch: 'qa-contact-lifecycle.spec.js',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: Boolean(process.env.CI),
  workers: process.env.CI ? 2 : 1,
  use: {
    baseURL,
    serviceWorkers: 'block',
    screenshot: 'off',
    trace: 'off',
    video: 'off',
  },
  projects: ['chromium', 'webkit'].flatMap((browserName) =>
    [1280, 390].flatMap((width) =>
      ['no-preference', 'reduce'].map((reducedMotion) => ({
        name: `${browserName}-${width}-${reducedMotion}`,
        use: {
          ...devices[browserName === 'webkit' ? 'Desktop Safari' : 'Desktop Chrome'],
          browserName,
          viewport: { width, height: 800 },
          reducedMotion,
        },
      })),
    ),
  ),
  outputDir: path.join(artifactDir, 'test-results'),
  reporter: [['list'], ['json', { outputFile: path.join(artifactDir, 'qa-results.json') }]],
  webServer: {
    command: `NODE_ENV=development VITE_CONVEX_URL=https://qa-contact-lifecycle.convex.cloud VITE_SENTRY_DSN= VITE_GA_TRACKING_ID= vite --config tests/qa/qa-contact-lifecycle.vite.config.js --host 127.0.0.1 --port ${port} --strictPort`,
    cwd: repoRoot,
    url: baseURL,
    timeout: 120_000,
    reuseExistingServer: false,
  },
});
