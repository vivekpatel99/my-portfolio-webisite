import {
  SENSITIVE_TELEMETRY_SELECTOR,
  SENSITIVE_TELEMETRY_TAG,
  SENSITIVE_TELEMETRY_TAG_VALUE,
  hasSensitiveTelemetrySource,
  shouldDropSensitiveTelemetry,
  shouldDropSensitiveUiBreadcrumb,
} from './sensitiveTelemetry';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN?.trim();

let initialized = false;
let requested = false;
let Sentry;
let loading;
let replay;
let client;
let closing;

export function initializeSentryTelemetry() {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  if (!SENTRY_DSN || SENTRY_DSN === 'your-sentry-dsn-here') {
    console.warn('Sentry DSN not configured, telemetry disabled');
    return;
  }

  requested = true;
  if (initialized) return;
  if (loading) return loading;

  loading = Promise.all([
    import('@sentry/react'),
    import('@/lib/convexClient'),
  ]).then(async ([sdk, { convexDeploymentOrigin }]) => {
    Sentry = sdk;
    await closing;
    if (!requested || initialized) return;

    if (client) {
      client.getOptions().enabled = true;
      initialized = true;
      replay.startForConsent();
      return;
    }

    const tracePropagationTargets = ['localhost'];
    if (convexDeploymentOrigin) {
      tracePropagationTargets.push(convexDeploymentOrigin);
    }

    // SDK 7 schedules _initialize on a timer. Consent owns startup instead.
    class ConsentReplay extends Sentry.Replay {
      constructor(options) {
        super(options);
        this.pendingTransitions = new Set();
      }

      setupOnce() {
        super.setupOnce();
        // SDK 7 resumes buffer recording after an awaited send, even after stop().
        const recorder = this._replay;
        const track = (pending) => {
          this.pendingTransitions.add(pending);
          const finished = () => this.pendingTransitions.delete(pending);
          void pending.then(finished, finished);
          return pending;
        };
        const stop = recorder.stop.bind(recorder);
        recorder.stop = (options) => {
          const buffer = recorder.eventBuffer;
          const pendingFlush = recorder._flushLock;
          // SDK event insertion can await stop from inside the flush itself.
          if (buffer && pendingFlush) {
            recorder.eventBuffer = null;
            const stopping = stop({ ...options, forceFlush: false });
            track(Promise.allSettled([stopping, pendingFlush]).then(() => buffer.destroy()));
            return track(stopping);
          }
          return track(stop(options));
        };
        const initializeSampling = recorder.initializeSampling.bind(recorder);
        recorder.initializeSampling = (...args) => {
          if (initialized && requested) initializeSampling(...args);
        };
        const startRecording = recorder.startRecording.bind(recorder);
        recorder.startRecording = () => {
          if (initialized && requested && recorder.isEnabled()) startRecording();
        };
        const sendBuffered = recorder.sendBufferedReplayOrFlush.bind(recorder);
        recorder.sendBufferedReplayOrFlush = (options) => {
          if (!initialized || !requested) return Promise.resolve();
          return track(sendBuffered(options));
        };
      }

      _initialize() {}

      startForConsent() {
        super._initialize();
      }

      stop() {
        // Terminating SDK 7's worker leaves in-flight compression promises unresolved.
        const recorder = this._replay;
        const buffer = recorder.eventBuffer;
        const pendingFlush = recorder._flushLock;
        recorder.eventBuffer = null;
        return Promise.allSettled([recorder.stop({ forceFlush: true }), pendingFlush, ...this.pendingTransitions])
          .then(() => { buffer?.destroy(); });
      }
    }
    replay = new ConsentReplay({
      maskAllText: true,
      maskAllInputs: true,
      blockAllMedia: true,
      block: [SENSITIVE_TELEMETRY_SELECTOR],
      ignore: [SENSITIVE_TELEMETRY_SELECTOR],
    });

    Sentry.init({
      dsn: SENTRY_DSN,
      transport: (options) => {
        const transport = Sentry.makeFetchTransport(options);
        // Preserve SDK transport annotations used for error-response validation.
        const send = Object.assign((envelope) => initialized
          ? transport.send(envelope)
          : Promise.resolve({ statusCode: 200 }), transport.send);
        return {
          ...transport,
          // Replay sends directly, even when the core client is disabled.
          send,
        };
      },
      integrations: [
        Sentry.browserTracingIntegration(),
        replay,
      ],
      beforeBreadcrumb: (breadcrumb, hint) => (
        shouldDropSensitiveUiBreadcrumb(breadcrumb, hint) ? null : breadcrumb
      ),
      beforeSend: (event) => (
        shouldDropSensitiveTelemetry(event) ? null : event
      ),
      tracesSampleRate: 0.2,
      tracePropagationTargets,
      replaysSessionSampleRate: 0.05,
      replaysOnErrorSampleRate: 1.0,
      sendDefaultPii: false,
    });

    client = Sentry.getCurrentHub().getClient();
    const getDsn = client.getDsn.bind(client);
    // Replay may finish after its session is cleared; no DSN skips request preparation.
    client.getDsn = () => initialized ? getDsn() : undefined;
    if (requested) {
      initialized = true;
      replay.startForConsent();
    } else {
      closeSentryTelemetry();
    }
  }).catch((error) => {
    console.warn('Sentry telemetry could not be initialized', error);
  }).finally(() => {
    loading = undefined;
  });
  return loading;
}

export function closeSentryTelemetry() {
  requested = false;
  initialized = false;
  if (!client || closing) return closing;

  client.getOptions().enabled = false;
  // stop() force-flushes session Replay in SDK 7. The transport gate is already closed.
  closing = Promise.allSettled([replay.stop(), client.close(2000)])
    .then((results) => {
      const failure = results.find((result) => result.status === 'rejected');
      if (failure) console.warn('Sentry telemetry could not be stopped', failure.reason);
    })
    .finally(() => { closing = undefined; });
  return closing;
}

export function captureException(error, context) {
  if (!initialized) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Sentry not initialized:', error, context);
    }
    return;
  }

  if (hasSensitiveTelemetrySource(context)) {
    const { telemetrySource: _telemetrySource, ...safeContext } = context;
    Sentry.withScope((scope) => {
      scope.setTag(SENSITIVE_TELEMETRY_TAG, SENSITIVE_TELEMETRY_TAG_VALUE);
      Sentry.captureException(error, Object.keys(safeContext).length ? safeContext : undefined);
    });
    return;
  }

  Sentry.captureException(error, context);
}
