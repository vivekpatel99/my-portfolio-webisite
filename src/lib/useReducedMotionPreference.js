import { useSyncExternalStore } from 'react';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

// Without matchMedia (prerender, very old engines) there is no preference to
// honor, so entrances keep normal motion, like Framer Motion's own fallback.
function getReducedMotionQuery() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null;
  return window.matchMedia(REDUCED_MOTION_QUERY);
}

function subscribe(onChange) {
  const query = getReducedMotionQuery();
  if (!query) return () => {};
  if (typeof query.addEventListener === 'function') {
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }
  // Pre-Safari-14 MediaQueryList only has the deprecated listener API.
  query.addListener(onChange);
  return () => query.removeListener(onChange);
}

const getSnapshot = () => getReducedMotionQuery()?.matches ?? false;
const getServerSnapshot = () => false;

// Framer Motion 10's useReducedMotion reads the preference once per mount.
// This re-renders mounted components when the OS preference changes.
export function useReducedMotionPreference() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
