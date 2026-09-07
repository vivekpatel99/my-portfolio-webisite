// Mark a DOM subtree once when its contents must never be sent to telemetry.
export const SENSITIVE_TELEMETRY_ATTRIBUTE = 'data-sensitive-telemetry';
export const SENSITIVE_TELEMETRY_SELECTOR = `[${SENSITIVE_TELEMETRY_ATTRIBUTE}]`;
export const SENSITIVE_TELEMETRY_REGION_PROPS = {
  [SENSITIVE_TELEMETRY_ATTRIBUTE]: 'true',
};

function getTarget(source) {
  if (!source || typeof source !== 'object') return null;
  return source.target ?? source.currentTarget ?? source;
}

export function isSensitiveTelemetrySource(source) {
  const target = getTarget(source);
  if (!target || (typeof target.matches !== 'function' && typeof target.closest !== 'function')) {
    return false;
  }

  try {
    return target.matches?.(SENSITIVE_TELEMETRY_SELECTOR) === true
      || Boolean(target.closest?.(SENSITIVE_TELEMETRY_SELECTOR));
  } catch {
    // Browser instrumentation must not throw while checking an unusual event target.
    return false;
  }
}

export function shouldDropSensitiveUiBreadcrumb(breadcrumb, hint) {
  return breadcrumb?.category?.startsWith('ui.') === true
    && isSensitiveTelemetrySource(hint?.event ?? hint?.target ?? hint);
}

export function shouldDropSensitiveTelemetry(hint) {
  return isSensitiveTelemetrySource(hint?.telemetrySource ?? hint?.event ?? hint);
}
