import { motion } from 'framer-motion';
import { backgrounds } from '@/config/links';

const imageUrl = backgrounds.cta;

const layers = [
  {
    initial: { x: '-5%', y: '5%', scale: 1.15 },
    animate: { x: '5%', y: '-5%' },
    transition: { duration: 22, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' },
    opacity: 0.7,
  },
  {
    initial: { x: '5%', y: '-5%', scale: 1.25 },
    animate: { x: '-5%', y: '5%' },
    transition: { duration: 28, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' },
    opacity: 0.5,
  },
  {
    initial: { x: '2%', y: '-8%', scale: 1.1 },
    animate: { x: '-2%', y: '8%' },
    transition: { duration: 35, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' },
    opacity: 1,
  },
];

const AnimatedCtaBackground = () => {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      {layers.map((layer, index) => (
        <motion.div
          key={index}
          className="absolute inset-[-15%] w-[130%] h-[130%]"
          initial={layer.initial}
          animate={layer.animate}
          transition={layer.transition}
          style={{
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: layer.opacity,
          }}
        />
      ))}
    </div>
  );
};

export default AnimatedCtaBackground;
