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

    const focusMainAfterNavigation = () => {
      if (!shouldFocusMain) return undefined;
      // WebKit needs a frame after drawer inert cleanup before main can receive focus.
      const frameId = window.requestAnimationFrame(() => {
        const main = document.getElementById('main-content');
        if ((pathname === '/contact' || pathname === '/contact/')
          && main?.contains(document.activeElement)
          && document.activeElement?.hasAttribute('data-contact-outcome-focus')) return;
        if (!main?.querySelector('[data-route-error]')) focusNavigationTarget(main);
      });
      return () => window.cancelAnimationFrame(frameId);
    };

    if (pathname === '/case-studies' || pathname === '/case-studies/') {
      if (navigationType === 'PUSH') window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      return focusMainAfterNavigation();
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
    return focusMainAfterNavigation();
  }, [pathname, hash, key, navigationType]);

  return null;
};

export default ScrollToTop;
