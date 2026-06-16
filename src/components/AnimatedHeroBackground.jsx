import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { backgrounds } from '@/config/links';

const imageUrl = backgrounds.hero;

const layers = [
  {
    initial: { x: '-5%', y: '-5%', scale: 1.1 },
    animate: { x: '5%', y: '5%' },
    transition: { duration: 20, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' },
    opacity: 0.7,
  },
  {
    initial: { x: '0%', y: '10%', scale: 1.05 },
    animate: { x: '0%', y: '-10%' },
    transition: { duration: 30, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' },
    opacity: 1,
  },
];

const AnimatedHeroBackground = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  if (prefersReducedMotion) {
    return (
      <div 
        className="absolute inset-0 w-full h-full"
        style={{
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.8,
        }}
      />
    );
  }

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      {layers.map((layer, index) => (
        <motion.div
          key={index}
          className="absolute inset-[-10%] w-[120%] h-[120%]"
          initial={layer.initial}
          animate={layer.animate}
          transition={layer.transition}
          style={{
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: layer.opacity,
            willChange: 'transform',
          }}
        />
      ))}
    </div>
  );
};

export default AnimatedHeroBackground;