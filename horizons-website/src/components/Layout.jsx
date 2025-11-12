import React, { useState, useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Toaster } from '@/components/ui/toaster';
import CustomCursor from '@/components/CustomCursor';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import CookieConsentBanner from '@/components/CookieConsentBanner';

const COOKIE_CONSENT_KEY = 'cookie_consent_preferences';

const Layout = () => {
  const [gaConsent, setGaConsent] = useState(false);
  const [showConsentManager, setShowConsentManager] = useState(false);

  useEffect(() => {
    // Check for existing consent on initial load
    const savedPrefs = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (savedPrefs) {
      const prefs = JSON.parse(savedPrefs);
      if (prefs.analytics) {
        setGaConsent(true);
      }
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
      <CustomCursor />
      {gaConsent && <GoogleAnalytics />}
      <div className="min-h-screen bg-[#0C0D0D] text-white overflow-x-hidden flex flex-col">
        <Header />
        <main className="flex-grow">
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