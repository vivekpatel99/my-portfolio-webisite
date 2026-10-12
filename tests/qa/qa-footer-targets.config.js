import { defineConfig } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertLoopbackPreviewUrl } from './qa-local-only.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const baseURL = process.env.QA_FOOTER_BASE_URL || 'http://127.0.0.1:4276';
assertLoopbackPreviewUrl(baseURL);
process.env.QA_FOOTER_OUTPUT_DIR ||= fs.mkdtempSync(path.join(os.tmpdir(), 'horizons-footer-'));
const outputDir = process.env.QA_FOOTER_OUTPUT_DIR;
const distDir = path.join(outputDir, 'dist');

export default defineConfig({
  testDir: '.',
  testMatch: 'qa-footer-targets.spec.js',
  timeout: 180_000,
  workers: 1,
  outputDir: path.join(outputDir, 'test-results'),
  reporter: [['list']],
  use: { baseURL, screenshot: 'off', trace: 'off', video: 'off', serviceWorkers: 'block' },
  webServer: process.env.QA_FOOTER_BASE_URL ? undefined : {
    command: `vite build --outDir "${distDir}" --emptyOutDir && vite preview --outDir "${distDir}" --host 127.0.0.1 --port 4276 --strictPort`,
    cwd: repoRoot,
    url: baseURL,
    timeout: 180_000,
    reuseExistingServer: false,
  },
  projects: ['chromium', 'webkit'].flatMap(browserName =>
    [320, 390, 1440].flatMap(width =>
      ['no-preference', 'reduce'].map(reducedMotion => ({
        name: `${browserName}-${width}-${reducedMotion}`,
        use: { browserName, viewport: { width, height: width === 1440 ? 900 : 844 }, reducedMotion },
      })),
    ),
  ),
});
