import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import ParticleConstellation from '@/components/ParticleConstellation';
import { socialLinks } from '@/config/links';

const KineticLine = ({ text, className = '', wordClassName = '', baseDelay = 0, reduceMotion }) => {
  if (reduceMotion) {
    return <span className={`${className} ${wordClassName}`.trim()}>{text}</span>;
  }

  const words = text.split(' ');
  return (
    <span className={className}>
      {words.map((word, index) => (
        <span key={`${word}-${index}`} className="inline-block whitespace-pre">
          <motion.span
            className={`inline-block will-change-transform ${wordClassName}`.trim()}
            initial={{ y: '0.6em', opacity: 0, filter: 'blur(8px)' }}
            animate={{ y: '0em', opacity: 1, filter: 'blur(0px)' }}
            transition={{
              duration: 0.7,
              delay: baseDelay + index * 0.07,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {word}
          </motion.span>
          {index < words.length - 1 ? ' ' : null}
        </span>
      ))}
    </span>
  );
};

const Hero = () => {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const handleCTAClick = () => {
    navigate('/contact');
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 bg-[#0C0D0D]">
      <div className="absolute inset-0 cv-grid" aria-hidden="true"></div>
      <div className="absolute inset-0" aria-hidden="true">
        <ParticleConstellation />
      </div>
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.12),transparent_65%)]"
        aria-hidden="true"
      ></div>
      <div className="absolute inset-0 bg-black/40"></div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-5xl mx-auto text-left md:text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent-purple/10 border border-accent-purple/20 rounded-full mb-8"
          >
            <Sparkles className="w-4 h-4 text-accent-purple" />
            <a
              href={socialLinks.upwork}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View Vivek Patel's Top Rated Plus profile on Upwork"
              className="flex items-center gap-2 text-[#c5b8ff] hover:text-white transition-colors cursor-pointer"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path d="M18.561 13.158c-1.102 0-2.135-.467-3.074-1.227l.228-1.076.008-.042c.207-1.143.849-3.06 2.839-3.06 1.492 0 2.703 1.212 2.703 2.703 0 1.489-1.211 2.702-2.704 2.702zm0-8.14c-2.539 0-4.51 1.649-5.31 4.366-1.22-1.834-2.148-4.036-2.687-5.892H7.828v7.112c-.002 1.406-1.141 2.546-2.547 2.548-1.405-.002-2.543-1.143-2.545-2.548V3.492H0v7.112c0 2.914 2.37 5.303 5.281 5.303 2.913 0 5.283-2.389 5.283-5.303v-1.19c.529 1.107 1.182 2.229 1.974 3.221l-1.673 7.873h2.797l1.213-5.71c1.063.679 2.285 1.109 3.686 1.109 3 0 5.439-2.452 5.439-5.45 0-3-2.439-5.439-5.439-5.439z" />
              </svg>
              <span className="text-sm uppercase">Top Rated Plus Freelancer on Upwork</span>
            </a>
          </motion.div>

          <h1
            className="glitch-hover text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight text-white uppercase break-words"
            aria-label="Vivek Patel Computer Vision & AI Engineer"
          >
            <span aria-hidden="true">
              <KineticLine text="Vivek Patel" baseDelay={0.2} reduceMotion={reduceMotion} />
              <KineticLine
                text="Computer Vision & AI Engineer"
                className="block"
                wordClassName="text-gradient"
                baseDelay={0.4}
                reduceMotion={reduceMotion}
              />
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto"
          >
            Spending 40+ hours a week on manual data processing? I build production-ready data extraction, Computer Vision, and AI workflow systems that replace repetitive work with reliable automation.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            className="text-sm text-gray-500 mb-6"
          >
            Work directly with me—no account managers, no handoffs.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-col items-center gap-3 mb-10"
          >
            <div className="inline-flex items-center gap-4 px-5 py-2.5 bg-white/5 border border-white/10 rounded-full">
              <span className="text-accent-purple font-semibold">Starting at €80/hour</span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-300">Based in Europe</span>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-green-400 text-sm">Limited availability — currently accepting 1-2 new projects</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-start md:justify-center"
          >
            <Button
              onClick={handleCTAClick}
              size="lg"
              className="bg-accent-purple hover:bg-accent-purple/90 text-white font-bold px-8 py-6 text-lg rounded-full group"
            >
              Request a Project Estimate
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-2 border-accent-purple/40 hover:bg-accent-purple/10 text-white px-8 py-6 text-lg rounded-full"
            >
              <a href="#portfolio">
                View Case Studies
              </a>
            </Button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mt-8 text-gray-400 text-sm italic"
          >
            "Very high quality work. Great communication. High quality code." — Duncan H., Upwork Client
          </motion.p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2 hidden md:block"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-10 border-2 border-accent-purple/40 rounded-full flex items-start justify-center p-2"
        >
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-1.5 h-1.5 bg-accent-purple rounded-full"
          />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Hero;
