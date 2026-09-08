import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = '4174';
const previewUrl = `http://127.0.0.1:${port}`;
const fakeDsn = 'https://0123456789abcdef0123456789abcdef@telemetry.invalid/1';

function start(command, args, options) {
  const child = spawn(command, args, options);
  let output = '';
  const write = (chunk) => {
    output += chunk;
    process.stdout.write(chunk);
  };
  child.stdout.on('data', write);
  child.stderr.on('data', write);
  return { child, getOutput: () => output };
}

function waitForLoopbackServer(server) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Timed out waiting for Vite on ${previewUrl}\n${server.getOutput()}`));
    }, 15_000);

    const ready = () => {
      if (server.getOutput().includes(previewUrl)) {
        clearTimeout(timeout);
        resolve();
      }
    };

    server.child.stdout.on('data', ready);
    server.child.stderr.on('data', ready);
    server.child.once('exit', (code, signal) => {
      clearTimeout(timeout);
      reject(new Error(`Vite exited before it was ready (code ${code}, signal ${signal})\n${server.getOutput()}`));
    });
    ready();
  });
}

function waitForExit(child) {
  return new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code, signal) => resolve({ code, signal }));
  });
}

async function stop(server) {
  if (server.child.exitCode !== null || server.child.signalCode) return;
  server.child.kill('SIGTERM');
  await new Promise((resolve) => {
    const timeout = setTimeout(() => {
      server.child.kill('SIGKILL');
      resolve();
    }, 5_000);
    server.child.once('exit', () => {
      clearTimeout(timeout);
      resolve();
    });
  });
}

const server = start(
  process.execPath,
  [path.join(repoRoot, 'node_modules/vite/bin/vite.js'), '--host', '127.0.0.1', '--port', port, '--strictPort'],
  {
    cwd: repoRoot,
    env: { ...process.env, NODE_ENV: 'production', VITE_SENTRY_DSN: fakeDsn },
    stdio: ['ignore', 'pipe', 'pipe'],
  },
);

try {
  await waitForLoopbackServer(server);
  const playwright = start(
    process.execPath,
    [
      path.join(repoRoot, 'node_modules/@playwright/test/cli.js'),
      'test',
      '-c', 'tests/qa/qa.config.js',
      'tests/qa/qa-contact.spec.js',
      '--project=preview-desktop',
      '--grep', 'fake Sentry',
    ],
    {
      cwd: repoRoot,
      env: {
        ...process.env,
        QA_LOCAL_ONLY: '1',
        QA_PREVIEW_URL: previewUrl,
        QA_FAKE_SENTRY: '1',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  const result = await waitForExit(playwright.child);
  if (result.code !== 0) {
    throw new Error(`Fake transport Playwright check failed (code ${result.code}, signal ${result.signal})`);
  }
} finally {
  await stop(server);
}
