import React, { useEffect, useState } from 'react';
import useMousePosition from '@/hooks/useMousePosition';
import { motion } from 'framer-motion';

const INTERACTIVE_SELECTOR = 'a, button, [role="button"], input, textarea, select, label[for]';

const CustomCursor = () => {
  const { x, y } = useMousePosition();
  const [enabled, setEnabled] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  useEffect(() => {
    const pointerQuery = window.matchMedia('(pointer: fine)');
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncCursorAvailability = () => {
      const canUseCustomCursor = pointerQuery.matches && !reducedMotionQuery.matches;

      setEnabled(canUseCustomCursor);
      document.documentElement.classList.toggle(
        'custom-cursor-enabled',
        canUseCustomCursor,
      );
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
      document.documentElement.classList.remove('custom-cursor-enabled');
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const handlePointerOver = (event) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      setIsHovering(Boolean(target.closest(INTERACTIVE_SELECTOR)));
    };

    const handlePointerDown = () => setIsPressed(true);
    const handlePointerUp = () => setIsPressed(false);

    document.addEventListener('mouseover', handlePointerOver);
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('mouseup', handlePointerUp);

    return () => {
      document.removeEventListener('mouseover', handlePointerOver);
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('mouseup', handlePointerUp);
    };
  }, [enabled]);

  const size = isPressed ? 12 : isHovering ? 40 : 16;
  const ringOpacity = isHovering ? 1 : 0;

  if (!enabled) {
    return null;
  }

  return (
    <motion.div
      className="fixed top-0 left-0 pointer-events-none z-[9999]"
      animate={{
        x: x - size / 2,
        y: y - size / 2,
        width: size,
        height: size,
      }}
      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
    >
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={{
          backgroundColor: isHovering ? 'rgba(147, 114, 255, 0.25)' : '#9372FF',
          mixBlendMode: isHovering ? 'normal' : 'difference',
        }}
        transition={{ duration: 0.15 }}
      />
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-[#D4B4FF]"
        animate={{
          opacity: ringOpacity,
          scale: isHovering ? 1 : 0.8,
        }}
        transition={{ duration: 0.2 }}
      />
    </motion.div>
  );
};

export default CustomCursor;
