import { useState, useEffect, useRef, useCallback } from 'react';

const useMousePosition = (enabled = true) => {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const frameRef = useRef(null);
  const latestPosition = useRef({ x: -100, y: -100 });

  const updatePosition = useCallback(() => {
    setPosition(latestPosition.current);
    frameRef.current = null;
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;

    const handleMouseMove = (e) => {
      latestPosition.current = { x: e.clientX, y: e.clientY };

      // Throttle updates to 60fps using requestAnimationFrame
      if (frameRef.current === null) {
        frameRef.current = requestAnimationFrame(updatePosition);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [enabled, updatePosition]);

  return position;
};

export default useMousePosition;
