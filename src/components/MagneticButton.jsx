import React, { useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import useFinePointer from '@/hooks/useFinePointer';

const MAX_OFFSET = 20;

const MagneticButton = ({ children, className = '', strength = 0.35 }) => {
  const shouldReduceMotion = useReducedMotion();
  const hasFinePointer = useFinePointer();
  const ref = useRef(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const isMagnetic = hasFinePointer && !shouldReduceMotion;

  const handleMouseMove = (event) => {
    if (!isMagnetic || !ref.current) {
      return;
    }

    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = (event.clientX - centerX) * strength;
    const deltaY = (event.clientY - centerY) * strength;

    setOffset({
      x: Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, deltaX)),
      y: Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, deltaY)),
    });
  };

  const handleMouseLeave = () => {
    setOffset({ x: 0, y: 0 });
  };

  return (
    <motion.div
      ref={ref}
      className={`inline-flex ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={isMagnetic ? offset : { x: 0, y: 0 }}
      transition={{ type: 'spring', stiffness: 350, damping: 20, mass: 0.4 }}
    >
      {React.cloneElement(React.Children.only(children))}
    </motion.div>
  );
};

export default MagneticButton;
