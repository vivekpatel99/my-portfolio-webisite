import React, { useEffect } from 'react';

const GA_TRACKING_ID = import.meta.env.VITE_GA_TRACKING_ID || 'G-7E37RV2DDN';
const GA_SCRIPT_ID = 'google-analytics-gtag';
const GA_COOKIE_NAMES = ['_ga', '_gid', '_gat', `_ga_${GA_TRACKING_ID.replace('G-', '')}`];

const expireCookie = (name) => {
  const hostname = window.location.hostname;
  const rootDomain = hostname.replace(/^www\./, '');
  const domains = ['', hostname, `.${rootDomain}`];

  domains.forEach((domain) => {
    const domainPart = domain ? `; domain=${domain}` : '';
    document.cookie = `${name}=; Max-Age=0; path=/${domainPart}; SameSite=Lax`;
  });
};

const disableGoogleAnalytics = () => {
  window[`ga-disable-${GA_TRACKING_ID}`] = true;

  if (typeof window.gtag === 'function') {
    window.gtag('consent', 'update', {
      analytics_storage: 'denied',
    });
  }

  document.getElementById(GA_SCRIPT_ID)?.remove();
  GA_COOKIE_NAMES.forEach(expireCookie);

  window.gtag = undefined;
};

const GoogleAnalytics = ({ hasConsent }) => {
  useEffect(() => {
    if (!hasConsent) {
      disableGoogleAnalytics();
      console.log('Google Analytics blocked - no consent');
      return;
    }

    window[`ga-disable-${GA_TRACKING_ID}`] = false;

    if (process.env.NODE_ENV !== 'production' || window.location.hostname === 'localhost') {
      console.log('Google Analytics disabled in development');
      return;
    }

    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        analytics_storage: 'granted',
      });
      window.gtag('config', GA_TRACKING_ID);
      console.log('Google Analytics already initialized');
      return;
    }
    
    console.log(`Loading Google Analytics: ${GA_TRACKING_ID}`);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
    window.gtag('consent', 'update', {
      analytics_storage: 'granted',
    });
    window.gtag('js', new Date());
    window.gtag('config', GA_TRACKING_ID);

    if (!document.getElementById(GA_SCRIPT_ID)) {
      const script = document.createElement('script');
      script.id = GA_SCRIPT_ID;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`;
      script.async = true;
      document.head.appendChild(script);
    }
  }, [hasConsent]);

  return null; // Remove Helmet to fix 'self' error
};

export default GoogleAnalytics;
