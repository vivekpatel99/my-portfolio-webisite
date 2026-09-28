import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import { focusNavigationTarget } from '@/lib/focusTarget';

const prefersReducedMotion = () =>
  typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const ScrollToTop = () => {
  const { pathname, hash, key } = useLocation();
  const navigationType = useNavigationType();
  const isInitialRenderRef = useRef(true);

  useEffect(() => {
    // Leave focus at the document start on first load without a hash.
    const shouldFocusMain = !isInitialRenderRef.current;
    isInitialRenderRef.current = false;

    if (pathname === '/case-studies' || pathname === '/case-studies/') {
      if (navigationType === 'PUSH') window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      if (shouldFocusMain) focusNavigationTarget(document.getElementById('main-content'));
      return undefined;
    }
    if (hash) {
      const id = decodeURIComponent(hash.slice(1));
      let attempts = 0;
      const intervalId = window.setInterval(() => {
        const target = document.getElementById(id);
        attempts += 1;

        if (target) {
          target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
          focusNavigationTarget(target);
          window.clearInterval(intervalId);
        }

        if (attempts >= 20) {
          window.clearInterval(intervalId);
        }
      }, 100);

      return () => window.clearInterval(intervalId);
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    if (shouldFocusMain) focusNavigationTarget(document.getElementById('main-content'));
    return undefined;
  }, [pathname, hash, key, navigationType]);

  return null;
};

export default ScrollToTop;
