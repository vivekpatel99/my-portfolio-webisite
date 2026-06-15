export const COOKIE_CONSENT_KEY = 'cookie_consent_preferences';

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
