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

export function initializeSentryTelemetry() {
  if (initialized || process.env.NODE_ENV !== 'production') {
    return;
  }

  if (!SENTRY_DSN || SENTRY_DSN === 'your-sentry-dsn-here') {
    console.warn('Sentry DSN not configured, telemetry disabled');
    return;
  }

  requested = true;
  if (loading) return loading;

  loading = Promise.all([
    import('@sentry/react'),
    import('@/lib/convexClient'),
  ]).then(([sdk, { convexDeploymentOrigin }]) => {
    Sentry = sdk;
    if (!requested || initialized) return;

    const tracePropagationTargets = ['localhost'];
    if (convexDeploymentOrigin) {
      tracePropagationTargets.push(convexDeploymentOrigin);
    }

    Sentry.init({
      dsn: SENTRY_DSN,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,
          maskAllInputs: true,
          blockAllMedia: true,
          block: [SENSITIVE_TELEMETRY_SELECTOR],
          ignore: [SENSITIVE_TELEMETRY_SELECTOR],
        }),
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

    initialized = true;
  }).catch((error) => {
    console.warn('Sentry telemetry could not be initialized', error);
  }).finally(() => {
    loading = undefined;
  });
  return loading;
}

export function closeSentryTelemetry() {
  requested = false;
  if (!initialized) {
    return;
  }

  const client = Sentry.getCurrentHub().getClient();
  void client?.close?.(2000);
  initialized = false;
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
