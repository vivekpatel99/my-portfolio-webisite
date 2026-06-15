import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = decodeURIComponent(hash.slice(1));
      let attempts = 0;
      const intervalId = window.setInterval(() => {
        const target = document.getElementById(id);
        attempts += 1;

        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
          window.clearInterval(intervalId);
        }

        if (attempts >= 20) {
          window.clearInterval(intervalId);
        }
      }, 100);

      return () => window.clearInterval(intervalId);
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    return undefined;
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;
