import { useState, useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Toaster } from '@/components/ui/toaster';
import CustomCursor from '@/components/CustomCursor';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import CookieConsentBanner from '@/components/CookieConsentBanner';
import {
  createMediaQueryList,
  shouldMountCustomCursor,
  subscribeMediaQuery,
} from '@/lib/customCursor';

const COOKIE_CONSENT_KEY = 'cookie_consent_preferences';

const useCustomCursorEnabled = () => {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    const mediaWindow = typeof window !== 'undefined' ? window : undefined;
    const pointerQuery = createMediaQueryList(mediaWindow, '(pointer: fine)');
    const reducedMotionQuery = createMediaQueryList(
      mediaWindow,
      '(prefers-reduced-motion: reduce)'
    );

    if (!pointerQuery || !reducedMotionQuery) {
      return undefined;
    }

    const updateCursorPreference = () => {
      setIsEnabled(
        shouldMountCustomCursor({
          hasFinePointer: pointerQuery.matches,
          prefersReducedMotion: reducedMotionQuery.matches,
        })
      );
    };

    updateCursorPreference();
    const cleanupPointerQuery = subscribeMediaQuery(pointerQuery, updateCursorPreference);
    const cleanupReducedMotionQuery = subscribeMediaQuery(
      reducedMotionQuery,
      updateCursorPreference
    );

    return () => {
      cleanupPointerQuery();
      cleanupReducedMotionQuery();
    };
  }, []);

  return isEnabled;
};

const Layout = () => {
  // Lazy initialization - check localStorage on mount
  const [gaConsent, setGaConsent] = useState(() => {
    try {
      const savedPrefs =
        typeof window !== 'undefined' && window.localStorage
          ? window.localStorage.getItem(COOKIE_CONSENT_KEY)
          : null;
      if (savedPrefs) {
        const prefs = JSON.parse(savedPrefs);
        return prefs.analytics === true;
      }
    } catch {
      return false;
    }
    return false;
  });
  const [showConsentManager, setShowConsentManager] = useState(false);
  const isCustomCursorEnabled = useCustomCursorEnabled();

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined;
    }

    document.documentElement.classList.toggle('custom-cursor-enabled', isCustomCursorEnabled);

    return () => {
      document.documentElement.classList.remove('custom-cursor-enabled');
    };
  }, [isCustomCursorEnabled]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    // Listen for event from footer to manage cookies
    const handleManageCookies = () => setShowConsentManager(true);
    window.addEventListener('manage-cookies', handleManageCookies);

    return () => {
      window.removeEventListener('manage-cookies', handleManageCookies);
    };
  }, []);

  const handleConsent = useCallback(() => {
    setGaConsent(true);
  }, []);

  const handleHideManager = useCallback(() => {
    setShowConsentManager(false);
  }, []);

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-accent-purple focus:text-white focus:px-4 focus:py-2 focus:rounded-md"
      >
        Skip to main content
      </a>
      {isCustomCursorEnabled && <CustomCursor />}
      {gaConsent && <GoogleAnalytics />}
      <div className="min-h-screen bg-[#0C0D0D] text-white overflow-x-hidden flex flex-col">
        <Header />
        <main id="main-content" className="flex-grow">
          <Outlet />
        </main>
        <Footer />
        <Toaster />
      </div>
      <CookieConsentBanner
        onConsent={handleConsent}
        show={showConsentManager}
        onHide={handleHideManager}
      />
    </>
  );
};

export default Layout;
