import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import {
  HOURLY_FROM_LABEL,
  serviceOffers,
  typicalDurationLabel,
} from '@/data/serviceOffers';

const Services = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  
  const handleServiceClick = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const GeometricGlyph = () => (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" className="w-[14px] h-[14px]">
      <path d="M2 2h4M2 2v4"/>
      <path d="M12 12H8M12 12V8"/>
      <rect x="4.5" y="4.5" width="5" height="5"/>
    </svg>
  );

  return (
    <section id="services" className="relative bg-[#0C0D0D] py-14 px-7 md:px-12 min-h-[900px]">
      <div className="relative z-[2] max-w-[1080px] mx-auto">
        <h2 className="text-[clamp(1.85rem,3.4vw,2.6rem)] font-bold tracking-[-0.02em] leading-[1.1] uppercase mb-[14px]">
          SERVICE <span className="text-[#8B5CF6]">OFFERS</span>
        </h2>
        <p className="text-[0.95rem] leading-[1.55] text-[#9ca3af] max-w-[640px] mb-9">
          Hourly engagements, {HOURLY_FROM_LABEL}. Each offer lists typical duration and what is in or out of scope. Estimates go through the contact form.
        </p>

        <div className="flex flex-col gap-[14px]">
          {serviceOffers.map((service, index) => (
            <article
              key={service.id}
              className={`relative border ${activeIndex === index ? 'border-[rgba(139,92,246,0.72)]' : 'border-[rgba(139,92,246,0.28)]'} bg-transparent`}
            >
              {/* Corner brackets */}
              <span 
                className={`absolute top-[5px] left-[5px] w-4 h-4 border-t-[1.5px] border-l-[1.5px] border-[rgba(139,92,246,0.85)] pointer-events-none z-[5] transition-opacity ${activeIndex === index ? 'opacity-100' : 'opacity-45'}`}
              ></span>
              <span 
                className={`absolute bottom-[5px] right-[5px] w-4 h-4 border-b-[1.5px] border-r-[1.5px] border-[rgba(255,255,255,0.45)] pointer-events-none z-[5] transition-opacity ${activeIndex === index ? 'opacity-100' : 'opacity-45'}`}
              ></span>

              <div
                className="flex items-start justify-between gap-4 py-[22px] px-7 cursor-pointer"
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
                aria-controls={`panel-${service.id}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-[#6b7280] mb-3">
                    SERVICE · <em className={`not-italic ${activeIndex === index ? 'text-[#8B5CF6]' : 'text-[#a78bfa]'} transition-colors`}>OFFER {String(index + 1).padStart(2, '0')}</em>
                  </div>
                  <div className="flex items-center gap-[14px]">
                    <span className={`flex-shrink-0 w-[14px] h-[14px] transition-all ${activeIndex === index ? 'text-[#8B5CF6] opacity-100' : 'text-[#6b7280] opacity-70'}`}>
                      <GeometricGlyph />
                    </span>
                    <h3 className={`text-[clamp(1rem,2.2vw,1.55rem)] font-bold tracking-[-0.015em] leading-[1.2] uppercase transition-colors ${activeIndex === index ? 'text-white' : 'text-[#9ca3af]'}`}>
                      {service.title}
                    </h3>
                  </div>
                </div>

                <span className={`flex-shrink-0 w-7 h-7 grid place-items-center mt-[18px] transition-all ${activeIndex === index ? 'text-[#8B5CF6] rotate-45' : 'text-[#6b7280] rotate-0'}`}>
                  <Plus className="w-[22px] h-[22px]" />
                </span>
              </div>

              <AnimatePresence>
                {activeIndex === index && (
                  <div id={`panel-${service.id}`} className="px-7 pb-[26px]">
                    <div className="flex flex-wrap gap-[10px] gap-x-7 mb-5 pb-4 border-b border-[rgba(255,255,255,0.06)]">
                      <div className="font-mono text-[11px] leading-[1.4] tracking-[0.04em] text-[#6b7280]">
                        <span className="tracking-[0.08em] uppercase">RATE</span> · <strong className="font-medium text-[#d8caff] font-sans text-[0.88rem] tracking-normal">{HOURLY_FROM_LABEL}</strong>
                      </div>
                      <div className="font-mono text-[11px] leading-[1.4] tracking-[0.04em] text-[#6b7280]">
                        <span className="tracking-[0.08em] uppercase">DURATION</span> · <strong className="font-medium text-[#d8caff] font-sans text-[0.88rem] tracking-normal">{typicalDurationLabel(service)}</strong>
                      </div>
                    </div>

                    <p className="text-[0.9rem] leading-[1.55] text-[#9ca3af] mb-5 max-w-[720px]">
                      {service.summary}
                    </p>

                    <div className="grid md:grid-cols-2 gap-[14px] mb-5">
                      <div className="relative border border-[rgba(139,92,246,0.32)] p-[14px] px-4 pb-4">
                        <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-[#a78bfa] mb-3">
                          IN SCOPE
                        </div>
                        <ul>
                          {service.inScope.map((item, i) => (
                            <li key={i} className="relative pl-[14px] text-[0.84rem] leading-[1.45] text-[#9ca3af] mb-2 last:mb-0 before:content-[''] before:absolute before:left-0 before:top-[0.55em] before:w-[5px] before:h-px before:bg-[rgba(139,92,246,0.7)]">
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="relative border border-[rgba(255,255,255,0.1)] p-[14px] px-4 pb-4">
                        <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-[#6b7280] mb-3">
                          OUT OF SCOPE
                        </div>
                        <ul>
                          {service.outOfScope.map((item, i) => (
                            <li key={i} className="relative pl-[14px] text-[0.84rem] leading-[1.45] text-[#9ca3af] mb-2 last:mb-0 before:content-[''] before:absolute before:left-0 before:top-[0.55em] before:w-[5px] before:h-px before:bg-[rgba(156,163,175,0.55)]">
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <Link
                      to={`/services/${service.id}`}
                      className="text-[0.9rem] text-[#a78bfa] border-b border-[rgba(167,139,250,0.4)] pb-0.5 hover:text-white hover:border-[#8B5CF6] transition-colors"
                    >
                      View details →
                    </Link>
                  </div>
                )}
              </AnimatePresence>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
