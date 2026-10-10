// @vitest-environment node
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const script = fileURLToPath(new URL('./validate-convex-url.sh', import.meta.url));
const PR_FALLBACK_URL = 'https://coordinated-mandrill-587.eu-west-1.convex.cloud';

let dir;
let githubEnv;
beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'validate-convex-url-'));
  githubEnv = path.join(dir, 'github-env');
  writeFileSync(githubEnv, '');
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

// Only PATH is inherited so a developer's own VITE_CONVEX_URL cannot leak in.
const validate = ({ event = 'push', url } = {}) => {
  const run = spawnSync('bash', [script], {
    env: {
      PATH: process.env.PATH,
      GITHUB_ENV: githubEnv,
      GITHUB_EVENT_NAME: event,
      ...(url === undefined ? {} : { VITE_CONVEX_URL: url }),
    },
    encoding: 'utf8',
  });
  return { ...run, exported: readFileSync(githubEnv, 'utf8') };
};

describe('shared CI Convex URL validation', () => {
  it.each([
    'https://happy-animal-123.convex.cloud',
    'https://happy-animal-123.convex.cloud/',
    'https://happy-animal-123.eu-west-1.convex.cloud',
  ])('exports the accepted production-like URL %s', (url) => {
    const run = validate({ url });
    expect(run.status).toBe(0);
    expect(run.exported).toBe(`VITE_CONVEX_URL=${url}\n`);
  });

  it('uses the temporary fallback only for pull requests', () => {
    const run = validate({ event: 'pull_request' });
    expect(run.status).toBe(0);
    expect(run.stdout).toContain('::warning title=Missing Convex URL::');
    expect(run.exported).toBe(`VITE_CONVEX_URL=${PR_FALLBACK_URL}\n`);
  });

  it.each([undefined, ''])('fails a push without a configured URL (%j)', (url) => {
    const run = validate({ url });
    expect(run.status).toBe(1);
    expect(run.stdout).toContain('::error title=Missing Convex URL::');
    expect(run.exported).toBe('');
  });

  it.each([
    ['http scheme', 'http://happy-animal-123.convex.cloud'],
    ['non-Convex host', 'https://happy-animal-123.example.com'],
    ['extra path', 'https://happy-animal-123.convex.cloud/api'],
    ['too many subdomains', 'https://a.b.c.convex.cloud'],
    ['uppercase host', 'https://Happy-Animal.convex.cloud'],
    ['newline injection', 'https://happy-animal-123.convex.cloud\nNODE_OPTIONS=--require=/tmp/x'],
  ])('rejects an invalid URL: %s', (_label, url) => {
    const run = validate({ url });
    expect(run.status).toBe(1);
    expect(run.stdout).toContain('::error title=Invalid Convex URL::');
    expect(run.exported).toBe('');
  });

  it.each([
    'https://your-deployment.convex.cloud',
    'https://placeholder-123.convex.cloud',
  ])('rejects a placeholder backend %s', (url) => {
    const run = validate({ url, event: 'pull_request' });
    expect(run.status).toBe(1);
    expect(run.stdout).toContain('::error title=Unsafe Convex URL::');
    expect(run.exported).toBe('');
  });
});
