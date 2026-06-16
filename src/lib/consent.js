export const COOKIE_CONSENT_KEY = 'cookie_consent_preferences';

export const DEFAULT_COOKIE_CONSENT_PREFERENCES = {
  necessary: true,
  analytics: false,
};

export function readCookieConsentPreferences() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const savedPrefs = window.localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!savedPrefs) {
      return null;
    }

    const parsedPrefs = JSON.parse(savedPrefs);
    return {
      necessary: true,
      analytics: parsedPrefs?.analytics === true,
    };
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

  const safePreferences = {
    necessary: true,
    analytics: preferences?.analytics === true,
  };

  window.localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(safePreferences));
  return safePreferences;
}
