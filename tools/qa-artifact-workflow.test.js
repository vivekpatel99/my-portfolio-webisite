// @vitest-environment node
import { readFile } from 'node:fs/promises';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';

const workflow = parse(await readFile(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8'));
const stepsFor = (job) => workflow.jobs[job].steps;
const namedStep = (job, name) => stepsFor(job).find((step) => step.name === name);

describe('parallel CI and sanitized QA artifacts', () => {
  it('runs full CI on PRs and integration/release pushes without duplicate feature push runs', () => {
    expect(workflow.on.push.branches).toEqual(['main', 'develop']);
    expect(workflow.on.pull_request.branches).toEqual(['main', 'develop']);
    // PR runs are superseded by newer pushes; integration/release commits each keep a full result.
    expect(workflow.concurrency.group)
      .toBe("${{ github.workflow }}-${{ github.event_name == 'pull_request' && github.ref || github.sha }}");
    expect(workflow.concurrency['cancel-in-progress']).toBe(true);
  });

  it('requires every independent suite even when a dependency fails or is skipped', () => {
    const gate = workflow.jobs['test-and-build'];
    expect([...gate.needs].sort()).toEqual([
      'apache-service-qa', 'contact-qa', 'motion-qa', 'passive-qa', 'production-build', 'telemetry-qa', 'unit-tests',
    ]);
    expect(gate.if).toBe('${{ always() }}');
    const check = namedStep('test-and-build', 'Require every CI job to succeed');
    expect(check.env.CI_JOB_RESULTS).toBe('${{ toJSON(needs) }}');
    expect(check.run).toBe('node tools/check-ci-results.js');
    for (const job of ['unit-tests', 'contact-qa', 'motion-qa', 'telemetry-qa']) {
      expect(workflow.jobs[job].needs).toBeUndefined();
    }
  });

  it('keeps every browser container aligned with the locked Playwright version', async () => {
    const lockfile = JSON.parse(await readFile(new URL('../package-lock.json', import.meta.url), 'utf8'));
    const browserVersion = lockfile.packages['node_modules/@playwright/test'].version;
    for (const job of ['passive-qa', 'contact-qa', 'motion-qa', 'telemetry-qa']) {
      expect(workflow.jobs[job].container).toBe(`mcr.microsoft.com/playwright:v${browserVersion}-noble`);
      // The pinned container already provides matching browsers.
      expect(stepsFor(job).some((step) => step.run?.includes('playwright install'))).toBe(false);
    }
  });

  it('validates the baked Convex URL through one shared script before building or telemetry QA', () => {
    for (const job of ['production-build', 'telemetry-qa']) {
      expect(namedStep(job, 'Validate production-like Convex URL').run).toBe('bash tools/validate-convex-url.sh');
    }
  });

  it('never persists checkout credentials', () => {
    for (const job of Object.keys(workflow.jobs)) {
      for (const step of stepsFor(job).filter((candidate) => candidate.uses?.startsWith('actions/checkout@'))) {
        expect(step.with?.['persist-credentials'], job).toBe(false);
      }
    }
  });

  it('splits contact lifecycle QA into three independent shards', () => {
    const contact = workflow.jobs['contact-qa'];
    expect(contact.strategy['fail-fast']).toBe(false);
    expect(contact.strategy.matrix.shard).toEqual([1, 2, 3]);
    expect(namedStep('contact-qa', 'Run mocked contact lifecycle QA').run)
      .toBe('npm run qa:contact-lifecycle -- --shard=${{ matrix.shard }}/3');
  });

  it('shares one complete production build with four independent passive shards', () => {
    const passive = workflow.jobs['passive-qa'];
    expect(passive.needs).toBe('production-build');
    expect(passive.strategy['fail-fast']).toBe(false);
    expect(passive.strategy.matrix.shard).toEqual([1, 2, 3, 4]);
    const download = stepsFor('passive-qa').find((step) => step.uses === 'actions/download-artifact@v4');
    const upload = stepsFor('production-build').find((step) => step.uses === 'actions/upload-artifact@v4');
    expect(download.with.name).toBe('production-dist');
    expect(upload.with.name).toBe(download.with.name);
    expect(namedStep('production-build', 'Archive validated production bundle').run)
      .toContain('tar -czf "$RUNNER_TEMP/production-dist.tar.gz" dist');
    expect(namedStep('passive-qa', 'Restore production bundle').run).toContain('tar -xzf');
    expect(namedStep('passive-qa', 'Run passive Playwright QA against preview').run)
      .toContain('npm run qa:playwright:ci -- --shard=${{ matrix.shard }}/4');
  });

  it('checks Apache routing against the same complete production bundle and gates delivery', () => {
    const apache = workflow.jobs['apache-service-qa'];
    expect(apache.needs).toBe('production-build');
    const download = stepsFor('apache-service-qa').find((step) => step.uses === 'actions/download-artifact@v4');
    expect(download.with.name).toBe('production-dist');
    expect(namedStep('apache-service-qa', 'Restore production bundle').run).toContain('tar -xzf');
    expect(namedStep('apache-service-qa', 'Check service routes under Apache HTTPS').run).toBe('npm run qa:apache-services');
    expect(workflow.jobs['test-and-build'].needs).toContain('apache-service-qa');
  });

  it('runs isolated telemetry after Convex URL validation with local-only safe artifacts', () => {
    const steps = stepsFor('telemetry-qa');
    expect(steps.findIndex((step) => step.name === 'Run fake telemetry boundary QA'))
      .toBeGreaterThan(steps.findIndex((step) => step.name === 'Validate production-like Convex URL'));
    expect(namedStep('telemetry-qa', 'Run fake telemetry boundary QA').run).toBe('npm run qa:telemetry-boundary');
    for (const job of ['passive-qa', 'contact-qa', 'motion-qa', 'telemetry-qa']) {
      expect(workflow.jobs[job].env.QA_LOCAL_ONLY).toBe('1');
      expect(workflow.jobs[job].env.QA_ARTIFACT_SAFE_MODE).toBe('1');
    }
  });

  it('runs both complete motion browser groups on separate runners', () => {
    const motion = workflow.jobs['motion-qa'];
    expect(motion.strategy['fail-fast']).toBe(false);
    expect(motion.strategy.matrix.browser).toEqual(['chromium', 'webkit']);
    const run = namedStep('motion-qa', 'Run reduced-motion regression QA').run;
    expect(run).toContain('--project=motion-${{ matrix.browser }}-desktop');
    expect(run).toContain('--project=motion-${{ matrix.browser }}-mobile');
    expect(run).toContain('xvfb-run --auto-servernum npm run qa:motion -- --headed');
  });

  it('uploads reconstructed allowlisted JSON under unique shard names for seven days', () => {
    const sanitize = namedStep('passive-qa', 'Reconstruct sanitized passive QA artifacts');
    expect(sanitize.id).toBe('sanitize-qa-artifacts');
    expect(sanitize.if).toBe('always()');
    const upload = namedStep('passive-qa', 'Retain sanitized passive QA artifacts');
    expect(upload.if).toBe("always() && steps.sanitize-qa-artifacts.outcome == 'success'");
    expect(upload.with.name).toBe('passive-qa-sanitized-${{ matrix.shard }}');
    expect(upload.with.path.trim().split('\n')).toEqual([
      'qa-artifacts/summary.json', 'qa-artifacts/failure-results.json',
    ]);
    expect(upload.with['if-no-files-found']).toBe('ignore');
    expect(upload.with['retention-days']).toBe(7);
  });
});
