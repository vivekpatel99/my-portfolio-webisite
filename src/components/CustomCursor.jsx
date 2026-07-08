import React, { useEffect, useState } from 'react';
import useMousePosition from '@/hooks/useMousePosition';
import { motion } from 'framer-motion';

const INTERACTIVE_SELECTOR =
  'a, button, [role="button"], input, select, textarea, summary, [data-cursor-target]';

const IDLE_FRAME_SIZE = 36;
const FRAME_PADDING = 6;

const bracketBase = 'absolute h-3 w-3 border-[#9372FF]';

const CustomCursor = () => {
  const { x, y } = useMousePosition();
  const [enabled, setEnabled] = useState(false);
  const [hoverTarget, setHoverTarget] = useState(null);

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
      setHoverTarget(null);
      return undefined;
    }

    const handleMouseOver = (event) => {
      const element =
        event.target instanceof Element
          ? event.target.closest(INTERACTIVE_SELECTOR)
          : null;
      setHoverTarget(element);
    };
    // Element rects go stale while scrolling; release the snap until the next hover.
    const clearTarget = () => setHoverTarget(null);

    document.addEventListener('mouseover', handleMouseOver);
    window.addEventListener('scroll', clearTarget, true);

    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
      window.removeEventListener('scroll', clearTarget, true);
    };
  }, [enabled]);

  if (!enabled) {
    return null;
  }

  const snapped = Boolean(hoverTarget && hoverTarget.isConnected);
  let frame = {
    x: x - IDLE_FRAME_SIZE / 2,
    y: y - IDLE_FRAME_SIZE / 2,
    width: IDLE_FRAME_SIZE,
    height: IDLE_FRAME_SIZE,
  };
  if (snapped) {
    const rect = hoverTarget.getBoundingClientRect();
    frame = {
      x: rect.left - FRAME_PADDING,
      y: rect.top - FRAME_PADDING,
      width: rect.width + FRAME_PADDING * 2,
      height: rect.height + FRAME_PADDING * 2,
    };
  }

  return (
    <>
      <motion.div
        aria-hidden="true"
        animate={{ ...frame, opacity: snapped ? 1 : 0.75 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="fixed top-0 left-0 pointer-events-none z-[9999]"
        style={{ mixBlendMode: 'difference' }}
      >
        <span className={`${bracketBase} left-0 top-0 border-l-2 border-t-2`} />
        <span className={`${bracketBase} right-0 top-0 border-r-2 border-t-2`} />
        <span className={`${bracketBase} left-0 bottom-0 border-l-2 border-b-2`} />
        <span className={`${bracketBase} right-0 bottom-0 border-r-2 border-b-2`} />
      </motion.div>
      <motion.div
        aria-hidden="true"
        animate={{ x: x - 4, y: y - 4 }}
        transition={{ type: 'spring', stiffness: 800, damping: 40 }}
        className="fixed top-0 left-0 h-2 w-2 rounded-full bg-[#9372FF] pointer-events-none z-[9999]"
        style={{ mixBlendMode: 'difference' }}
      />
    </>
  );
};

export default CustomCursor;
