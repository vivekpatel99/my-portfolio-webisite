import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

const easeOutQuart = (t) => 1 - (1 - t) ** 4;

const useCountUp = (target, { duration = 1500, enabled = true, decimals = 0 } = {}) => {
  const shouldReduceMotion = useReducedMotion();
  const [value, setValue] = useState(shouldReduceMotion ? target : 0);
  const frameRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    if (shouldReduceMotion) {
      setValue(target);
      return undefined;
    }

    startTimeRef.current = null;

    const animate = (timestamp) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuart(progress);
      const nextValue = easedProgress * target;

      setValue(decimals > 0 ? Number(nextValue.toFixed(decimals)) : Math.round(nextValue));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [target, duration, enabled, shouldReduceMotion, decimals]);

  return value;
};

export default useCountUp;
