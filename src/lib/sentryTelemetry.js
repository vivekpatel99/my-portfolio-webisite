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
let traceSampleRate;
let consentEpoch = 0;
const consentEpochTag = 'telemetry.consent_epoch';
const activeTransactions = new Set();
const promotionTimers = new Set();

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
      client.getOptions().tracesSampleRate = traceSampleRate;
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
      // SDK 7 schedules an untagged promotion timer; consent owns its lifetime.
      beforeErrorSampling(event) {
        const epoch = consentEpoch;
        const replayId = replay.getReplayId();
        if (!initialized || !requested || event.tags?.replayId !== replayId) return false;
        const timer = setTimeout(() => {
          promotionTimers.delete(timer);
          if (initialized && requested && epoch === consentEpoch && replay.getReplayId() === replayId) {
            void replay.flush();
          }
        });
        promotionTimers.add(timer);
        return false;
      },
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
        const send = Object.assign((envelope) => {
          if (!initialized) return Promise.resolve({ statusCode: 0 });
          const epoch = consentEpoch;
          // SDK 7 uses successful responses to promote Replay, even after reaccept.
          return transport.send(envelope).then((response) => (
            initialized && requested && epoch === consentEpoch ? response : { statusCode: 0 }
          ));
        }, transport.send);
        return {
          ...transport,
          // Replay sends directly, even when the core client is disabled.
          send,
        };
      },
      integrations: [
        {
          name: 'ConsentTracing',
          setupOnce() {},
          setup(tracingClient) {
            tracingClient.on('startTransaction', (transaction) => {
              transaction.setTag(consentEpochTag, requested ? consentEpoch : -1);
              if (!requested) transaction.sampled = false;
              else activeTransactions.add(transaction);
            });
            tracingClient.on('finishTransaction', (transaction) => activeTransactions.delete(transaction));
          },
        },
        Sentry.browserTracingIntegration(),
        replay,
      ],
      beforeBreadcrumb: (breadcrumb, hint) => (
        !initialized || !requested || shouldDropSensitiveUiBreadcrumb(breadcrumb, hint) ? null : breadcrumb
      ),
      beforeSend: (event) => (
        shouldDropSensitiveTelemetry(event) ? null : event
      ),
      beforeSendTransaction: (event) => {
        if (!initialized || !requested || event.tags?.[consentEpochTag] !== consentEpoch) return null;
        const { [consentEpochTag]: _epoch, ...tags } = event.tags;
        return { ...event, tags };
      },
      tracesSampleRate: 0.2,
      tracePropagationTargets,
      replaysSessionSampleRate: 0.05,
      replaysOnErrorSampleRate: 1.0,
      sendDefaultPii: false,
    });

    client = Sentry.getCurrentHub().getClient();
    traceSampleRate = client.getOptions().tracesSampleRate;
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
  consentEpoch += 1;
  for (const timer of promotionTimers) clearTimeout(timer);
  promotionTimers.clear();
  if (!client || closing) return closing;

  client.getOptions().enabled = false;
  // SDK 7's tracing guard checks property presence, not the core enabled flag.
  delete client.getOptions().tracesSampleRate;
  for (const transaction of activeTransactions) {
    transaction.sampled = false;
    transaction.finish();
  }
  activeTransactions.clear();
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
