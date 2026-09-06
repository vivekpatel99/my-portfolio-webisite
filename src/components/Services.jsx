import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { positioning, serviceOffers } from '@/data/positioning';

const Services = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const reduceMotion = useReducedMotion();
  const toggle = (index) => setActiveIndex(activeIndex === index ? null : index);

  return (
    <section id="services" className="bg-[#0C0D0D] py-24" aria-labelledby="services-heading">
      <div className="container relative z-10 mx-auto px-6">
        <div className="mb-16">
          <h2 id="services-heading" className="mb-6 text-4xl font-bold uppercase leading-tight text-white md:text-6xl lg:text-7xl">SERVICE <span className="text-accent-purple">FOCUS</span></h2>
          <p className="max-w-3xl text-xl text-gray-300 md:text-2xl">{positioning.primaryFocus}</p>
          <p className="mt-5 max-w-3xl text-base text-gray-400">{positioning.fit}</p>
          <div className="mt-6 max-w-3xl rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <h3 className="text-lg font-bold text-white">Not the right fit</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-400">I do not promise guaranteed accuracy or savings, or fully autonomous high-stakes decisions. For open-ended research, bring data access and clear success criteria first so we can decide whether there is a defined workflow to build.</p>
          </div>
        </div>
        <div className="border-t border-gray-800">
          {serviceOffers.map((service, index) => {
            const isActive = activeIndex === index;
            return (
              <div key={service.title} className="border-b border-gray-800">
                <button type="button" className="group flex w-full items-center justify-between py-8 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-purple focus-visible:ring-offset-4 focus-visible:ring-offset-[#0C0D0D]" onClick={() => toggle(index)} aria-expanded={isActive} aria-controls={`service-content-${index}`}>
                  <span className="flex items-center gap-4"><span className={`break-words text-xl font-bold transition-colors duration-300 sm:text-2xl md:text-5xl ${isActive ? 'text-white' : 'text-gray-600 group-hover:text-gray-400'}`}>{service.title}</span>{isActive && <motion.span className="h-4 w-4 rounded-full bg-accent-purple" initial={reduceMotion ? false : { scale: 0 }} animate={{ scale: 1 }} />}</span>
                  <motion.span className="text-accent-purple" animate={{ rotate: isActive ? 45 : 0 }} transition={{ duration: reduceMotion ? 0 : 0.3 }}><Plus size={40} className={`${isActive ? 'text-accent-purple' : 'text-gray-600 group-hover:text-gray-400'} transition-colors`} aria-hidden="true" /></motion.span>
                </button>
                <AnimatePresence initial={false}>{isActive && <motion.div id={`service-content-${index}`} initial={reduceMotion ? false : { opacity: 0, height: 0, y: -20 }} animate={{ opacity: 1, height: 'auto', y: 0 }} exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0, y: -20 }} transition={{ duration: reduceMotion ? 0 : 0.4, ease: 'easeInOut' }} className="overflow-hidden"><div className="pb-8 pr-4 sm:pr-8 md:pr-16"><p className="max-w-2xl text-lg text-gray-400">{service.description}</p></div></motion.div>}</AnimatePresence>
              </div>
            );
          })}
        </div>
        <Link to="/#portfolio" className="mt-10 inline-flex text-sm font-semibold text-[#d8caff] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-purple">Browse Case Studies</Link>
      </div>
    </section>
  );
};

export default Services;
