import { useState, useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Toaster } from '@/components/ui/toaster';
import CustomCursor from '@/components/CustomCursor';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import CookieConsentBanner from '@/components/CookieConsentBanner';

const COOKIE_CONSENT_KEY = 'cookie_consent_preferences';

const Layout = () => {
  // Lazy initialization - check localStorage on mount
  const [gaConsent, setGaConsent] = useState(() => {
    const savedPrefs = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (savedPrefs) {
      try {
        const prefs = JSON.parse(savedPrefs);
        return prefs.analytics === true;
      } catch {
        return false;
      }
    }
    return false;
  });
  const [showConsentManager, setShowConsentManager] = useState(false);

  useEffect(() => {
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
      <CustomCursor />
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
