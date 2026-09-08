import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { resolveQaTargets } from './qa-local-only.js';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, '../..');
const artifactDir = path.join(repoRoot, 'playwright-output');

const previewURL = process.env.QA_PREVIEW_URL ?? 'http://127.0.0.1:3000';
const prodURL = process.env.QA_PROD_URL ?? 'https://www.vivekapatel.com';
const liveContactURL = process.env.QA_LIVE_CONTACT_BASE_URL ?? prodURL;
const includeLiveContactSubmit = process.env.QA_LIVE_CONTACT_SUBMIT === '1';
const localOnly = process.env.QA_LOCAL_ONLY === '1';
const safeArtifactMode = process.env.QA_ARTIFACT_SAFE_MODE === '1';

export function assertSafeArtifactConfiguration({ safeArtifacts, localOnly, includeLiveContactSubmit }) {
  if (safeArtifacts && (!localOnly || includeLiveContactSubmit)) {
    throw new Error('QA_ARTIFACT_SAFE_MODE requires QA_LOCAL_ONLY=1 with live contact submission disabled');
  }
}

export function qaNetworkOptions({ localOnly }) {
  // Request routes do not see service-worker-handled traffic, so local-only QA blocks registration.
  return { serviceWorkers: localOnly ? 'block' : 'allow' };
}

assertSafeArtifactConfiguration({ safeArtifacts: safeArtifactMode, localOnly, includeLiveContactSubmit });

const passiveSpecs = [
  'qa-a11y.spec.js',
  'qa-local-navigation.spec.js',
  'qa-contact.spec.js',
  'qa-edge.spec.js',
  'qa-responsive.spec.js',
  'qa-routes.spec.js',
  'qa-upgrade-interactions.spec.js',
  'qa-visual.spec.js',
];

const passiveProjects = resolveQaTargets({ localOnly, previewURL, prodURL }).flatMap(([environment, baseURL]) => [
  {
    name: `${environment}-desktop`,
    use: { ...devices['Desktop Chrome'], baseURL, ...qaNetworkOptions({ localOnly }) },
  },
  {
    name: `${environment}-mobile`,
    use: {
      ...devices['iPhone 14'], browserName: 'chromium', baseURL, ...qaNetworkOptions({ localOnly }),
    },
  },
]).map((project) => ({ ...project, testMatch: passiveSpecs }));

const liveProjects = includeLiveContactSubmit && !localOnly
  ? [
      {
        name: 'prod-live-contact-submit',
        testMatch: 'qa-contact-live.spec.js',
        use: { ...devices['Desktop Chrome'], baseURL: liveContactURL },
      },
    ]
  : [];

export function qaCaptureOptions({ safeArtifacts = safeArtifactMode } = {}) {
  if (safeArtifacts) {
    return {
      // Raw Playwright captures can contain form input, DOM, network, and storage data.
      // CI publishes reconstructed JSON only; it must not create those capture classes.
      screenshot: 'off',
      trace: 'off',
      video: 'off',
      storageState: undefined,
    };
  }

  return {
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  };
}

export default defineConfig({
  testDir,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: qaCaptureOptions(),
  outputDir: path.join(artifactDir, 'test-results'),
  reporter: [['list'], ['json', { outputFile: path.join(artifactDir, 'qa-results.json') }]],
  projects: [...passiveProjects, ...liveProjects],
});
