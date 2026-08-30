import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const GA_TRACKING_ID = import.meta.env.VITE_GA_TRACKING_ID?.trim();
const GA_SCRIPT_ID = 'google-analytics-gtag';

const isLocalHostname = (hostname) => hostname === 'localhost' || hostname === '127.0.0.1';

const expireCookie = (name) => {
  const hostname = window.location.hostname;
  const rootDomain = hostname.replace(/^www\./, '');
  const domains = ['', hostname, `.${rootDomain}`];
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';

  domains.forEach((domain) => {
    const domainPart = domain ? `; domain=${domain}` : '';
    document.cookie = `${name}=; Max-Age=0; path=/${domainPart}; SameSite=Lax${secure}`;
  });
};

const gaCookieNames = () => {
  if (!GA_TRACKING_ID) {
    return ['_ga', '_gid', '_gat'];
  }
  return ['_ga', '_gid', '_gat', `_ga_${GA_TRACKING_ID.replace('G-', '')}`];
};

const disableGoogleAnalytics = () => {
  if (GA_TRACKING_ID) {
    window[`ga-disable-${GA_TRACKING_ID}`] = true;
  }

  if (typeof window.gtag === 'function') {
    window.gtag('consent', 'update', {
      analytics_storage: 'denied',
    });
  }

  document.getElementById(GA_SCRIPT_ID)?.remove();
  gaCookieNames().forEach(expireCookie);

  window.gtag = undefined;
};

const GoogleAnalytics = ({ hasConsent }) => {
  const location = useLocation();

  useEffect(() => {
    if (!hasConsent || !GA_TRACKING_ID) {
      disableGoogleAnalytics();
      return;
    }

    if (process.env.NODE_ENV !== 'production' || isLocalHostname(window.location.hostname)) {
      return;
    }

    window[`ga-disable-${GA_TRACKING_ID}`] = false;

    if (typeof window.gtag === 'function') {
      return;
    }

    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
    window.gtag('consent', 'update', {
      analytics_storage: 'granted',
    });
    window.gtag('js', new Date());

    if (!document.getElementById(GA_SCRIPT_ID)) {
      const script = document.createElement('script');
      script.id = GA_SCRIPT_ID;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`;
      script.async = true;
      document.head.appendChild(script);
    }
  }, [hasConsent]);

  useEffect(() => {
    if (!hasConsent || !GA_TRACKING_ID || typeof window.gtag !== 'function') {
      return;
    }
    if (process.env.NODE_ENV !== 'production' || isLocalHostname(window.location.hostname)) {
      return;
    }

    window.gtag('config', GA_TRACKING_ID, {
      page_path: `${location.pathname}${location.search}${location.hash}`,
    });
  }, [hasConsent, location.pathname, location.search, location.hash]);

  return null;
};

export default GoogleAnalytics;
