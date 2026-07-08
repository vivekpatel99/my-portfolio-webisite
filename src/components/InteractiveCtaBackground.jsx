import React, { lazy, Suspense, useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import AnimatedCtaBackground from '@/components/AnimatedCtaBackground';
import { isWebGLSupported } from '@/lib/webgl';

const LazyCtaAccentScene = lazy(() => import('@/components/three/CtaAccentScene'));

const InteractiveCtaBackground = () => {
  const shouldReduceMotion = useReducedMotion();
  const [isWebglAvailable, setIsWebglAvailable] = useState(false);

  useEffect(() => {
    if (shouldReduceMotion || typeof window === 'undefined') {
      return;
    }

    setIsWebglAvailable(isWebGLSupported());
  }, [shouldReduceMotion]);

  if (shouldReduceMotion || !isWebglAvailable) {
    return <AnimatedCtaBackground />;
  }

  return (
    <Suspense fallback={<AnimatedCtaBackground />}>
      <LazyCtaAccentScene />
    </Suspense>
  );
};

export default InteractiveCtaBackground;
