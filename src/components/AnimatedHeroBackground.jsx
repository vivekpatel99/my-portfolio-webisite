import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { backgrounds } from '@/config/links';

const imageUrl = backgrounds.hero;

const AnimatedHeroBackground = () => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <img
          src={imageUrl}
          alt=""
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      <motion.img
        src={imageUrl}
        alt=""
        fetchPriority="high"
        decoding="async"
        className="absolute inset-[-5%] w-[110%] h-[110%] object-cover"
        initial={{ x: '-3%', y: '-3%', scale: 1.05 }}
        animate={{ x: '3%', y: '3%' }}
        transition={{
          duration: 25,
          repeat: Infinity,
          repeatType: 'mirror',
          ease: 'easeInOut',
        }}
        style={{ willChange: 'transform' }}
      />
    </div>
  );
};

export default AnimatedHeroBackground;
