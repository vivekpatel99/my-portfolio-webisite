import { describe, expect, it } from 'vitest';
import {
  assertSafeArtifactConfiguration,
  qaCaptureOptions,
} from '../tests/qa/qa.config.js';

describe('sanitized CI Playwright configuration', () => {
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
});
