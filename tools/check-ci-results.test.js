// @vitest-environment node
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const script = fileURLToPath(new URL('./check-ci-results.js', import.meta.url));
const successfulJobs = {
  'unit-tests': { result: 'success' },
  'production-build': { result: 'success' },
  'passive-qa': { result: 'success' },
  'contact-qa': { result: 'success' },
  'motion-qa': { result: 'success' },
  'telemetry-qa': { result: 'success' },
};
const runGate = (results) => spawnSync(process.execPath, [script], {
  env: { ...process.env, CI_JOB_RESULTS: results },
  encoding: 'utf8',
});

describe('required CI result gate', () => {
  it('passes only when every required suite and the production build succeeded', () => {
    const gate = runGate(JSON.stringify(successfulJobs));
    expect(gate.status).toBe(0);
    expect(gate.stdout).toContain('All required CI jobs succeeded');
  });

  it.each(Object.keys(successfulJobs))('rejects a missing %s job', (job) => {
    const results = { ...successfulJobs };
    delete results[job];
    const gate = runGate(JSON.stringify(results));
    expect(gate.status).toBe(1);
    expect(gate.stderr).toContain(job);
  });

  it.each(['failure', 'cancelled', 'skipped', 'in_progress'])('rejects %s in any required job', (result) => {
    for (const job of Object.keys(successfulJobs)) {
      const gate = runGate(JSON.stringify({ ...successfulJobs, [job]: { result } }));
      expect(gate.status).toBe(1);
      expect(gate.stderr).toContain(job);
    }
  });

  it.each(['', 'not-json', 'null', '[]', '"success"', '{}'])('fails closed for malformed or incomplete results (%s)', (results) => {
    expect(runGate(results).status).toBe(1);
  });

  it('also rejects failure in an additional dependency', () => {
    const gate = runGate(JSON.stringify({ ...successfulJobs, 'extra-suite': { result: 'failure' } }));
    expect(gate.status).toBe(1);
    expect(gate.stderr).toContain('extra-suite');
  });
});
