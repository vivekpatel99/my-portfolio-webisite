import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const ENTRANCE_OFFSET_PX = 12;

const SectionAnimator = ({ children, className }) => {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      data-section-animator=""
      initial={reduceMotion ? false : { y: ENTRANCE_OFFSET_PX }}
      whileInView={{ y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: reduceMotion ? 0 : 0.4, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default SectionAnimator;
