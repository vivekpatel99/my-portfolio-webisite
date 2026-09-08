import { lstat, mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const toolDirectory = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(toolDirectory, '..');

export const artifactPaths = Object.freeze({
  rawReport: path.join(repoRoot, 'playwright-output', 'qa-results.json'),
  outputDirectory: path.join(repoRoot, 'qa-artifacts'),
  summary: path.join(repoRoot, 'qa-artifacts', 'summary.json'),
  failureResults: path.join(repoRoot, 'qa-artifacts', 'failure-results.json'),
});

const suites = Object.freeze({
  'qa-a11y.spec.js': { label: 'accessibility' },
  'qa-contact.spec.js': { label: 'contact-validation' },
  'qa-edge.spec.js': { label: 'edge-behavior' },
  'qa-local-navigation.spec.js': { label: 'local-navigation' },
  'qa-responsive.spec.js': { label: 'responsive-layout' },
  'qa-routes.spec.js': { label: 'routing' },
  'qa-upgrade-interactions.spec.js': { label: 'upgrade-interactions' },
  'qa-visual.spec.js': { label: 'visual-smoke' },
});

const projects = Object.freeze({
  'preview-desktop': 'preview-desktop',
  'preview-mobile': 'preview-mobile',
});

const outcomes = Object.freeze({
  passed: 'passed',
  failed: 'failed',
  skipped: 'skipped',
  timedOut: 'timed_out',
  interrupted: 'interrupted',
});

const failureOutcomes = new Set(['failed', 'timed_out', 'interrupted']);
const maxDurationMs = 60_000;
const maxRawReportBytes = 5 * 1024 * 1024;
const maxRunnerErrors = 1_000;
const maxTestOrdinal = 1_000;
const maxRetries = 3;
const maxArtifactBytes = 1024 * 1024;

function fail(message) {
  throw new Error(`Refusing to sanitize Playwright report: ${message}`);
}

function requireObject(value, context) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(`${context} must be an object`);
  return value;
}

function requireArray(value, context) {
  if (!Array.isArray(value)) fail(`${context} must be an array`);
  return value;
}

function allowlistedSourceName(value) {
  if (typeof value !== 'string' || value.length === 0) fail('suite source path must be a non-empty string');
  if (value !== path.posix.basename(value) || !Object.hasOwn(suites, value)) fail('suite source name is not allowlisted');
  return value;
}

function boundedDuration(value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) fail('result duration must be a non-negative finite number');
  return Math.min(Math.floor(value), maxDurationMs);
}

function emptyCounts() {
  return { passed: 0, failed: 0, skipped: 0, timed_out: 0, interrupted: 0 };
}

function addSuiteReport(suite, summary, failureResults, ordinalsBySource) {
  requireObject(suite, 'suite');
  const sourcePath = allowlistedSourceName(suite.file);
  const suiteDefinition = suites[sourcePath];
  const suiteSummary = summary.suites.find((entry) => entry.suite === suiteDefinition.label)
    ?? { suite: suiteDefinition.label, projects: [] };
  if (!summary.suites.includes(suiteSummary)) summary.suites.push(suiteSummary);

  const suiteSpecs = suite.specs === undefined ? [] : requireArray(suite.specs, 'suite specs');
  for (const spec of suiteSpecs) {
    requireObject(spec, 'spec');
    if (allowlistedSourceName(spec.file ?? suite.file) !== sourcePath) fail('spec source name does not match its suite');
    if (!Number.isInteger(spec.line) || spec.line < 1 || spec.line > 100_000) fail('spec source line is outside the allowed range');
    const tests = requireArray(spec.tests, 'spec tests');
    for (const test of tests) {
      requireObject(test, 'test');
      if (!Object.hasOwn(projects, test.projectName)) fail('test project is not allowlisted');
      const project = projects[test.projectName];
      const ordinalKey = `${sourcePath}\u0000${project}`;
      const testOrdinal = (ordinalsBySource.get(ordinalKey) ?? 0) + 1;
      if (testOrdinal > maxTestOrdinal) fail('test ordinal exceeds the allowed bound');
      ordinalsBySource.set(ordinalKey, testOrdinal);
      const projectSummary = suiteSummary.projects.find((entry) => entry.project === project)
        ?? { project, attempts: emptyCounts() };
      if (!suiteSummary.projects.includes(projectSummary)) suiteSummary.projects.push(projectSummary);

      const results = requireArray(test.results, 'test results');
      for (const [retryIndex, result] of results.entries()) {
        if (retryIndex >= maxRetries) fail('test retry count exceeds the allowed bound');
        requireObject(result, 'test result');
        if (!Object.hasOwn(outcomes, result.status)) fail('test result status is not allowlisted');
        const outcome = outcomes[result.status];
        const durationMs = boundedDuration(result.duration);
        projectSummary.attempts[outcome] += 1;
        summary.totalAttempts[outcome] += 1;

        if (failureOutcomes.has(outcome)) {
          failureResults.failures.push({
            suite: suiteDefinition.label,
            sourceLine: spec.line,
            testOrdinal,
            project,
            retry: retryIndex + 1,
            outcome,
            durationMs,
          });
        }
      }
    }
  }

  const nestedSuites = suite.suites === undefined ? [] : requireArray(suite.suites, 'nested suites');
  for (const nestedSuite of nestedSuites) addSuiteReport(nestedSuite, summary, failureResults, ordinalsBySource);
}

