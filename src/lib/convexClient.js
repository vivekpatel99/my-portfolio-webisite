import { ConvexReactClient } from 'convex/react';

const PLACEHOLDER_HOSTS = new Set([
  'example.com',
  'example.net',
  'example.org',
]);

const LOCAL_DEVELOPMENT_MESSAGE =
  'Convex is not configured. Set VITE_CONVEX_URL in .env.local to enable contact form submissions.';

const CONVEX_CLOUD_HOST_PATTERN =
  /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)?\.convex\.cloud$/;
const EXPLICIT_PORT_PATTERN = /^https?:\/\/[^/?#]+:\d+(?=[/?#]|$)/i;

function isConvexCloudHost(hostname) {
  return CONVEX_CLOUD_HOST_PATTERN.test(hostname);
}

function hasExplicitPort(value) {
  return EXPLICIT_PORT_PATTERN.test(value);
}

function describeConvexUrlIssue(rawUrl, { isProduction } = {}) {
  const value = typeof rawUrl === 'string' ? rawUrl.trim() : '';

  if (!value) {
    return 'Missing VITE_CONVEX_URL.';
  }

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    return 'VITE_CONVEX_URL must be an absolute URL.';
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return 'VITE_CONVEX_URL must use http:// for local development or https:// for deployed Convex.';
  }

  const normalizedValue = value.toLowerCase();
  const normalizedHost = parsed.hostname.toLowerCase();
  const hasPlaceholderText =
    normalizedHost.startsWith('your-') ||
    normalizedHost.startsWith('example.') ||
    normalizedValue.includes('<') ||
    normalizedValue.includes('placeholder');

  if (PLACEHOLDER_HOSTS.has(normalizedHost) || hasPlaceholderText) {
    return 'VITE_CONVEX_URL still contains a placeholder value.';
  }

  if (isProduction && parsed.protocol !== 'https:') {
    return 'Production VITE_CONVEX_URL must use https://.';
  }

  if (isProduction && !isConvexCloudHost(normalizedHost)) {
    return 'Production VITE_CONVEX_URL must point to a convex.cloud deployment.';
  }

  if (isProduction && (parsed.username || parsed.password)) {
    return 'Production VITE_CONVEX_URL must not include credentials.';
  }

  if (isProduction && hasExplicitPort(value)) {
    return 'Production VITE_CONVEX_URL must not include an explicit port.';
  }

  if (
    isProduction &&
    (parsed.pathname !== '/' || parsed.search || parsed.hash)
  ) {
    return 'Production VITE_CONVEX_URL must not include a path, query, or hash.';
  }

  return null;
}

export function resolveConvexClientConfig(
  rawUrl,
  { isProduction = false } = {},
) {
  const value = typeof rawUrl === 'string' ? rawUrl.trim() : '';
  const issue = describeConvexUrlIssue(value, { isProduction });

  return {
    issue,
    shouldFailFast: Boolean(issue && isProduction),
    url: issue ? null : value,
  };
}

function createDisabledConvexClient(reason = LOCAL_DEVELOPMENT_MESSAGE) {
  const error = () => new Error(reason);
  const disabledWatch = {
    journal: () => undefined,
    localQueryResult: () => {
      throw error();
    },
    onUpdate: () => () => {},
  };

  return {
    action: () => Promise.reject(error()),
    clearAuth: () => {},
    close: () => Promise.resolve(),
    connectionState: () => ({
      hasInflightRequests: false,
      isWebSocketConnected: false,
    }),
    logger: console,
    mutation: () => Promise.reject(error()),
    query: () => Promise.reject(error()),
    setAuth: () => {},
    subscribeToConnectionState: () => () => {},
    url: null,
    watchPaginatedQuery: () => disabledWatch,
    watchQuery: () => disabledWatch,
  };
}

function createConvexClient(config) {
  if (config.shouldFailFast) {
    throw new Error(
      `${config.issue} Refusing to start the production app until Convex is configured.`,
    );
  }

  if (config.issue) {
    console.warn(`${config.issue} ${LOCAL_DEVELOPMENT_MESSAGE}`);
    return createDisabledConvexClient(
      `${config.issue} ${LOCAL_DEVELOPMENT_MESSAGE}`,
    );
  }

  return new ConvexReactClient(config.url);
}

export const convexRuntimeConfig = resolveConvexClientConfig(
  import.meta.env.VITE_CONVEX_URL,
  { isProduction: import.meta.env.PROD },
);

export const convexDeploymentOrigin = convexRuntimeConfig.url
  ? new URL(convexRuntimeConfig.url).origin
  : null;

const convex = createConvexClient(convexRuntimeConfig);

export default convex;
