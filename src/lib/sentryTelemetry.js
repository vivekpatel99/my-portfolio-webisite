const SENTRY_DSN =
  import.meta.env.VITE_SENTRY_DSN ||
  'https://b697debff1be30b835700c935a494249@o4510426517143552.ingest.de.sentry.io/4510426780532816';

let initialized = false;
let initializing = false;
let sentryModule = null;
let sentryLoadPromise = null;

function getConvexDeploymentOrigin() {
  const value = import.meta.env.VITE_CONVEX_URL?.trim();
  if (!value) {
    return null;
  }

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

async function loadSentry() {
  if (sentryModule) {
    return sentryModule;
  }

  if (!sentryLoadPromise) {
    sentryLoadPromise = import('@sentry/react').then((module) => {
      sentryModule = module;
      return module;
    });
  }

  return sentryLoadPromise;
}

export async function initializeSentryTelemetry() {
  if (initialized || initializing || process.env.NODE_ENV !== 'production') {
    return;
  }

  if (!SENTRY_DSN || SENTRY_DSN === 'your-sentry-dsn-here') {
    console.warn('Sentry DSN not configured, telemetry disabled');
    return;
  }

  initializing = true;

  try {
    const Sentry = await loadSentry();
    const tracePropagationTargets = ['localhost'];
    const convexDeploymentOrigin = getConvexDeploymentOrigin();

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
    });

    initialized = true;
  } finally {
    initializing = false;
  }
}

export async function closeSentryTelemetry() {
  if (!initialized) {
    return;
  }

  const Sentry = sentryModule ?? (await loadSentry());
  const client = Sentry.getClient();
  await client?.close?.(2000);
  initialized = false;
}

export function captureException(error, context) {
  if (!initialized || !sentryModule) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Sentry not initialized:', error, context);
    }
    return;
  }

  sentryModule.captureException(error, context);
}
