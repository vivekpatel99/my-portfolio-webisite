import React, { lazy, Suspense, useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import AnimatedHeroBackground from '@/components/AnimatedHeroBackground';
import { isWebGLSupported } from '@/lib/webgl';

const LazyHeroParticleScene = lazy(() => import('@/components/three/HeroParticleScene'));
const MOBILE_MEDIA_QUERY = '(max-width: 768px)';

const InteractiveHeroBackground = () => {
  const shouldReduceMotion = useReducedMotion();
  const [isWebglAvailable, setIsWebglAvailable] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (shouldReduceMotion || typeof window === 'undefined') {
      return undefined;
    }

    const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY);
    const syncViewport = () => setIsMobile(mediaQuery.matches);
    syncViewport();
    setIsWebglAvailable(isWebGLSupported());

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', syncViewport);
      return () => mediaQuery.removeEventListener('change', syncViewport);
    }

    mediaQuery.addListener(syncViewport);
    return () => mediaQuery.removeListener(syncViewport);
  }, [shouldReduceMotion]);

  if (shouldReduceMotion || !isWebglAvailable) {
    return <AnimatedHeroBackground />;
  }

  return (
    <Suspense fallback={<AnimatedHeroBackground />}>
      <LazyHeroParticleScene
        particleCount={isMobile ? 1100 : 2600}
        nodeCount={isMobile ? 80 : 140}
      />
    </Suspense>
  );
};

export default InteractiveHeroBackground;
