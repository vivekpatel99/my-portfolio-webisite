import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

const useFinePointer = () => {
  const shouldReduceMotion = useReducedMotion();
  const [hasFinePointer, setHasFinePointer] = useState(false);

  useEffect(() => {
    const pointerQuery = window.matchMedia('(pointer: fine)');

    const syncPointer = () => {
      setHasFinePointer(pointerQuery.matches && !shouldReduceMotion);
    };

    syncPointer();

    if (typeof pointerQuery.addEventListener === 'function') {
      pointerQuery.addEventListener('change', syncPointer);
      return () => pointerQuery.removeEventListener('change', syncPointer);
    }

    pointerQuery.addListener(syncPointer);
    return () => pointerQuery.removeListener(syncPointer);
  }, [shouldReduceMotion]);

  return hasFinePointer;
};

export default useFinePointer;
