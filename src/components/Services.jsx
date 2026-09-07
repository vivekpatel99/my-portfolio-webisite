import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { positioning, serviceOffers } from '@/data/positioning';

const Services = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const toggle = (index) => setActiveIndex(activeIndex === index ? null : index);

  return <section id="services" className="bg-[#0C0D0D] py-24">
    <div className="container relative z-10 mx-auto px-6">
      <div className="mb-16">
        <h2 className="mb-6 text-4xl font-bold uppercase leading-tight text-white md:text-6xl lg:text-7xl">SERVICE <span className="text-accent-purple">FOCUS</span></h2>
        <p className="max-w-3xl text-xl text-gray-300 md:text-2xl">{positioning.primaryFocus}</p>
        <p className="mt-5 max-w-3xl text-base text-gray-400">{positioning.fit}</p>
        <div className="mt-6 max-w-3xl rounded-lg border border-white/10 bg-white/[0.04] p-5">
          <h3 className="text-lg font-bold text-white">Not the right fit</h3>
          <p className="mt-2 text-sm leading-relaxed text-gray-400">I do not promise guaranteed accuracy or savings, or fully autonomous high-stakes decisions. For open-ended research, bring data access and clear success criteria first so we can decide whether there is a defined workflow to build.</p>
        </div>
      </div>
      <div className="border-t border-gray-800">
        {serviceOffers.map((service, index) => <div key={service.title} className="border-b border-gray-800">
          <div className="group flex cursor-pointer items-center justify-between py-8" onClick={() => toggle(index)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggle(index); } }} role="button" tabIndex={0} aria-expanded={activeIndex === index} aria-controls={`service-content-${index}`}>
            <div className="flex items-center gap-4"><h3 className={`break-words text-xl font-bold transition-colors duration-300 sm:text-2xl md:text-5xl ${activeIndex === index ? 'text-white' : 'text-gray-600 group-hover:text-gray-400'}`}>{service.title}</h3>{activeIndex === index && <motion.div className="h-4 w-4 rounded-full bg-accent-purple" initial={{ scale: 0 }} animate={{ scale: 1 }} />}</div>
            <motion.div className="text-accent-purple" animate={{ rotate: activeIndex === index ? 45 : 0 }} transition={{ duration: 0.3 }}><Plus size={40} className={`${activeIndex === index ? 'text-accent-purple' : 'text-gray-600 group-hover:text-gray-400'} transition-colors`} /></motion.div>
          </div>
          <AnimatePresence>{activeIndex === index && <motion.div id={`service-content-${index}`} initial={{ opacity: 0, height: 0, y: -20 }} animate={{ opacity: 1, height: 'auto', y: 0 }} exit={{ opacity: 0, height: 0, y: -20 }} transition={{ duration: 0.4, ease: 'easeInOut' }} className="overflow-hidden"><div className="pb-8 pr-4 sm:pr-8 md:pr-16"><p className="max-w-2xl text-lg text-gray-400">{service.description}</p></div></motion.div>}</AnimatePresence>
        </div>)}
      </div>
    </div>
  </section>;
};

export default Services;
