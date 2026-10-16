import React from 'react';
import { m, useReducedMotion } from 'framer-motion';

const ENTRANCE_OFFSET_PX = 12;

const SectionAnimator = ({ children, className }) => {
  const reduceMotion = useReducedMotion();
  const animateEntrance = typeof window !== 'undefined' && !reduceMotion;

  return (
    <m.div
      data-section-animator=""
      initial={animateEntrance ? { y: ENTRANCE_OFFSET_PX } : false}
      whileInView={{ y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: animateEntrance ? 0.4 : 0, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </m.div>
  );
};

export default SectionAnimator;
