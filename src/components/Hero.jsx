import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import AnimatedHeroBackground from '@/components/AnimatedHeroBackground';
import { approvedProof, positioning } from '@/data/positioning';

const Hero = () => {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const reveal = (delay) => ({ initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.8, delay } });

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-20">
      <AnimatedHeroBackground />
      <div className="absolute inset-0 bg-black/40" />
      <div className="container relative z-10 mx-auto px-6">
        <div className="mx-auto max-w-5xl text-left md:text-center">
          <motion.a {...reveal(0)} href={approvedProof.upwork.href} target="_blank" rel="noopener noreferrer" className="mb-8 inline-flex items-center gap-2 rounded-full border border-accent-purple/20 bg-accent-purple/10 px-4 py-2 text-[#c5b8ff] transition-colors hover:text-white">
            <Sparkles className="h-4 w-4 text-accent-purple" aria-hidden="true" />
            <span className="text-sm uppercase">Top Rated Plus on Upwork — checked 6 September 2026</span>
          </motion.a>
          <motion.h1 {...reveal(0.2)} className="mb-6 break-words text-4xl font-bold uppercase leading-tight text-white sm:text-5xl md:text-7xl lg:text-8xl">
            Vivek Patel
            <span className="block text-accent-purple">{positioning.role}</span>
          </motion.h1>
          <motion.p {...reveal(0.4)} className="mx-auto mb-6 max-w-3xl text-xl text-gray-300 md:text-2xl">{positioning.promise}</motion.p>
          <motion.p {...reveal(0.45)} className="mx-auto mb-10 max-w-3xl text-sm text-gray-400">{positioning.primaryFocus}</motion.p>
          <motion.div {...reveal(0.6)} className="flex flex-col justify-start gap-4 sm:flex-row md:justify-center">
            <Button onClick={() => navigate('/contact/')} size="lg" className="group rounded-full bg-accent-purple px-8 py-6 text-lg font-bold text-white hover:bg-accent-purple/90">
              Discuss your workflow
              <ArrowRight className="ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full border-2 border-accent-purple/40 px-8 py-6 text-lg text-white hover:bg-accent-purple/10">
              <a href="#portfolio">View case studies</a>
            </Button>
          </motion.div>
        </div>
      </div>
      {!reduceMotion && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 1 }} className="absolute bottom-10 left-1/2 hidden -translate-x-1/2 md:block"><motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity }} className="flex h-10 w-6 items-start justify-center rounded-full border-2 border-accent-purple/40 p-2"><motion.div animate={{ y: [0, 12, 0] }} transition={{ duration: 2, repeat: Infinity }} className="h-1.5 w-1.5 rounded-full bg-accent-purple" /></motion.div></motion.div>}
    </section>
  );
};

export default Hero;
