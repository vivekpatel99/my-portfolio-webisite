import { describe, expect, it } from 'vitest';
import { resolveConvexClientConfig } from './convexClient';

describe('resolveConvexClientConfig', () => {
  it('accepts a real Convex deployment URL', () => {
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

  it('fails fast in production without a Convex URL', () => {
    expect(resolveConvexClientConfig('', { isProduction: true })).toEqual({
      issue: 'Missing VITE_CONVEX_URL.',
      shouldFailFast: true,
      url: null,
    });
  });

  it('rejects placeholder Convex URLs in production', () => {
    expect(
      resolveConvexClientConfig('https://your-deployment.convex.cloud', {
        isProduction: true,
      }),
    ).toEqual({
      issue: 'VITE_CONVEX_URL still contains a placeholder value.',
      shouldFailFast: true,
      url: null,
    });
  });

  it('rejects non-HTTPS Convex URLs in production', () => {
    expect(
      resolveConvexClientConfig('http://127.0.0.1:3210', {
        isProduction: true,
      }),
    ).toEqual({
      issue: 'Production VITE_CONVEX_URL must use https://.',
      shouldFailFast: true,
      url: null,
    });
  });
});
