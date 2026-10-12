import { useReducedMotionPreference } from '@/lib/useReducedMotionPreference';

const PAGE_ENTRANCE_OFFSET_PX = 20;

const pageTransition = { type: 'tween', ease: 'anticipate', duration: 0.5 };

const pageVariants = {
  initial: { opacity: 0, y: PAGE_ENTRANCE_OFFSET_PX },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -PAGE_ENTRANCE_OFFSET_PX },
};

const reducedMotionPageVariants = {
  initial: { opacity: 0, y: 0 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: 0 },
};

export function usePageMotion() {
  const reduceMotion = useReducedMotionPreference();
  return {
    initial: 'initial',
    animate: 'in',
    exit: 'out',
    variants: reduceMotion ? reducedMotionPageVariants : pageVariants,
    transition: pageTransition,
  };
}
