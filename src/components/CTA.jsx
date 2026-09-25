import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { HOURLY_FROM_LABEL } from '@/data/serviceOffers';

const CTA = () => {
  const navigate = useNavigate();
  
  const handleCTAClick = () => {
    navigate('/contact/');
  };

  const handleSecondaryClick = () => {
    navigate('/case-studies/');
  };

  const ActionGlyph = () => (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" className="w-[18px] h-[18px]">
      <rect x="2" y="2" width="14" height="14"/>
      <path d="M6 9h6M10 6l3 3-3 3"/>
    </svg>
  );

  return (
    <section id="cta" className="cta-sec relative bg-[radial-gradient(ellipse_at_50%_40%,rgba(139,92,246,0.045),transparent_55%),#0C0D0D] py-14 px-7 md:px-12 min-h-[900px] flex items-center">
      <div className="inner relative z-[2] max-w-[920px] mx-auto w-full text-center">
        <div className="eyebrow font-mono text-[10px] tracking-[0.14em] uppercase text-[#6b7280] mb-[22px]">
          CTA · <em className="not-italic text-[#a78bfa]">DETECTED</em>
        </div>
        <h2 className="text-[clamp(2rem,4.2vw,3.6rem)] font-bold tracking-[-0.03em] leading-[1.05] uppercase mb-5">
          READY TO START YOUR <span className="text-[#8B5CF6]">PROJECT</span>?
        </h2>
        <p className="body text-[0.95rem] leading-[1.55] text-[#9ca3af] mb-4 max-w-[720px] mx-auto">
          Let's build your next AI solution together. You'll get production-ready code, clear communication at every milestone, and 30 days of support after delivery—so your team never feels stuck.
        </p>
        <div className="rate font-mono text-[11px] leading-[1.4] tracking-[0.06em] text-[#6b7280] mb-10">
          <span className="lab tracking-[0.1em] uppercase">RATE</span> · <strong className="font-medium text-[#d8caff] font-sans text-[0.92rem] tracking-normal">{HOURLY_FROM_LABEL}</strong> &nbsp;·&nbsp; <span className="lab tracking-[0.1em] uppercase">ESTIMATES</span> · <strong className="font-medium text-[#d8caff] font-sans text-[0.92rem] tracking-normal">via contact form</strong>
        </div>

        <div className="actions flex flex-col items-center gap-[22px]">
          {/* Detected action field link */}
          <a
            href="/contact/"
            className="action-field relative inline-flex items-center justify-center gap-4 border border-[rgba(139,92,246,0.72)] bg-gradient-to-b from-[rgba(139,92,246,0.06)] to-transparent bg-[length:100%_55%] bg-no-repeat py-[22px] px-9 pr-9 min-w-[min(420px,92vw)] hover:border-[rgba(139,92,246,0.95)] hover:bg-gradient-to-b hover:from-[rgba(139,92,246,0.1)] hover:to-transparent hover:bg-[length:100%_55%] transition-all focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#8B5CF6] focus-visible:outline-offset-4 no-underline"
          >
            <span className="bracket-tl absolute top-[5px] left-[5px] w-4 h-4 border-t-[1.5px] border-l-[1.5px] border-[rgba(139,92,246,0.95)] pointer-events-none z-[5]"></span>
            <span className="bracket-br absolute bottom-[5px] right-[5px] w-4 h-4 border-b-[1.5px] border-r-[1.5px] border-[rgba(255,255,255,0.55)] pointer-events-none z-[5]"></span>
            
            <span className="field-meta absolute -top-[9px] left-[18px] px-2 bg-[#0C0D0D] font-mono text-[9px] tracking-[0.14em] uppercase text-[#a78bfa]">
              REQUEST · ESTIMATE
            </span>

            <span className="glyph flex-shrink-0 text-[#8B5CF6]">
              <ActionGlyph />
            </span>
            <span className="action-label text-[1.05rem] font-bold tracking-[0.02em] uppercase text-white">
              Request a Project Estimate
            </span>
            <span className="arrow flex-shrink-0 w-5 h-5 text-[#a78bfa] ml-1 group-hover:text-white transition-colors">
              <ArrowRight className="w-full h-full" />
            </span>
          </a>

          <button
            onClick={handleSecondaryClick}
            className="secondary font-mono text-[11px] tracking-[0.12em] uppercase text-[#6b7280] border-b border-[rgba(107,114,128,0.45)] pb-[3px] hover:text-[#a78bfa] hover:border-[rgba(167,139,250,0.55)] transition-colors"
          >
            View case studies
          </button>
        </div>

        <div className="route-note mt-7 font-mono text-[9px] tracking-[0.12em] uppercase text-[#484851]">
          ROUTE · /CONTACT/ · NO MAILTO
        </div>
      </div>
    </section>
  );
};

export default CTA;
