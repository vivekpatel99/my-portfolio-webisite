// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const KEY = 'cookie_consent_preferences';
const originalDescriptor = Object.getOwnPropertyDescriptor(window, 'localStorage');

let storage;
let consent;

function installStorage({ setItem } = {}) {
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      clear: () => storage.clear(),
      getItem: (key) => (storage.has(key) ? storage.get(key) : null),
      removeItem: (key) => storage.delete(key),
      setItem: setItem || ((key, value) => storage.set(key, String(value))),
    },
  });
}

function blockWrites(name = 'SecurityError') {
  installStorage({
    setItem: () => {
      throw new DOMException('Storage write blocked', name);
    },
  });
}

function blockStorageGetter() {
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    get() {
      throw new DOMException('Storage access denied', 'SecurityError');
    },
  });
}

beforeEach(async () => {
  vi.resetModules();
  storage = new Map();
  installStorage();
  consent = await import('./consent.js');
});

afterEach(() => {
  if (originalDescriptor) {
    Object.defineProperty(window, 'localStorage', originalDescriptor);
  }
});

describe('saveCookieConsentPreferences', () => {
  it('persists normalized preferences when storage works', () => {
    expect(consent.saveCookieConsentPreferences({ analytics: true })).toEqual({ necessary: true, analytics: true });
    expect(JSON.parse(storage.get(KEY))).toEqual({ necessary: true, analytics: true });
    expect(consent.readAnalyticsConsent()).toBe(true);
  });

  it.each(['SecurityError', 'QuotaExceededError'])('retains the choice for the session when setItem throws %s', (name) => {
    blockWrites(name);

    expect(() => consent.saveCookieConsentPreferences({ analytics: false })).not.toThrow();
    expect(consent.readCookieConsentPreferences()).toEqual({ necessary: true, analytics: false });
    expect(consent.readAnalyticsConsent()).toBe(false);
    expect(storage.has(KEY)).toBe(false);
  });

  it('retains the choice when the localStorage getter throws', () => {
    blockStorageGetter();

    expect(consent.saveCookieConsentPreferences({ analytics: true })).toEqual({ necessary: true, analytics: true });
    expect(consent.readCookieConsentPreferences()).toEqual({ necessary: true, analytics: true });
    expect(consent.readAnalyticsConsent()).toBe(true);
  });

  it('lets a failed rejection override a stale stored acceptance', () => {
    storage.set(KEY, JSON.stringify({ necessary: true, analytics: true }));
    blockWrites();

    consent.saveCookieConsentPreferences({ analytics: false });

    expect(consent.readCookieConsentPreferences()).toEqual({ necessary: true, analytics: false });
    expect(consent.readAnalyticsConsent()).toBe(false);
    expect(JSON.parse(storage.get(KEY)).analytics).toBe(true);
  });

  it('lets a failed acceptance override a stale stored rejection', () => {
    storage.set(KEY, JSON.stringify({ necessary: true, analytics: false }));
    blockWrites();

    consent.saveCookieConsentPreferences({ analytics: true });

    expect(consent.readAnalyticsConsent()).toBe(true);
  });

  it('uses the latest failed choice', () => {
    blockWrites();

    consent.saveCookieConsentPreferences({ analytics: true });
    consent.saveCookieConsentPreferences({ analytics: false });

    expect(consent.readCookieConsentPreferences()).toEqual({ necessary: true, analytics: false });
  });

  it('enables analytics only for an explicit true', () => {
    blockWrites();

    for (const analytics of ['true', 1, {}, undefined, null]) {
      expect(consent.saveCookieConsentPreferences({ necessary: false, analytics })).toEqual({
        necessary: true,
        analytics: false,
      });
      expect(consent.readCookieConsentPreferences()).toEqual({ necessary: true, analytics: false });
    }
    expect(consent.saveCookieConsentPreferences(undefined)).toEqual({ necessary: true, analytics: false });
  });

  it('returns to stored reads after a later successful save', () => {
    blockWrites();
    consent.saveCookieConsentPreferences({ analytics: true });

    installStorage();
    consent.saveCookieConsentPreferences({ analytics: false });

    expect(JSON.parse(storage.get(KEY))).toEqual({ necessary: true, analytics: false });
    storage.set(KEY, JSON.stringify({ necessary: true, analytics: true }));
    expect(consent.readAnalyticsConsent()).toBe(true);
  });
});

describe('readCookieConsentPreferences', () => {
  it('reflects storage written by another tab after a successful save', () => {
    consent.saveCookieConsentPreferences({ analytics: false });
    storage.set(KEY, JSON.stringify({ necessary: true, analytics: true }));

    expect(consent.readAnalyticsConsent()).toBe(true);
  });

  it('returns null without a stored or retained choice', () => {
    expect(consent.readCookieConsentPreferences()).toBeNull();
    blockStorageGetter();
    expect(consent.readCookieConsentPreferences()).toBeNull();
    expect(consent.readAnalyticsConsent()).toBe(false);
  });
});
