import React from 'react';
import { Link } from 'react-router-dom';
import { DetectionHeading, DetectionLabel } from './DetectionFrame';
import {
  HOURLY_FROM_LABEL,
  serviceOffers,
  serviceRouteForId,
  serviceTimelineLabel,
} from '@/data/serviceOffers';

const firstSentence = (text) => text.split(/(?<=\.)\s+/)[0];

const GeometricGlyph = () => (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" className="w-[14px] h-[14px]" aria-hidden="true">
    <path d="M2 2h4M2 2v4"/>
    <path d="M12 12H8M12 12V8"/>
    <rect x="4.5" y="4.5" width="5" height="5"/>
  </svg>
);

const Services = () => {
  return (
    <section id="services" className="relative bg-[#0C0D0D] py-14 px-7 md:px-12">
      <div className="relative z-[2] max-w-[1080px] mx-auto">
        <DetectionHeading label="Service offers" className="text-[clamp(1.85rem,3.4vw,2.6rem)] font-bold tracking-[-0.02em] leading-[1.1] uppercase mb-[14px]">
          SERVICE <span className="text-[#8B5CF6]">OFFERS</span>
        </DetectionHeading>
        <p className="text-[0.95rem] leading-[1.55] text-[#9ca3af] max-w-[640px] mb-9">
          Hourly engagements, {HOURLY_FROM_LABEL}. Each offer shows its timeline, with in- and out-of-scope details on its own page. Estimates go through the contact form.
        </p>

        <ul className="grid gap-[14px] gap-y-6 lg:grid-cols-3">
          {serviceOffers.map((service, index) => (
            <li key={service.id} className="flex">
              <article
                aria-labelledby={`service-title-${service.id}`}
                className="detection-panel relative flex flex-col w-full bg-transparent py-[22px] px-7"
              >
                <DetectionLabel>
                  SERVICE · <em className="not-italic text-[#a78bfa]">OFFER {String(index + 1).padStart(2, '0')}</em>
                </DetectionLabel>
                <div className="flex items-start gap-[14px] mb-4">
                  <span className="flex-shrink-0 w-[14px] h-[14px] mt-[0.3em] text-[#8B5CF6]">
                    <GeometricGlyph />
                  </span>
                  <h3
                    id={`service-title-${service.id}`}
                    className="text-[clamp(1rem,2.2vw,1.2rem)] font-bold tracking-[-0.015em] leading-[1.25] uppercase text-white"
                  >
                    {service.title}
                  </h3>
                </div>

                <p className="text-[0.9rem] leading-[1.55] text-[#9ca3af] mb-5">
                  {firstSentence(service.summary)}
                </p>

                <dl className="mt-auto flex flex-wrap gap-[10px] gap-x-7 mb-5 pt-4 border-t border-[rgba(255,255,255,0.06)] font-mono text-[11px] leading-[1.4] tracking-[0.04em] text-[#9ca3af]">
                  <div>
                    <dt className="inline tracking-[0.08em] uppercase">Timeline<span aria-hidden="true" className="contents normal-case tracking-[0.04em]"> ·{' '}</span></dt>
                    <dd className="inline font-medium text-[#d8caff] font-sans text-[0.88rem] tracking-normal">{serviceTimelineLabel(service)}</dd>
                  </div>
                  <div>
                    <dt className="inline tracking-[0.08em] uppercase">Rate<span aria-hidden="true" className="contents normal-case tracking-[0.04em]"> ·{' '}</span></dt>
                    <dd className="inline font-medium text-[#d8caff] font-sans text-[0.88rem] tracking-normal">{HOURLY_FROM_LABEL}</dd>
                  </div>
                </dl>

                <Link
                  to={serviceRouteForId(service.id)}
                  className="self-start text-[0.9rem] text-[#a78bfa] border-b border-[rgba(167,139,250,0.4)] pb-0.5 hover:text-white hover:border-[#8B5CF6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B5CF6] transition-colors"
                >
                  Scope details<span className="sr-only"> for {service.title.toLowerCase()}</span> →
                </Link>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default Services;
