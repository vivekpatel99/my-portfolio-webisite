// Mark a DOM subtree once when its contents must never be sent to telemetry.
export const SENSITIVE_TELEMETRY_ATTRIBUTE = 'data-sensitive-telemetry';
export const SENSITIVE_TELEMETRY_SELECTOR = `[${SENSITIVE_TELEMETRY_ATTRIBUTE}]`;
export const SENSITIVE_TELEMETRY_TAG = 'telemetry.sensitive_region';
export const SENSITIVE_TELEMETRY_TAG_VALUE = 'true';
export const SENSITIVE_TELEMETRY_REGION_PROPS = {
  [SENSITIVE_TELEMETRY_ATTRIBUTE]: 'true',
};

function getTarget(source) {
  if (!source || typeof source !== 'object') return null;
  if (typeof source.matches === 'function' || typeof source.closest === 'function') {
    return source;
  }
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

export function hasSensitiveTelemetrySource(context) {
  return isSensitiveTelemetrySource(context?.telemetrySource);
}

export function shouldDropSensitiveTelemetry(event) {
  return event?.tags?.[SENSITIVE_TELEMETRY_TAG] === SENSITIVE_TELEMETRY_TAG_VALUE;
}
