import path from 'node:path';
import { fileURLToPath } from 'node:url';
import baseConfig from '../../vite.config.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

// Keep this dev server's dependency cache separate from the normal preview/dev
// server. The contact lifecycle suite intentionally injects a synthetic Convex
// URL at server start and must not reuse a bundle produced with another value.
export default {
  ...baseConfig,
  cacheDir: path.join(repoRoot, 'node_modules/.vite-contact-lifecycle'),
};
