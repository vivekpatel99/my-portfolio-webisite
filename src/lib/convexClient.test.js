import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConvexReactClient } from 'convex/react';
import {
  resolveConvexClientConfig,
  resolveConvexClientOptions,
} from './convexClient';

vi.mock('convex/react', () => ({
  ConvexReactClient: vi.fn(),
}));

afterEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  vi.unstubAllEnvs();
});

describe('resolveConvexClientOptions', () => {
  it('disables Convex SDK logging in production', () => {
    expect(resolveConvexClientOptions({ isProduction: true })).toEqual({
      logger: false,
    });
  });

  it('keeps the Convex SDK development logger enabled by default', () => {
    expect(resolveConvexClientOptions({ isProduction: false })).toEqual({});
  });

  it('passes logger false to the SDK constructor in production', async () => {
    vi.stubEnv('PROD', true);
    vi.stubEnv(
      'VITE_CONVEX_URL',
      'https://zealous-bear-17.convex.cloud',
    );

    await import('./convexClient');

    expect(ConvexReactClient).toHaveBeenCalledWith(
      'https://zealous-bear-17.convex.cloud',
      { logger: false },
    );
  });

  it('keeps SDK constructor diagnostics at their development defaults', async () => {
    vi.stubEnv('PROD', false);
    vi.stubEnv('VITE_CONVEX_URL', 'http://127.0.0.1:3210');

    await import('./convexClient');

    expect(ConvexReactClient).toHaveBeenCalledWith(
      'http://127.0.0.1:3210',
      {},
    );
  });
});

describe('resolveConvexClientConfig', () => {
  it('accepts a real Convex deployment URL', () => {
    expect(
      resolveConvexClientConfig('https://zealous-bear-17.convex.cloud', {
        isProduction: true,
      }),
    ).toEqual({
      issue: null,
      shouldFailFast: false,
      url: 'https://zealous-bear-17.convex.cloud',
    });
  });

  it('accepts a regional Convex deployment URL', () => {
    expect(
      resolveConvexClientConfig('https://zealous-bear-17.eu-west-1.convex.cloud', {
        isProduction: true,
      }),
    ).toEqual({
      issue: null,
      shouldFailFast: false,
      url: 'https://zealous-bear-17.eu-west-1.convex.cloud',
    });
  });

  it('allows local development to boot without a Convex URL', () => {
    expect(resolveConvexClientConfig('', { isProduction: false })).toEqual({
      issue: 'Missing VITE_CONVEX_URL.',
      shouldFailFast: false,
      url: null,
    });
  });

  it('keeps production bootable without a Convex URL', () => {
    expect(resolveConvexClientConfig('', { isProduction: true })).toEqual({
      issue: 'Missing VITE_CONVEX_URL.',
      shouldFailFast: false,
      url: null,
    });
  });

  it('rejects placeholder Convex URLs in production', () => {
    for (const url of [
      'https://your-deployment.convex.cloud',
      'https://example.convex.cloud',
    ]) {
      expect(resolveConvexClientConfig(url, { isProduction: true })).toEqual({
        issue: 'VITE_CONVEX_URL still contains a placeholder value.',
        shouldFailFast: false,
        url: null,
      });
    }
  });

  it('rejects non-HTTPS Convex URLs in production', () => {
    expect(
      resolveConvexClientConfig('http://127.0.0.1:3210', {
        isProduction: true,
      }),
    ).toEqual({
      issue: 'Production VITE_CONVEX_URL must use https://.',
      shouldFailFast: false,
      url: null,
    });
  });

  it('rejects arbitrary HTTPS URLs in production', () => {
    expect(
      resolveConvexClientConfig('https://api.sync.t3.chat', {
        isProduction: true,
      }),
    ).toEqual({
      issue: 'Production VITE_CONVEX_URL must point to a convex.cloud deployment.',
      shouldFailFast: false,
      url: null,
    });
  });

  it('rejects Convex HTTP action URLs in production', () => {
    expect(
      resolveConvexClientConfig('https://zealous-bear-17.convex.site', {
        isProduction: true,
      }),
    ).toEqual({
      issue: 'Production VITE_CONVEX_URL must point to a convex.cloud deployment.',
      shouldFailFast: false,
      url: null,
    });
  });

  it('rejects path, query, and hash forms in production', () => {
    for (const url of [
      'https://zealous-bear-17.convex.cloud/api',
      'https://zealous-bear-17.convex.cloud?x=1',
      'https://zealous-bear-17.convex.cloud#deploy',
    ]) {
      expect(resolveConvexClientConfig(url, { isProduction: true })).toEqual({
        issue: 'Production VITE_CONVEX_URL must not include a path, query, or hash.',
        shouldFailFast: false,
        url: null,
      });
    }
  });

  it('rejects explicit ports in production', () => {
    for (const url of [
      'https://zealous-bear-17.convex.cloud:443',
      'https://zealous-bear-17.convex.cloud:444',
    ]) {
      expect(resolveConvexClientConfig(url, { isProduction: true })).toEqual({
        issue: 'Production VITE_CONVEX_URL must not include an explicit port.',
        shouldFailFast: false,
        url: null,
      });
    }
  });

  it('rejects credentials in production', () => {
    for (const url of [
      'https://user@zealous-bear-17.convex.cloud',
      'https://user:pass@zealous-bear-17.convex.cloud',
    ]) {
      expect(resolveConvexClientConfig(url, { isProduction: true })).toEqual({
        issue: 'Production VITE_CONVEX_URL must not include credentials.',
        shouldFailFast: false,
        url: null,
      });
    }
  });
});
