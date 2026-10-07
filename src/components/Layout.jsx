import React, { Suspense, useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { LazyMotion, domAnimation } from 'framer-motion';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import RouteErrorBoundary from '@/components/RouteErrorBoundary';
import RouteLoading from '@/components/RouteLoading';
import { Toaster } from '@/components/ui/toaster';
import CustomCursor from '@/components/CustomCursor';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import SentryTelemetry from '@/components/SentryTelemetry';
import CookieConsentBanner from '@/components/CookieConsentBanner';
import { COOKIE_CONSENT_KEY, readAnalyticsConsent } from '@/lib/consent';

const Layout = () => {
  const location = useLocation();
  const [gaConsent, setGaConsent] = useState(readAnalyticsConsent);
  const [showConsentManager, setShowConsentManager] = useState(false);
  const consentSpacerRef = useRef(null);
  const anchoringFrameRef = useRef(null);
  const previousAnchoringRef = useRef(null);

  const restoreScrollAnchoring = useCallback(() => {
    if (anchoringFrameRef.current !== null) {
      window.cancelAnimationFrame(anchoringFrameRef.current);
      anchoringFrameRef.current = null;
    }
    if (previousAnchoringRef.current !== null) {
      document.documentElement.style.overflowAnchor = previousAnchoringRef.current;
      previousAnchoringRef.current = null;
    }
  }, []);

  useLayoutEffect(() => restoreScrollAnchoring, [restoreScrollAnchoring]);

  const handleConsentBannerBottom = useCallback((bannerBottom) => {
    const spacer = consentSpacerRef.current;
    // WebKit can scroll when scroll-padding changes, so capture geometry before updating it.
    const scrollY = window.scrollY;
    const spacerTop = spacer ? spacer.getBoundingClientRect().top + scrollY : 0;
    const rootStyle = document.documentElement.style;
    if (bannerBottom > 0) {
      rootStyle.setProperty('--consent-banner-bottom', `${Math.ceil(bannerBottom)}px`);
    } else {
      rootStyle.removeProperty('--consent-banner-bottom');
    }
    if (!spacer) return;

    const oldHeight = parseFloat(spacer.style.height) || 0;
    const nextHeight = bannerBottom > 0 ? Math.max(0, Math.ceil(bannerBottom - spacerTop)) : 0;
    if (oldHeight === nextHeight) {
      spacer.style.height = `${nextHeight}px`;
      return;
    }

    // Own this adjustment in both engines instead of adding to Chromium's native anchoring.
    if (previousAnchoringRef.current === null) {
      previousAnchoringRef.current = rootStyle.overflowAnchor;
    }
    if (anchoringFrameRef.current !== null) window.cancelAnimationFrame(anchoringFrameRef.current);
    rootStyle.overflowAnchor = 'none';
    // Reserve before paint and before scrolling; a queued React update would leave the old scroll range.
    spacer.style.height = `${nextHeight}px`;
    if (scrollY > 0) {
      window.scrollTo({ top: Math.max(0, scrollY + nextHeight - oldHeight), behavior: 'instant' });
    }
    anchoringFrameRef.current = window.requestAnimationFrame(restoreScrollAnchoring);
  }, [restoreScrollAnchoring]);

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
    <LazyMotion features={domAnimation} strict>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-accent-purple focus:text-white focus:px-4 focus:py-2 focus:rounded-md"
      >
        Skip to main content
      </a>
      <CustomCursor />
      <GoogleAnalytics hasConsent={gaConsent} />
      <SentryTelemetry hasConsent={gaConsent} />
      <div className="min-h-screen bg-[#0C0D0D] text-white flex flex-col">
        <Header />
        <div
          ref={consentSpacerRef}
          data-testid="cookie-consent-spacer"
          aria-hidden="true"
        />
        <main id="main-content" className="flex-grow">
          <RouteErrorBoundary resetKey={location.key}>
            <Suspense fallback={<RouteLoading />}>
              <Outlet />
            </Suspense>
          </RouteErrorBoundary>
        </main>
        <Footer />
        <Toaster />
      </div>
      <CookieConsentBanner
        onConsent={handleConsent}
        show={showConsentManager}
        onHide={handleHideManager}
        onReservedBottomChange={handleConsentBannerBottom}
      />
    </LazyMotion>
  );
};

export default Layout;
