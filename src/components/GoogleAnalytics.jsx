import { useEffect } from 'react';

const GA_TRACKING_ID = 'G-7E37RV2DDN';

const GoogleAnalytics = ({ hasConsent }) => {
  useEffect(() => {
    // Only load if consent is given
    if (!hasConsent) {
      return;
    }

    if (process.env.NODE_ENV !== 'production' || window.location.hostname === 'localhost') {
      return;
    }

    if (window.gtag) {
      return;
    }

    const script1 = document.createElement('script');
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`;
    script1.async = true;
    document.head.appendChild(script1);

    const script2 = document.createElement('script');
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${GA_TRACKING_ID}');
    `;
    document.head.appendChild(script2);
  }, [hasConsent]);

  return null; // Remove Helmet to fix 'self' error
};

export default GoogleAnalytics;
