import React from 'react';

const StarGlyph = () => (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
    <path d="M7 1.5l1.4 2.8 3.1.45-2.25 2.2.53 3.1L7 8.6 4.22 10.05l.53-3.1L2.5 4.75l3.1-.45L7 1.5z" />
  </svg>
);

const CheckGlyph = () => (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" aria-hidden="true">
    <path d="M2.5 7.2l3.2 3.1L11.5 3.8" />
  </svg>
);

const proofItems = [
  {
    id: 'rating',
    fieldLabel: 'credential.rating',
    label: 'Top Rated Plus',
    detail: 'Upwork freelancer',
    confidence: '0.99',
    glyph: StarGlyph,
  },
  {
    id: 'success',
    fieldLabel: 'credential.success',
    label: '100% Job Success',
    detail: 'Client delivery record',
    confidence: '0.99',
    glyph: CheckGlyph,
  },
];

const ProofStrip = () => (
  <section className="relative bg-[#0C0D0D] border-y border-white/10 py-8 px-6 sm:px-12 overflow-hidden" aria-labelledby="proof-heading">
    <h2 id="proof-heading" className="sr-only">Professional Credentials and Achievements</h2>

    <div 
      className="absolute inset-0 pointer-events-none opacity-[0.014]"
      style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
        backgroundSize: '68px 68px',
        maskImage: 'radial-gradient(ellipse 70% 90% at 50% 50%, #000 20%, transparent 75%)',
        WebkitMaskImage: 'radial-gradient(ellipse 70% 90% at 50% 50%, #000 20%, transparent 75%)',
      }}
      aria-hidden="true"
    />

    <div 
      className="absolute inset-0 pointer-events-none"
      style={{
        background: 'radial-gradient(ellipse 40% 80% at 50% 50%, rgba(139,92,246,0.045) 0%, transparent 70%)',
      }}
      aria-hidden="true"
    />

    <div 
      className="absolute top-4 left-6 sm:left-12 w-7 h-7 pointer-events-none before:content-[''] before:absolute before:top-0 before:left-0 before:w-3.5 before:h-3.5 before:border-t-[1.5px] before:border-l-[1.5px] before:border-[#8B5CF6]/55"
      aria-hidden="true"
    />

    <div 
      className="absolute bottom-4 right-6 sm:right-12 w-7 h-7 pointer-events-none before:content-[''] before:absolute before:bottom-0 before:right-0 before:w-3.5 before:h-3.5 before:border-b-[1.5px] before:border-r-[1.5px] before:border-white/28"
      aria-hidden="true"
    />

    <div className="relative z-10 max-w-[960px] mx-auto">
      <div className="flex items-center justify-between mb-5 gap-4 text-[10px] leading-none font-mono tracking-[0.12em] uppercase text-[#6b7280]">
        <div>PROOF · <span className="text-[#a78bfa]">DETECTED</span></div>
        <div>fields · 2</div>
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {proofItems.map(({ id, fieldLabel, label, detail, confidence, glyph: Glyph }) => (
          <li key={id} className="flex flex-col gap-2">
            <div className="text-[10px] leading-none font-mono tracking-[0.02em] text-[#8B5CF6] px-0.5">
              {fieldLabel} / field · {confidence}
            </div>
            <div className="relative inline-flex items-center gap-2.5 border-[1.5px] border-[#8B5CF6] py-2 px-3 rounded-[1px] bg-[#8B5CF6]/[0.07] w-fit max-w-full">
              <span className="flex-shrink-0 w-3.5 h-3.5 text-[#a78bfa] opacity-90">
                <Glyph />
              </span>
              <span className="text-[1.05rem] font-[650] tracking-[-0.015em] text-white leading-[1.2]">
                {label}
              </span>
              <span className="flex-shrink-0 ml-1 text-[10px] leading-none font-mono tracking-[0.04em] text-[#e9d5ff] py-[3px] px-1.5 border border-[#8B5CF6]/40 rounded-[2px] bg-[#0C0D0D]/85">
                {confidence}
              </span>
            </div>
            <p className="text-[0.8rem] text-[#9ca3af] tracking-[0.02em] pl-0.5">
              {detail}
            </p>
          </li>
        ))}
      </ul>
    </div>
  </section>
);

export default ProofStrip;
