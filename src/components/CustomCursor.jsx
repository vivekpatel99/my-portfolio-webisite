import React, { useCallback, useEffect, useRef, useState } from 'react';
import { m, useMotionValue, useSpring } from 'framer-motion';

const cursorSpring = { stiffness: 500, damping: 28 };

const ownCursorClass = (node) => {
  document.documentElement.classList.toggle('custom-cursor-enabled', Boolean(node));
};

const CustomCursor = () => {
  const [enabled, setEnabled] = useState(false);
  const cursorNode = useRef(null);
  const pointerReady = useRef(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, cursorSpring);
  const springY = useSpring(y, cursorSpring);

  const setCursorNode = useCallback((node) => {
    cursorNode.current = node;
    if (!node) ownCursorClass(null);
  }, []);

  useEffect(() => {
    const pointerQuery = window.matchMedia('(pointer: fine)');
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncCursorAvailability = () => {
      const available = pointerQuery.matches && !reducedMotionQuery.matches;

      if (!available) {
        pointerReady.current = false;
        if (cursorNode.current) cursorNode.current.style.visibility = 'hidden';
        ownCursorClass(null);
      }

      setEnabled(available);
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
      pointerReady.current = false;
      ownCursorClass(null);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;

    const handleMouseMove = ({ clientX, clientY }) => {
      const node = cursorNode.current;
      if (!node) return;

      if (!pointerReady.current) {
        x.jump(clientX);
        y.jump(clientY);
        springX.jump(clientX);
        springY.jump(clientY);
        node.style.visibility = 'visible';
        pointerReady.current = true;
        ownCursorClass(node);
        return;
      }

      x.set(clientX);
      y.set(clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [enabled, springX, springY, x, y]);

  if (!enabled) {
    return null;
  }

  return (
    <m.div
      aria-hidden="true"
      data-custom-cursor=""
      ref={setCursorNode}
      style={{
        x: springX,
        y: springY,
        width: 16,
        height: 16,
        marginLeft: -8,
        marginTop: -8,
        visibility: 'hidden',
        backgroundColor: '#9372FF',
        mixBlendMode: 'difference',
      }}
      className="fixed top-0 left-0 rounded-full pointer-events-none z-[10001]"
    />
  );
};

export default CustomCursor;
