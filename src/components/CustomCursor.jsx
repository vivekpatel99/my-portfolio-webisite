import React, { useEffect, useState } from 'react';
import useMousePosition from '@/hooks/useMousePosition';
import { motion } from 'framer-motion';

const ownCursorClass = (node) => {
  document.documentElement.classList.toggle('custom-cursor-enabled', Boolean(node));
};

const CustomCursor = () => {
  const [enabled, setEnabled] = useState(false);
  const { x, y } = useMousePosition(enabled);

  useEffect(() => {
    const pointerQuery = window.matchMedia('(pointer: fine)');
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncCursorAvailability = () => {
      setEnabled(pointerQuery.matches && !reducedMotionQuery.matches);
    };

    const addListener = (query) => {
      if (typeof query.addEventListener === 'function') {
        query.addEventListener('change', syncCursorAvailability);
        return;
      }
      query.addListener(syncCursorAvailability);
    };

    const removeListener = (query) => {
      if (typeof query.removeEventListener === 'function') {
        query.removeEventListener('change', syncCursorAvailability);
        return;
      }
      query.removeListener(syncCursorAvailability);
    };

    syncCursorAvailability();
    addListener(pointerQuery);
    addListener(reducedMotionQuery);

    return () => {
      removeListener(pointerQuery);
      removeListener(reducedMotionQuery);
    };
  }, []);

  const variants = {
    default: {
      x: x - 8,
      y: y - 8,
      height: 16,
      width: 16,
      backgroundColor: '#9372FF', // Updated to the new purple
      mixBlendMode: 'difference',
    },
  };

  if (!enabled) {
    return null;
  }

  return (
    <motion.div
      ref={ownCursorClass}
      variants={variants}
      animate="default"
      transition={{ type: "spring", stiffness: 500, damping: 28 }}
      className="fixed top-0 left-0 rounded-full pointer-events-none z-[9999]"
    />
  );
};

export default CustomCursor;
