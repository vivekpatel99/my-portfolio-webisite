import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export default defineConfig({
  root: path.join(root, 'tests/qa/fixtures/replay-consent'),
  plugins: [react()],
  resolve: { alias: [
    { find: /^@sentry\/react$/, replacement: path.join(root, 'tests/qa/fixtures/replay-consent/sdk.js') },
    { find: '@', replacement: path.join(root, 'src') },
  ] },
  define: { 'import.meta.env.VITE_SENTRY_DSN': JSON.stringify('https://0123456789abcdef0123456789abcdef@telemetry.invalid/1') },
  build: { target: 'esnext', outDir: process.env.QA_REPLAY_BUILD_DIR, emptyOutDir: true },
});
