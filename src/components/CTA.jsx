import React from 'react';
import { DetectionHeading, DetectionLabel } from './DetectionFrame';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { HOURLY_FROM_LABEL } from '@/data/serviceOffers';

const CTA = () => {
  return (
    <section id="cta" className="cta-sec relative bg-[radial-gradient(ellipse_at_50%_40%,rgba(139,92,246,0.045),transparent_55%),#0C0D0D] py-14 px-7 md:px-12 flex items-center">
      <div className="inner relative z-[2] max-w-[1040px] mx-auto w-full text-center">
        <DetectionHeading label="Project inquiry" className="mx-auto text-[clamp(2rem,4.2vw,3.6rem)] font-bold tracking-[-0.03em] leading-[1.05] uppercase mb-5">
          READY TO START YOUR <span className="text-[#8B5CF6]">PROJECT</span>?
        </DetectionHeading>
        <p className="body text-[0.95rem] leading-[1.55] text-[#9ca3af] mb-4 max-w-[60ch] mx-auto">
          Let's build your next AI solution together. You'll get production-ready code, clear communication at every milestone, and 30 days of support after delivery—so your team never feels stuck.
        </p>
        <div className="rate font-mono text-[11px] leading-[1.4] tracking-[0.06em] text-[#9ca3af] mb-10">
          <span className="lab tracking-[0.1em] uppercase">RATE</span> · <strong className="font-medium text-[#d8caff] font-sans text-[0.92rem] tracking-normal whitespace-nowrap">{HOURLY_FROM_LABEL}</strong> &nbsp;·&nbsp; <span className="lab tracking-[0.1em] uppercase">ESTIMATES</span> · <strong className="font-medium text-[#d8caff] font-sans text-[0.92rem] tracking-normal whitespace-nowrap">via contact form</strong>
        </div>

        <div className="actions flex flex-col items-center gap-[22px]">
          <Link
            to="/contact/"
            aria-label="Request a Project Estimate"
            className="action-field detection-panel detection-action detection-action--primary detection-action--large inline-flex w-full sm:w-[420px]"
          >
            <DetectionLabel className="field-meta" aria-hidden="true">
              Inquiry
            </DetectionLabel>
            <span className="action-label">
              Request a Project Estimate
            </span>
            <ArrowRight className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
          </Link>

          <Link
            to="/case-studies/"
            className="secondary detection-text-action text-sm"
          >
            View case studies
          </Link>
        </div>

      </div>
    </section>
  );
};

export default CTA;
