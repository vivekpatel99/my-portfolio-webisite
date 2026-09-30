export const COOKIE_CONSENT_KEY = 'cookie_consent_preferences';

export const DEFAULT_COOKIE_CONSENT_PREFERENCES = {
  necessary: true,
  analytics: false,
};

let unpersistedPreferences = null;

function normalizePreferences(preferences) {
  return {
    necessary: true,
    analytics: preferences?.analytics === true,
  };
}

export function readCookieConsentPreferences() {
  if (typeof window === 'undefined') {
    return null;
  }

  if (unpersistedPreferences) {
    return { ...unpersistedPreferences };
  }

  try {
    const savedPrefs = window.localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!savedPrefs) {
      return null;
    }

    return normalizePreferences(JSON.parse(savedPrefs));
  } catch {
    return null;
  }
}

export function readAnalyticsConsent() {
  return readCookieConsentPreferences()?.analytics === true;
}

export function saveCookieConsentPreferences(preferences) {
  if (typeof window === 'undefined') {
    return DEFAULT_COOKIE_CONSENT_PREFERENCES;
  }

  const safePreferences = normalizePreferences(preferences);

  try {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(safePreferences));
    unpersistedPreferences = null;
  } catch {
    unpersistedPreferences = safePreferences;
  }

  return { ...safePreferences };
}
