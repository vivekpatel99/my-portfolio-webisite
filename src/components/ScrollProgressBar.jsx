import React from 'react';
import { motion, useReducedMotion, useScroll, useSpring } from 'framer-motion';

const ScrollProgressBar = () => {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 160,
    damping: 28,
    mass: 0.4,
  });

  return (
    <motion.div
      aria-hidden="true"
      className="fixed inset-x-0 top-0 z-[60] h-[2px] origin-left"
      style={{
        scaleX: reduceMotion ? scrollYProgress : smoothProgress,
        background: 'linear-gradient(90deg, #7C3AED, #9372FF, #D4B4FF)',
      }}
    />
  );
};

export default ScrollProgressBar;