export function sanitizePlaywrightReport(report) {
  requireObject(report, 'report');
  const runnerErrors = requireArray(report.errors, 'report errors');
  if (runnerErrors.length > maxRunnerErrors) fail('runner error count exceeds the allowed bound');
  const summary = {
    schemaVersion: 1,
    runStatus: 'no_attempts',
    runnerErrorCount: runnerErrors.length,
    totalAttempts: emptyCounts(),
    suites: [],
  };
  const failureResults = { schemaVersion: 1, failures: [] };
  const reportSuites = requireArray(report.suites, 'report suites');
  const ordinalsBySource = new Map();

  for (const suite of reportSuites) addSuiteReport(suite, summary, failureResults, ordinalsBySource);

  const total = Object.values(summary.totalAttempts).reduce((sum, count) => sum + count, 0);
  if (runnerErrors.length > 0) summary.runStatus = 'runner_error';
  else if (summary.totalAttempts.failed || summary.totalAttempts.timed_out || summary.totalAttempts.interrupted) summary.runStatus = 'failed';
  else if (total > 0) summary.runStatus = 'passed';

  summary.suites.sort((left, right) => left.suite.localeCompare(right.suite));
  for (const suite of summary.suites) suite.projects.sort((left, right) => left.project.localeCompare(right.project));
  return { summary, failureResults };
}

async function requireSafeOutputDirectory(directory) {
  try {
    const metadata = await lstat(directory);
    if (!metadata.isDirectory() || metadata.isSymbolicLink()) fail('output directory must be a real directory');
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
    await mkdir(directory, { recursive: true, mode: 0o700 });
    return requireSafeOutputDirectory(directory);
  }
}

