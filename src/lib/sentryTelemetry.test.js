// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SENSITIVE_TELEMETRY_SELECTOR } from './sensitiveTelemetry';

vi.mock('@/lib/convexClient', () => ({ convexDeploymentOrigin: 'https://test.convex.cloud' }));

let release;
let sdk;
let close;
let load;

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('VITE_SENTRY_DSN', 'test-dsn');
  const gate = new Promise((resolve) => { release = resolve; });
  close = vi.fn();
  sdk = {
    init: vi.fn(),
    browserTracingIntegration: vi.fn(() => 'tracing'),
    replayIntegration: vi.fn(() => 'replay'),
    getCurrentHub: () => ({ getClient: () => ({ close }) }),
    captureException: vi.fn(),
  };
  load = vi.fn(async () => { await gate; return sdk; });
  vi.doMock('@sentry/react', load);
});

afterEach(() => {
  release();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  vi.doUnmock('@sentry/react');
});

describe('deferred Sentry SDK', () => {
  it('does not load the SDK before consent or without a configured DSN', async () => {
    vi.stubEnv('VITE_SENTRY_DSN', '');
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const telemetry = await import('./sentryTelemetry');
    telemetry.closeSentryTelemetry();
    expect(load).not.toHaveBeenCalled();
    await telemetry.initializeSentryTelemetry();
    expect(load).not.toHaveBeenCalled();
  });

  it('deduplicates loading and preserves privacy and sampling options', async () => {
    const telemetry = await import('./sentryTelemetry');
    expect(load).not.toHaveBeenCalled();
    const first = telemetry.initializeSentryTelemetry();
    const second = telemetry.initializeSentryTelemetry();
    expect(first).toBe(second);
    release();
    await first;
    expect(sdk.init).toHaveBeenCalledTimes(1);
    expect(sdk.init).toHaveBeenCalledWith(expect.objectContaining({
      sendDefaultPii: false,
      tracesSampleRate: 0.2,
      replaysSessionSampleRate: 0.05,
      replaysOnErrorSampleRate: 1,
      tracePropagationTargets: ['localhost', 'https://test.convex.cloud'],
    }));
    expect(sdk.replayIntegration).toHaveBeenCalledWith({
      maskAllText: true,
      maskAllInputs: true,
      blockAllMedia: true,
      block: [SENSITIVE_TELEMETRY_SELECTOR],
      ignore: [SENSITIVE_TELEMETRY_SELECTOR],
    });
    const error = new Error('test');
    telemetry.captureException(error);
    expect(sdk.captureException).toHaveBeenCalledWith(error, undefined);
    telemetry.closeSentryTelemetry();
    expect(close).toHaveBeenCalledWith(2000);
    telemetry.captureException(error);
    expect(sdk.captureException).toHaveBeenCalledTimes(1);
  });

  it('drops UI breadcrumbs and exception reports originating in a marked region', async () => {
    const telemetry = await import('./sentryTelemetry');
    const markedRegion = {
      matches: vi.fn((selector) => selector === SENSITIVE_TELEMETRY_SELECTOR),
      closest: vi.fn((selector) => selector === SENSITIVE_TELEMETRY_SELECTOR ? markedRegion : null),
    };
    const target = { closest: vi.fn(() => markedRegion) };

    const pending = telemetry.initializeSentryTelemetry();
    release();
    await pending;

    const options = sdk.init.mock.calls[0][0];
    expect(options.beforeBreadcrumb({ category: 'ui.click' }, { event: { target } })).toBeNull();
    expect(options.beforeBreadcrumb({ category: 'ui.click' }, { event: { target: {} } })).toEqual({ category: 'ui.click' });
    expect(options.beforeBreadcrumb({ category: 'fetch' }, { event: { target } })).toEqual({ category: 'fetch' });
    expect(options.beforeSend({ message: 'synthetic form error' }, { telemetrySource: target })).toBeNull();
    expect(options.beforeSend({ message: 'synthetic background error' }, { source: 'background-task' }))
      .toEqual({ message: 'synthetic background error' });

    telemetry.captureException(new Error('synthetic contact error'), { telemetrySource: target });
    expect(sdk.captureException).not.toHaveBeenCalled();

    const unrelatedError = new Error('synthetic unrelated error');
    telemetry.captureException(unrelatedError, { source: 'background-task' });
    expect(sdk.captureException).toHaveBeenCalledWith(unrelatedError, { source: 'background-task' });
  });

  it('does not initialize if consent is revoked during the download, and can retry on consent', async () => {
    const telemetry = await import('./sentryTelemetry');
    const pending = telemetry.initializeSentryTelemetry();
    telemetry.closeSentryTelemetry();
    release();
    await pending;
    expect(sdk.init).not.toHaveBeenCalled();
    await telemetry.initializeSentryTelemetry();
    expect(sdk.init).toHaveBeenCalledTimes(1);
  });

  it('handles a failed SDK download without an unhandled rejection', async () => {
    vi.doMock('@sentry/react', () => { throw new Error('offline'); });
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const telemetry = await import('./sentryTelemetry');
    await expect(telemetry.initializeSentryTelemetry()).resolves.toBeUndefined();
    expect(console.warn).toHaveBeenCalledWith('Sentry telemetry could not be initialized', expect.any(Error));
  });
});
