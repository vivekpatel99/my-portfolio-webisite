import { useEffect, useRef, useState } from 'react';

const canAnimate = () =>
  typeof window !== 'undefined' &&
  typeof window.IntersectionObserver === 'function' &&
  !(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false);

/**
 * Counts from 0 to `target` once the returned ref scrolls into view.
 * Falls back to rendering the final value immediately when
 * IntersectionObserver is unavailable or the user prefers reduced motion.
 */
const useCountUp = (target, { duration = 1400 } = {}) => {
  const ref = useRef(null);
  const [value, setValue] = useState(() => (canAnimate() ? 0 : target));

  useEffect(() => {
    if (!canAnimate()) {
      setValue(target);
      return undefined;
    }

    const node = ref.current;
    if (!node) return undefined;

    let frameId = null;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();

        const start = performance.now();
        const tick = (now) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setValue(Math.round(eased * target));
          if (progress < 1) {
            frameId = requestAnimationFrame(tick);
          }
        };
        frameId = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    observer.observe(node);

    return () => {
      observer.disconnect();
      if (frameId !== null) cancelAnimationFrame(frameId);
    };
  }, [target, duration]);

  return [ref, value];
};

export default useCountUp;
