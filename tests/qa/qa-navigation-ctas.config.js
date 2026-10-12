import { defineConfig, devices } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertLoopbackPreviewUrl } from './qa-local-only.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const overrideBaseURL = process.env.QA_NAVIGATION_CTA_BASE_URL;
const port = 4277;
const baseURL = overrideBaseURL || `http://127.0.0.1:${port}`;
assertLoopbackPreviewUrl(baseURL);
process.env.QA_LOCAL_ONLY = '1';
if (!process.env.QA_NAVIGATION_CTA_OUTPUT_DIR) {
  process.env.QA_NAVIGATION_CTA_OUTPUT_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'horizons-qa-navigation-ctas-'));
  console.log(`Navigation CTA QA output: ${process.env.QA_NAVIGATION_CTA_OUTPUT_DIR}`);
}
const outputDir = process.env.QA_NAVIGATION_CTA_OUTPUT_DIR;
const distDir = path.join(outputDir, 'dist');

export default defineConfig({
  testDir: '.',
  testMatch: 'qa-navigation-ctas.spec.js',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  workers: 1,
  use: { baseURL, serviceWorkers: 'block', screenshot: 'off', trace: 'off', video: 'off' },
  outputDir: path.join(outputDir, 'test-results'),
  reporter: [['list'], ['json', { outputFile: path.join(outputDir, 'results.json') }]],
  webServer: overrideBaseURL ? undefined : {
    command: `VITE_CONVEX_URL=https://qa-navigation.convex.cloud VITE_SENTRY_DSN= VITE_GA_TRACKING_ID= vite build --outDir "${distDir}" --emptyOutDir && vite preview --outDir "${distDir}" --host 127.0.0.1 --port ${port} --strictPort`,
    cwd: repoRoot,
    url: baseURL,
    timeout: 180_000,
    reuseExistingServer: false,
  },
  // Mobile-width desktop browsers retain real mouse modifier/middle-click input.
  projects: ['chromium', 'webkit'].flatMap((browserName) =>
    [1440, 390].flatMap((width) =>
      ['no-preference', 'reduce'].map((reducedMotion) => ({
        name: `${browserName}-${width}-${reducedMotion}`,
        use: {
          ...devices[browserName === 'webkit' ? 'Desktop Safari' : 'Desktop Chrome'],
          viewport: { width, height: width === 390 ? 844 : 900 },
          reducedMotion,
        },
      })),
    )),
});
