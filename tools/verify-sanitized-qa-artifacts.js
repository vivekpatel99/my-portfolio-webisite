import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { sanitizePlaywrightArtifacts } from './sanitize-playwright-artifacts.js';

const fixture = path.resolve('tests/qa/fixtures/playwright-failure-report.json');
const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'horizons-qa-artifacts-'));
const outputDirectory = path.join(temporaryDirectory, 'sanitized');
const paths = {
  rawReport: path.join(temporaryDirectory, 'raw-report.json'),
  outputDirectory,
  summary: path.join(outputDirectory, 'summary.json'),
  failureResults: path.join(outputDirectory, 'failure-results.json'),
};

try {
  await writeFile(paths.rawReport, await readFile(fixture, 'utf8'), 'utf8');
  await sanitizePlaywrightArtifacts({ paths });
  const serialized = `${await readFile(paths.summary, 'utf8')}${await readFile(paths.failureResults, 'utf8')}`;
  for (const forbidden of ['QA_SECRET_SENTINEL', 'Injected title', 'raw stack', 'localStorage', 'stdout']) {
    if (serialized.includes(forbidden)) throw new Error(`Sanitized artifacts leaked ${forbidden}`);
  }
  process.stdout.write('Synthetic failure artifact verification passed.\n');
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
