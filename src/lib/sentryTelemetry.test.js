// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  SENSITIVE_TELEMETRY_SELECTOR,
  SENSITIVE_TELEMETRY_TAG,
  SENSITIVE_TELEMETRY_TAG_VALUE,
} from './sensitiveTelemetry';

vi.mock('@/lib/convexClient', () => ({ convexDeploymentOrigin: 'https://test.convex.cloud' }));

let release;
let sdk;
let close;
let load;
let scope;
let replayStop;
let replayStart;
let clientOptions;
let send;

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('VITE_SENTRY_DSN', 'test-dsn');
  const gate = new Promise((resolve) => { release = resolve; });
  close = vi.fn();
  replayStop = vi.fn(() => Promise.resolve());
  replayStart = vi.fn();
  clientOptions = { enabled: true, tracesSampleRate: 0.2 };
  send = vi.fn(() => Promise.resolve({ statusCode: 200 }));
  scope = { setTag: vi.fn() };
  const client = { close, getOptions: () => clientOptions, getDsn: () => 'synthetic-dsn' };
  sdk = {
    init: vi.fn(),
    browserTracingIntegration: vi.fn(() => 'tracing'),
    Replay: class {
      constructor(options) {
        sdk.replayOptions = options;
        this._replay = { eventBuffer: null, stop: () => replayStop() };
      }
      _initialize() { replayStart(); }
      stop() { return replayStop(); }
    },
    makeFetchTransport: () => ({ send, flush: () => Promise.resolve(true) }),
    getCurrentHub: () => ({ getClient: () => client }),
    withScope: vi.fn((callback) => callback(scope)),
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
    expect(sdk.replayOptions).toEqual({
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
    expect(replayStop).toHaveBeenCalledTimes(1);
    expect(clientOptions.enabled).toBe(false);
    expect(close).toHaveBeenCalledWith(2000);
    telemetry.captureException(error);
    expect(sdk.captureException).toHaveBeenCalledTimes(1);
  });

  it('drops UI breadcrumbs and tagged error events originating in a marked region', async () => {
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
    expect(options.beforeSend({
      message: 'synthetic form error',
      tags: { [SENSITIVE_TELEMETRY_TAG]: SENSITIVE_TELEMETRY_TAG_VALUE },
    })).toBeNull();
    expect(options.beforeSend({ message: 'synthetic background error', tags: {} }))
      .toEqual({ message: 'synthetic background error', tags: {} });

    const sensitiveError = new Error('synthetic contact error');
    telemetry.captureException(sensitiveError, { telemetrySource: target });
    expect(sdk.withScope).toHaveBeenCalledTimes(1);
    expect(scope.setTag).toHaveBeenCalledWith(SENSITIVE_TELEMETRY_TAG, SENSITIVE_TELEMETRY_TAG_VALUE);
    expect(sdk.captureException).toHaveBeenCalledWith(sensitiveError, undefined);

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

  it('keeps transport closed through pending teardown and reuses the integration on reaccept', async () => {
    const telemetry = await import('./sentryTelemetry');
    const pending = telemetry.initializeSentryTelemetry();
    release();
    await pending;
    const options = sdk.init.mock.calls[0][0];
    const transport = options.transport({});
    expect(sdk.getCurrentHub().getClient().getDsn()).toBe('synthetic-dsn');
    const envelope = ['synthetic'];
    await transport.send(envelope);
    expect(send).toHaveBeenCalledTimes(1);

    let finishStop;
    replayStop.mockImplementationOnce(() => new Promise((resolve) => { finishStop = resolve; }));
    const stopping = telemetry.closeSentryTelemetry();
    expect(sdk.getCurrentHub().getClient().getDsn()).toBeUndefined();
    const accepting = telemetry.initializeSentryTelemetry();
    await transport.send(envelope);
    expect(send).toHaveBeenCalledTimes(1);
    expect(replayStart).toHaveBeenCalledTimes(1);
    finishStop();
    await stopping;
    await accepting;
    expect(clientOptions.enabled).toBe(true);
    expect(sdk.getCurrentHub().getClient().getDsn()).toBe('synthetic-dsn');
    expect(sdk.init).toHaveBeenCalledTimes(1);
    expect(replayStart).toHaveBeenCalledTimes(2);
    await transport.send(envelope);
    expect(send).toHaveBeenCalledTimes(2);
  });
});

it('rejects tracing from an earlier consent period and stops active transactions', async () => {
  const telemetry = await import('./sentryTelemetry');
  const pending = telemetry.initializeSentryTelemetry();
  release();
  await pending;
  const options = sdk.init.mock.calls[0][0];
  const hooks = {};
  options.integrations[0].setup({ on: (name, callback) => { hooks[name] = callback; } });
  const transaction = () => {
    const trace = { sampled: true, tags: {} };
    trace.setTag = (key, value) => { trace.tags[key] = value; };
    trace.finish = vi.fn(() => hooks.finishTransaction(trace));
    hooks.startTransaction(trace);
    return trace;
  };
  const old = transaction();
  const queued = { tags: { ...old.tags }, transaction: 'old' };
  expect(options.beforeSendTransaction(queued)).toEqual({ tags: {}, transaction: 'old' });
  await telemetry.closeSentryTelemetry();
  expect(old.sampled).toBe(false);
  expect(old.finish).toHaveBeenCalledOnce();
  expect(clientOptions).not.toHaveProperty('tracesSampleRate');
  expect(options.beforeBreadcrumb({ category: 'navigation' }, {})).toBeNull();
  const withdrawn = transaction();
  expect(withdrawn.sampled).toBe(false);
  await telemetry.initializeSentryTelemetry();
  expect(clientOptions.tracesSampleRate).toBe(0.2);
  expect(options.beforeSendTransaction(queued)).toBeNull();
  expect(options.beforeSendTransaction({ tags: withdrawn.tags })).toBeNull();
  const fresh = transaction();
  expect(options.beforeSendTransaction({ tags: fresh.tags, transaction: 'fresh' }))
    .toEqual({ tags: {}, transaction: 'fresh' });
});
