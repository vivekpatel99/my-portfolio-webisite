import React from 'react';
import { motion, useReducedMotion, useScroll, useSpring } from 'framer-motion';

const ScrollProgressBar = () => {
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  if (shouldReduceMotion) {
    return null;
  }

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-[10000] h-[2px] origin-left bg-gradient-to-r from-[#D4B4FF] via-[#9372FF] to-[#7C3AED]"
      style={{ scaleX }}
      aria-hidden="true"
    />
  );
};

export default ScrollProgressBar;
