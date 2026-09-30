import { describe, expect, it } from 'vitest';
import {
  assertSafeArtifactConfiguration,
  qaCaptureOptions,
  qaNetworkOptions,
  qaPassiveProjects,
  resolveQaArtifactDir,
} from '../tests/qa/qa.config.js';

const TESTIMONIALS_SPEC = 'qa-testimonials.spec.js';
const HERO_MOTION_SPEC = 'qa-hero-motion.spec.js';
const targetURLs = { previewURL: 'http://127.0.0.1:3000', prodURL: 'https://www.example.test' };
const specsByProject = (options) => Object.fromEntries(
  qaPassiveProjects({ ...targetURLs, ...options }).map(({ name, testMatch }) => [name, testMatch]),
);

describe('sanitized CI Playwright configuration', () => {
  it('isolates fake telemetry reports from the passive QA report', () => {
    const repoRoot = '/repo';

    expect(resolveQaArtifactDir({ repoRoot, fakeSentry: false })).toBe('/repo/playwright-output');
    expect(resolveQaArtifactDir({ repoRoot, fakeSentry: true })).toBe('/repo/playwright-output/telemetry-boundary');
  });

  it('disables raw browser capture classes in safe artifact mode', () => {
    expect(qaCaptureOptions({ safeArtifacts: true })).toEqual({
      screenshot: 'off',
      trace: 'off',
      video: 'off',
      storageState: undefined,
    });
  });

  it('preserves the existing local diagnostic capture defaults outside safe artifact mode', () => {
    expect(qaCaptureOptions({ safeArtifacts: false })).toEqual({
      screenshot: 'only-on-failure',
      trace: 'retain-on-failure',
    });
  });

  it('requires loopback-only passive QA before safe artifact mode can run', () => {
    expect(() => assertSafeArtifactConfiguration({
      safeArtifacts: true,
      localOnly: false,
      includeLiveContactSubmit: false,
    })).toThrow('QA_ARTIFACT_SAFE_MODE requires');
    expect(() => assertSafeArtifactConfiguration({
      safeArtifacts: true,
      localOnly: true,
      includeLiveContactSubmit: true,
    })).toThrow('QA_ARTIFACT_SAFE_MODE requires');
  });

  it('blocks service workers only in local-only QA so request routing remains enforceable', () => {
    expect(qaNetworkOptions({ localOnly: true })).toEqual({ serviceWorkers: 'block' });
    expect(qaNetworkOptions({ localOnly: false })).toEqual({ serviceWorkers: 'allow' });
  });

  it('runs unreleased testimonial QA on default preview projects but never on public production', () => {
    const projects = specsByProject({ localOnly: false });

    expect(Object.keys(projects).sort()).toEqual(['preview-desktop', 'preview-mobile', 'prod-desktop', 'prod-mobile']);
    expect(projects['preview-desktop']).toContain(TESTIMONIALS_SPEC);
    expect(projects['preview-mobile']).toContain(TESTIMONIALS_SPEC);
    expect(projects['prod-desktop']).not.toContain(TESTIMONIALS_SPEC);
    expect(projects['prod-mobile']).not.toContain(TESTIMONIALS_SPEC);
  });

  it('runs testimonial QA on local-only preview projects', () => {
    const projects = specsByProject({ localOnly: true });

    expect(Object.keys(projects).sort()).toEqual(['preview-desktop', 'preview-mobile']);
    expect(projects['preview-desktop']).toContain(TESTIMONIALS_SPEC);
    expect(projects['preview-mobile']).toContain(TESTIMONIALS_SPEC);
  });

  it('keeps the other passive suites on production and focus/hero-motion regressions local-only', () => {
    const shared = [
      'qa-a11y.spec.js', 'qa-contact.spec.js', 'qa-edge.spec.js', 'qa-local-navigation.spec.js',
      'qa-responsive.spec.js', 'qa-routes.spec.js', 'qa-upgrade-interactions.spec.js', 'qa-visual.spec.js',
    ];
    const defaultProjects = specsByProject({ localOnly: false });
    const localProjects = specsByProject({ localOnly: true });

    expect([...defaultProjects['prod-desktop']].sort()).toEqual(shared);
    expect([...defaultProjects['preview-desktop']].sort()).toEqual([...shared, TESTIMONIALS_SPEC].sort());
    expect([...localProjects['preview-mobile']].sort())
      .toEqual([...shared, 'qa-focus.spec.js', HERO_MOTION_SPEC, TESTIMONIALS_SPEC].sort());
    for (const specs of Object.values(defaultProjects)) {
      expect(specs).not.toContain(HERO_MOTION_SPEC);
    }
    for (const specs of [...Object.values(defaultProjects), ...Object.values(localProjects)]) {
      expect(specs).not.toContain('qa-contact-live.spec.js');
    }
  });
});
