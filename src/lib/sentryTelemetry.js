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
          blockAllMedia: true,
        }),
      ],
      tracesSampleRate: 0.2,
      tracePropagationTargets,
      replaysSessionSampleRate: 0.05,
      replaysOnErrorSampleRate: 1.0,
      sendDefaultPii: false,
      beforeBreadcrumb(breadcrumb, hint) {
        const target = hint?.event?.target;
        if (
          breadcrumb?.category?.startsWith('ui.')
          && typeof target?.closest === 'function'
          && target.closest('#project-fit-diagnostic, #contact-inquiry')
        ) {
          return null;
        }

        return breadcrumb;
      },
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

  Sentry.captureException(error, context);
}
