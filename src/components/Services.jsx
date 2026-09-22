import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import {
  HOURLY_FROM_LABEL,
  serviceOffers,
  typicalDurationLabel,
} from '@/data/serviceOffers';

const Services = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const handleServiceClick = index => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return <section id="services" className="py-24 bg-[#0C0D0D]">
    <div className="container mx-auto px-6 relative z-10">
      <div className="mb-16">
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight text-white uppercase">
          SERVICE <span className="text-accent-purple">OFFERS</span>
        </h2>
        <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mt-4">
          Hourly engagements, {HOURLY_FROM_LABEL}. Each offer lists typical duration and what is in or out of scope. Estimates go through the contact form.
        </p>
      </div>

      <div className="border-t border-gray-800">
        {serviceOffers.map((service, index) => <div key={service.id} className="border-b border-gray-800">
          <div
            className="flex justify-between items-center cursor-pointer py-8 group gap-4"
            onClick={() => handleServiceClick(index)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleServiceClick(index);
              }
            }}
            role="button"
            tabIndex={0}
            aria-expanded={activeIndex === index}
            aria-controls={`service-content-${service.id}`}
          >
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <h3 className={`text-xl sm:text-2xl md:text-5xl font-bold transition-colors duration-300 break-words ${activeIndex === index ? 'text-white' : 'text-gray-400'}`}>
                {service.title}
              </h3>
              {activeIndex === index && <motion.div className="w-4 h-4 shrink-0 bg-accent-purple rounded-full" initial={{
                scale: 0
              }} animate={{
                scale: 1
              }} />}
            </div>

            <motion.div className="text-accent-purple shrink-0" animate={{
              rotate: activeIndex === index ? 45 : 0
            }}
              transition={{
                duration: 0.3
              }}>
              <Plus size={40} className={`${activeIndex === index ? 'text-accent-purple' : 'text-gray-400'} transition-colors`} />
            </motion.div>
          </div>

          <AnimatePresence initial={false}>
            {activeIndex === index && <motion.div
              id={`service-content-${service.id}`}
              initial={{
                opacity: 0,
                height: 0,
                y: -20
              }} animate={{
                opacity: 1,
                height: 'auto',
                y: 0
              }} exit={{
                opacity: 0,
                height: 0,
                y: -20
              }} transition={{
                duration: 0.4,
                ease: "easeInOut"
              }} className="overflow-hidden">
              <div className="pb-8 pr-4 sm:pr-8 md:pr-16 space-y-6">
                <div className="flex flex-wrap gap-3 text-sm sm:text-base">
                  <p className="text-white font-semibold">{HOURLY_FROM_LABEL}</p>
                  <p className="text-gray-300">{typicalDurationLabel(service)}</p>
                </div>
                <div className="grid gap-6 md:grid-cols-2 max-w-4xl">
                  <div>
                    <h4 className="text-white font-semibold mb-3">In scope</h4>
                    <ul className="space-y-2">
                      {service.inScope.map((item) => (
                        <li key={item} className="text-gray-400 text-sm">{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-3">Out of scope</h4>
                    <ul className="space-y-2">
                      {service.outOfScope.map((item) => (
                        <li key={item} className="text-gray-400 text-sm">{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <p className="text-lg text-gray-400 max-w-2xl">{service.summary}</p>
              </div>
            </motion.div>}
          </AnimatePresence>
        </div>)}
      </div>
    </div>
  </section>;
};
export default Services;
