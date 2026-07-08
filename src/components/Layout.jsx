import React, { useState, useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Toaster } from '@/components/ui/toaster';
import CustomCursor from '@/components/CustomCursor';
import ScrollProgressBar from '@/components/ScrollProgressBar';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import SentryTelemetry from '@/components/SentryTelemetry';
import CookieConsentBanner from '@/components/CookieConsentBanner';
import { COOKIE_CONSENT_KEY, readAnalyticsConsent } from '@/lib/consent';

const Layout = () => {
  const [gaConsent, setGaConsent] = useState(readAnalyticsConsent);
  const [showConsentManager, setShowConsentManager] = useState(false);

  const syncAnalyticsConsent = useCallback(() => {
    setGaConsent(readAnalyticsConsent());
  }, []);

  useEffect(() => {
    syncAnalyticsConsent();

    // Listen for event from footer to manage cookies
    const handleManageCookies = () => setShowConsentManager(true);
    const handleStorage = (event) => {
      if (event.key === COOKIE_CONSENT_KEY) {
        syncAnalyticsConsent();
      }
    };

    window.addEventListener('manage-cookies', handleManageCookies);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('manage-cookies', handleManageCookies);
      window.removeEventListener('storage', handleStorage);
    };
  }, [syncAnalyticsConsent]);

  const handleConsent = useCallback(() => {
    setGaConsent(true);
  }, []);

  const handleHideManager = useCallback(() => {
    setShowConsentManager(false);
    syncAnalyticsConsent();
  }, [syncAnalyticsConsent]);

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-accent-purple focus:text-white focus:px-4 focus:py-2 focus:rounded-md"
      >
        Skip to main content
      </a>
      <ScrollProgressBar />
      <CustomCursor />
      <GoogleAnalytics hasConsent={gaConsent} />
      <SentryTelemetry hasConsent={gaConsent} />
      <div className="min-h-screen bg-[#0C0D0D] text-white overflow-x-hidden flex flex-col">
        <Header />
        <main id="main-content" className="flex-grow">
          <Outlet />
        </main>
        <Footer />
        <Toaster />
      </div>
      <CookieConsentBanner onConsent={handleConsent} show={showConsentManager} onHide={handleHideManager} />
    </>
  );
};

export default Layout;
