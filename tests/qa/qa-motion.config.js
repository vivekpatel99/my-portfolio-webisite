import { defineConfig, devices } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertLoopbackPreviewUrl } from './qa-local-only.js';

// By default every test runs against one fresh production build of the current
// source, previewed on its own port with a synthetic Convex URL that the spec
// answers in memory. QA_MOTION_BASE_URL is an opt-in baseline mode: it targets
// an existing loopback preview and starts no server.
const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, '../..');
const SYNTHETIC_CONVEX_URL = 'https://qa-motion.convex.cloud';
const overrideBaseURL = process.env.QA_MOTION_BASE_URL;
const port = Number(process.env.QA_MOTION_PORT || 4267);
const baseURL = overrideBaseURL || `http://127.0.0.1:${port}`;

// Workers reload this config and inherit the runner environment, so the
// directory is created once and pinned for them.
if (!process.env.QA_MOTION_OUTPUT_DIR) {
  process.env.QA_MOTION_OUTPUT_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'horizons-qa-motion-'));
  console.log(`Motion QA output: ${process.env.QA_MOTION_OUTPUT_DIR}`);
}
const outputDir = process.env.QA_MOTION_OUTPUT_DIR;
const distDir = path.join(outputDir, 'dist');

assertLoopbackPreviewUrl(baseURL);

const DESKTOP_VIEWPORT = { width: 1440, height: 900 };
const MOBILE_VIEWPORT = { width: 390, height: 900 };

export default defineConfig({
  testDir,
  testMatch: 'qa-motion.spec.js',
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
  outputDir: path.join(outputDir, 'test-results'),
  reporter: [['list']],
  webServer: overrideBaseURL ? undefined : {
    command: [
      `VITE_CONVEX_URL=${SYNTHETIC_CONVEX_URL} VITE_SENTRY_DSN= VITE_GA_TRACKING_ID=`,
      `vite build --outDir "${distDir}" --emptyOutDir`,
      `&& vite preview --outDir "${distDir}" --host 127.0.0.1 --port ${port} --strictPort`,
    ].join(' '),
    cwd: repoRoot,
    url: baseURL,
    timeout: 180_000,
    reuseExistingServer: false,
  },
  projects: [
    { name: 'motion-chromium-desktop', use: { ...devices['Desktop Chrome'], viewport: DESKTOP_VIEWPORT } },
    { name: 'motion-chromium-mobile', use: { ...devices['iPhone 14'], browserName: 'chromium', viewport: MOBILE_VIEWPORT } },
    { name: 'motion-webkit-desktop', use: { ...devices['Desktop Safari'], viewport: DESKTOP_VIEWPORT } },
    { name: 'motion-webkit-mobile', use: { ...devices['iPhone 14'], viewport: MOBILE_VIEWPORT } },
  ],
});
