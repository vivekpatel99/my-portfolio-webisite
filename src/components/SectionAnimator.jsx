import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const contentVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: 'easeOut' },
  },
};

const reducedContentVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } },
};

const scanlineVariants = {
  hidden: { top: '0%', opacity: 0 },
  visible: {
    top: ['0%', '100%'],
    opacity: [0, 0.9, 0.9, 0],
    transition: { duration: 1.1, ease: 'easeInOut' },
  },
};

const SectionAnimator = ({ children, className }) => {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      className={`relative ${className ?? ''}`.trim()}
    >
      <motion.div variants={reduceMotion ? reducedContentVariants : contentVariants}>
        {children}
      </motion.div>
      {!reduceMotion && (
        <motion.div
          aria-hidden="true"
          variants={scanlineVariants}
          className="pointer-events-none absolute inset-x-0 z-10 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(147, 114, 255, 0.85) 20%, rgba(212, 180, 255, 0.95) 50%, rgba(147, 114, 255, 0.85) 80%, transparent)',
            boxShadow: '0 0 12px 1px rgba(124, 58, 237, 0.55)',
          }}
        />
      )}
    </motion.div>
  );
};

export default SectionAnimator;
