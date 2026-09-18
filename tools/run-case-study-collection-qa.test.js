// @vitest-environment node
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  assertLocalQaEnvironment,
  assertNoBlockedRequests,
} from './run-case-study-collection-qa.js';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('assertLocalQaEnvironment', () => {
  it.each(['true', '1', 'yes'])('throws when CI=%s', (value) => {
    expect(() => assertLocalQaEnvironment({ CI: value })).toThrow(/local-only and refused in CI/);
  });

  it('does not throw when CI is missing', () => {
    expect(() => assertLocalQaEnvironment({})).not.toThrow();
  });

  it('does not throw when CI is empty', () => {
    expect(() => assertLocalQaEnvironment({ CI: '' })).not.toThrow();
  });

  it('throws in production even without CI', () => {
    expect(() => assertLocalQaEnvironment({ NODE_ENV: 'production' })).toThrow(/local-only and refused in CI/);
  });
});

describe('assertNoBlockedRequests', () => {
  it('passes for an empty list', () => {
    expect(() => assertNoBlockedRequests([])).not.toThrow();
  });

  it('throws when any request was blocked', () => {
    expect(() => assertNoBlockedRequests(['https://telemetry.invalid/collect'])).toThrow(
      /blocked external requests/,
    );
  });
});

describe('collection QA screenshot ignore', () => {
  it('ignores screenshots under .scratch/', () => {
    execFileSync('git', ['check-ignore', '-q', '.scratch/case-study-collection-qa/desktop-20-loaded.png'], {
      cwd: repositoryRoot,
    });
  });
});
