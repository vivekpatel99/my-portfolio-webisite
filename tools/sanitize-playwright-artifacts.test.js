import { link, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  sanitizePlaywrightArtifacts,
  sanitizePlaywrightReport, validateStagedArtifacts,
} from './sanitize-playwright-artifacts.js';

const fixturePath = path.resolve('tests/qa/fixtures/playwright-failure-report.json');
const temporaryDirectories = [];

async function temporaryPaths() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'horizons-qa-artifacts-test-'));
  temporaryDirectories.push(root);
  const outputDirectory = path.join(root, 'sanitized');
  return {
    rawReport: path.join(root, 'raw.json'),
    outputDirectory,
    summary: path.join(outputDirectory, 'summary.json'),
    failureResults: path.join(outputDirectory, 'failure-results.json'),
  };
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe('sanitized Playwright QA artifacts', () => {
  it('reconstructs only bounded, allowlisted result fields from a hostile raw report', async () => {
    const paths = await temporaryPaths();
    await writeFile(paths.rawReport, await readFile(fixturePath, 'utf8'), 'utf8');

    const result = await sanitizePlaywrightArtifacts({ paths });
    const summary = JSON.parse(await readFile(paths.summary, 'utf8'));
    const failures = JSON.parse(await readFile(paths.failureResults, 'utf8'));
    const serialized = `${JSON.stringify(summary)}${JSON.stringify(failures)}`;

    expect(result.created).toBe(true);
    expect(summary).toEqual({
      schemaVersion: 1,
      runStatus: 'failed',
      runnerErrorCount: 0,
      totalAttempts: { passed: 0, failed: 1, skipped: 0, timed_out: 0, interrupted: 0 },
      suites: [{
        suite: 'contact-validation',
        projects: [{
          project: 'preview-desktop',
          attempts: { passed: 0, failed: 1, skipped: 0, timed_out: 0, interrupted: 0 },
        }],
      }],
    });
    expect(failures).toEqual({
      schemaVersion: 1,
      failures: [{
        suite: 'contact-validation',
        sourceLine: 53,
        testOrdinal: 1,
        project: 'preview-desktop',
        retry: 1,
        outcome: 'failed',
        durationMs: 60_000,
      }],
    });
    expect(serialized).not.toMatch(/QA_SECRET_SENTINEL|Injected title|raw stack|localStorage|trace\.zip/);
  });

  it('fails closed for an unallowlisted normalized source path or project', () => {
    const unsafeSuite = {
      errors: [],
      suites: [{
        file: 'qa-contact-live.spec.js',
        specs: [{ file: 'qa-contact-live.spec.js', line: 1, tests: [] }],
      }],
    };
    const unsafeProject = {
      errors: [],
      suites: [{
        file: 'qa-contact.spec.js',
        specs: [{ file: 'qa-contact.spec.js', line: 1, tests: [{ projectName: 'prod-live-contact-submit', results: [] }] }],
      }],
    };

    expect(() => sanitizePlaywrightReport(unsafeSuite)).toThrow('not allowlisted');
    expect(() => sanitizePlaywrightReport(unsafeProject)).toThrow('not allowlisted');
  });

  it('removes prior upload candidates and emits nothing when no raw report exists', async () => {
    const paths = await temporaryPaths();
    await mkdir(paths.outputDirectory, { recursive: true });
    await writeFile(paths.summary, 'stale', 'utf8');
    await writeFile(paths.failureResults, 'stale', 'utf8');

    await expect(sanitizePlaywrightArtifacts({ paths })).resolves.toEqual({
      created: false,
      reason: 'raw-report-not-found',
    });
    await expect(readFile(paths.summary, 'utf8')).rejects.toMatchObject({ code: 'ENOENT' });
    await expect(readFile(paths.failureResults, 'utf8')).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('supports nested reporter suites and uses bounded source lines with global test ordinals', () => {
    const nested = {
      errors: [],
      suites: [{
        file: 'qa-routes.spec.js',
        suites: [{
          file: 'qa-routes.spec.js',
          specs: [{
            file: 'qa-routes.spec.js',
            line: 47,
            tests: [{ projectName: 'preview-mobile', results: [{ status: 'failed', duration: 12 }] }],
          }, {
            file: 'qa-routes.spec.js',
            line: 60,
            tests: [{ projectName: 'preview-mobile', results: [{ status: 'timedOut', duration: 13 }] }],
          }],
        }],
      }],
    };
    expect(sanitizePlaywrightReport(nested).failureResults.failures).toEqual([
      { suite: 'routing', sourceLine: 47, testOrdinal: 1, project: 'preview-mobile', retry: 1, outcome: 'failed', durationMs: 12 },
      { suite: 'routing', sourceLine: 60, testOrdinal: 2, project: 'preview-mobile', retry: 1, outcome: 'timed_out', durationMs: 13 },
    ]);
  });

  it('records bounded runner-error evidence when Playwright has no test attempts', () => {
    expect(sanitizePlaywrightReport({ errors: [{ message: 'QA_SECRET_SENTINEL' }], suites: [] }).summary).toEqual({
      schemaVersion: 1,
      runStatus: 'runner_error',
      runnerErrorCount: 1,
      totalAttempts: { passed: 0, failed: 0, skipped: 0, timed_out: 0, interrupted: 0 },
      suites: [],
    });
  });

  it('rejects linked staging and unexpected files before anything can be uploaded', async () => {
    const paths = await temporaryPaths();
    await mkdir(paths.outputDirectory, { recursive: true });
    const source = path.join(path.dirname(paths.outputDirectory), 'source.json');
    await writeFile(source, '{}', 'utf8');
    await link(source, paths.summary);
    await writeFile(paths.failureResults, '{}', 'utf8');
    await expect(validateStagedArtifacts({ paths })).rejects.toThrow('bounded regular file');

    await rm(paths.outputDirectory, { recursive: true, force: true });
    await symlink(path.dirname(paths.outputDirectory), paths.outputDirectory);
    await expect(sanitizePlaywrightArtifacts({ paths })).rejects.toThrow('output directory must be a real directory');
  });

  it.each(['.env', 'storage-state.json', 'video.webm', 'trace.zip', 'raw.log', 'source.js', 'screenshot.png'])(
    'rejects unexpected staged file %s',
    async (unexpectedName) => {
      const paths = await temporaryPaths();
      await writeFile(paths.rawReport, await readFile(fixturePath, 'utf8'), 'utf8');
      await sanitizePlaywrightArtifacts({ paths });
      await writeFile(path.join(paths.outputDirectory, unexpectedName), 'QA_SECRET_SENTINEL', 'utf8');

      await expect(validateStagedArtifacts({ paths })).rejects.toThrow('unexpected file');
    },
  );

  it('rejects a symlinked raw report before parsing it', async () => {
    const paths = await temporaryPaths();
    await symlink(fixturePath, paths.rawReport);

    await expect(sanitizePlaywrightArtifacts({ paths })).rejects.toThrow('raw report is not a bounded regular file');
  });

  it('rejects a tampered reconstructed document before upload', async () => {
    const paths = await temporaryPaths();
    await writeFile(paths.rawReport, await readFile(fixturePath, 'utf8'), 'utf8');
    await sanitizePlaywrightArtifacts({ paths });
    const summary = JSON.parse(await readFile(paths.summary, 'utf8'));
    summary.untrustedTitle = 'QA_SECRET_SENTINEL';
    await writeFile(paths.summary, JSON.stringify(summary), 'utf8');

    await expect(validateStagedArtifacts({ paths })).rejects.toThrow('bounded schema');
  });
});