async function removeSafePriorArtifact(candidate) {
  try {
    const metadata = await lstat(candidate);
    if (!metadata.isFile() || metadata.isSymbolicLink() || metadata.nlink !== 1) {
      fail('existing upload candidate must be an unlinked regular file');
    }
    await rm(candidate);
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
}

async function clearUploadCandidates(paths) {
  if (
    path.dirname(paths.summary) !== paths.outputDirectory
    || path.dirname(paths.failureResults) !== paths.outputDirectory
    || path.basename(paths.summary) !== 'summary.json'
    || path.basename(paths.failureResults) !== 'failure-results.json'
  ) fail('output candidates must use the exact allowed paths');
  await requireSafeOutputDirectory(paths.outputDirectory);
  await Promise.all([removeSafePriorArtifact(paths.summary), removeSafePriorArtifact(paths.failureResults)]);
}

async function writeJsonAtomically(destination, value) {
  const temporary = `${destination}.${randomUUID()}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { encoding: 'utf8', mode: 0o600, flag: 'wx' });
  await rename(temporary, destination);
}

function hasExactKeys(value, keys) {
  return Object.keys(value).sort().join(',') === [...keys].sort().join(',');
}

function validCounts(value) {
  return requireObject(value, 'attempt counts') && hasExactKeys(value, Object.values(outcomes))
    && Object.values(value).every((count) => Number.isInteger(count) && count >= 0 && count <= maxTestOrdinal * maxRetries);
}

function validateSanitizedDocuments(summary, failureResults) {
  requireObject(summary, 'sanitized summary');
  requireObject(failureResults, 'sanitized failure results');
  if (
    !hasExactKeys(summary, ['schemaVersion', 'runStatus', 'runnerErrorCount', 'totalAttempts', 'suites'])
    || summary.schemaVersion !== 1
    || !['passed', 'failed', 'runner_error', 'no_attempts'].includes(summary.runStatus)
    || !Number.isInteger(summary.runnerErrorCount)
    || summary.runnerErrorCount < 0
    || summary.runnerErrorCount > maxRunnerErrors
    || !validCounts(summary.totalAttempts)
    || !Array.isArray(summary.suites)
  ) fail('sanitized summary does not match the bounded schema');

  const labels = new Set();
  for (const suite of summary.suites) {
    if (!requireObject(suite, 'sanitized suite') || !hasExactKeys(suite, ['suite', 'projects']) || !Object.values(suites).some(({ label }) => label === suite.suite) || !Array.isArray(suite.projects) || labels.has(suite.suite)) {
      fail('sanitized suite does not match the bounded schema');
    }
    labels.add(suite.suite);
    const projectNames = new Set();
    for (const project of suite.projects) {
      if (!requireObject(project, 'sanitized project') || !hasExactKeys(project, ['project', 'attempts']) || !Object.values(projects).includes(project.project) || projectNames.has(project.project) || !validCounts(project.attempts)) {
        fail('sanitized project does not match the bounded schema');
      }
      projectNames.add(project.project);
    }
  }

  if (!hasExactKeys(failureResults, ['schemaVersion', 'failures']) || failureResults.schemaVersion !== 1 || !Array.isArray(failureResults.failures)) {
    fail('sanitized failure results do not match the bounded schema');
  }
  for (const failure of failureResults.failures) {
    if (
      !requireObject(failure, 'sanitized failure')
      || !hasExactKeys(failure, ['suite', 'sourceLine', 'testOrdinal', 'project', 'retry', 'outcome', 'durationMs'])
      || !Object.values(suites).some(({ label }) => label === failure.suite)
      || !Number.isInteger(failure.sourceLine) || failure.sourceLine < 1 || failure.sourceLine > 100_000
      || !Number.isInteger(failure.testOrdinal) || failure.testOrdinal < 1 || failure.testOrdinal > maxTestOrdinal
      || !Object.values(projects).includes(failure.project)
      || !Number.isInteger(failure.retry) || failure.retry < 1 || failure.retry > maxRetries
      || !failureOutcomes.has(failure.outcome)
      || !Number.isInteger(failure.durationMs) || failure.durationMs < 0 || failure.durationMs > maxDurationMs
    ) fail('sanitized failure does not match the bounded schema');
  }
}

export async function validateStagedArtifacts({ paths = artifactPaths } = {}) {
  await requireSafeOutputDirectory(paths.outputDirectory);
  const entries = await readdir(paths.outputDirectory);
  const expected = ['failure-results.json', 'summary.json'];
  if (entries.length !== expected.length || entries.sort().join(',') !== expected.join(',')) fail('staging directory contains an unexpected file');

  for (const candidate of [paths.summary, paths.failureResults]) {
    const metadata = await lstat(candidate);
    if (!metadata.isFile() || metadata.isSymbolicLink() || metadata.nlink !== 1 || metadata.size > maxArtifactBytes) {
      fail('staged upload candidate is not a bounded regular file');
    }
  }

  let summary;
  let failureResults;
  try {
    [summary, failureResults] = await Promise.all([paths.summary, paths.failureResults].map(async (candidate) => JSON.parse(await readFile(candidate, 'utf8'))));
  } catch {
    fail('staged upload candidate is not valid JSON');
  }
  validateSanitizedDocuments(summary, failureResults);
  return { summary, failureResults };
}

export async function sanitizePlaywrightArtifacts({ paths = artifactPaths } = {}) {
  await clearUploadCandidates(paths);

  let rawReport;
  try {
    const rawMetadata = await lstat(paths.rawReport);
    if (!rawMetadata.isFile() || rawMetadata.isSymbolicLink() || rawMetadata.nlink !== 1 || rawMetadata.size > maxRawReportBytes) {
      fail('raw report is not a bounded regular file');
    }
    rawReport = await readFile(paths.rawReport, 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') return { created: false, reason: 'raw-report-not-found' };
    throw error;
  }

  let report;
  try {
    report = JSON.parse(rawReport);
  } catch {
    fail('raw report is not valid JSON');
  }
  const sanitized = sanitizePlaywrightReport(report);

  await mkdir(paths.outputDirectory, { recursive: true });
  await writeJsonAtomically(paths.summary, sanitized.summary);
  await writeJsonAtomically(paths.failureResults, sanitized.failureResults);
  await validateStagedArtifacts({ paths });
  return { created: true, ...sanitized };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  sanitizePlaywrightArtifacts()
    .then((result) => {
      process.stdout.write(`${result.created ? 'Sanitized QA artifacts created.' : 'No raw QA report found; no artifacts created.'}\n`);
    })
    .catch((error) => {
      process.stderr.write(`${error.message}\n`);
      process.exitCode = 1;
    });
}
