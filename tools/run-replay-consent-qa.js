import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = process.env.QA_REPLAY_PORT ?? '5401';
if (!/^\d+$/.test(port) || Number(port) < 1024 || Number(port) > 65535) {
  throw new Error('QA_REPLAY_PORT must be an unprivileged TCP port');
}
const artifactDir = await mkdtemp(path.join(tmpdir(), 'replay-consent-'));
const baseURL = `http://127.0.0.1:${port}`;
const env = {
  ...process.env,
  VITE_CONVEX_URL: '',
  QA_REPLAY_BUILD_DIR: path.join(artifactDir, 'dist'),
  QA_REPLAY_OUTPUT_DIR: path.join(artifactDir, 'results'),
  QA_REPLAY_URL: baseURL,
};
const vite = path.join(repoRoot, 'node_modules/vite/bin/vite.js');

function run(script, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, ...args], { cwd: repoRoot, env, stdio: 'inherit' });
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`${path.basename(script)} failed (${code ?? signal})`));
    });
  });
}

let server;
try {
  await run(vite, ['build', '-c', 'tests/qa/qa-replay-consent.vite.config.js']);
  server = spawn(process.execPath, [vite, 'preview', '-c', 'tests/qa/qa-replay-consent.vite.config.js', '--host', '127.0.0.1', '--port', port, '--strictPort'], {
    cwd: repoRoot, env, stdio: ['ignore', 'pipe', 'pipe'],
  });
  await new Promise((resolve, reject) => {
    let output = '';
    const timeout = setTimeout(() => reject(new Error('Replay fixture server did not start')), 15000);
    const read = (chunk) => {
      output += chunk.toString();
      process.stdout.write(chunk);
      if (output.includes(baseURL)) { clearTimeout(timeout); resolve(); }
    };
    server.stdout.on('data', read);
    server.stderr.on('data', read);
    server.once('error', (error) => { clearTimeout(timeout); reject(error); });
    server.once('exit', (code) => { clearTimeout(timeout); reject(new Error(`Replay fixture server exited (${code})`)); });
  });
  await run(path.join(repoRoot, 'node_modules/@playwright/test/cli.js'), ['test', '-c', 'tests/qa/qa-replay-consent.config.js', ...process.argv.slice(2)]);
} finally {
  if (server && server.exitCode === null && !server.signalCode) {
    await new Promise((resolve) => { server.once('exit', resolve); server.kill('SIGTERM'); });
  }
  await rm(artifactDir, { recursive: true, force: true });
}
