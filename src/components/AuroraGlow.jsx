import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const blobs = [
  {
    className: 'top-[-20%] left-[-10%] h-[55%] w-[55%] bg-[#7C3AED]/35',
    animate: { x: [0, 60, -30, 0], y: [0, 40, -20, 0], scale: [1, 1.08, 0.95, 1] },
    transition: { duration: 18, repeat: Infinity, ease: 'easeInOut' },
  },
  {
    className: 'top-[10%] right-[-15%] h-[50%] w-[45%] bg-[#9372FF]/30',
    animate: { x: [0, -50, 30, 0], y: [0, -35, 25, 0], scale: [1, 0.92, 1.06, 1] },
    transition: { duration: 22, repeat: Infinity, ease: 'easeInOut' },
  },
  {
    className: 'bottom-[-15%] left-[20%] h-[45%] w-[50%] bg-[#5B21B6]/25',
    animate: { x: [0, 40, -40, 0], y: [0, -30, 20, 0], scale: [1, 1.05, 0.98, 1] },
    transition: { duration: 26, repeat: Infinity, ease: 'easeInOut' },
  },
];

const AuroraGlow = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {blobs.map((blob, index) => (
        <motion.div
          key={index}
          className={`absolute rounded-full blur-[100px] ${blob.className}`}
          initial={false}
          animate={shouldReduceMotion ? undefined : blob.animate}
          transition={shouldReduceMotion ? undefined : blob.transition}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-[#7C3AED]/10 via-transparent to-[#0C0D0D]/80" />
    </div>
  );
};

export default AuroraGlow;
