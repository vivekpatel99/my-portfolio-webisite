import React from 'react';

const About = () => {
  return (
    <section id="about" className="relative bg-[#0C0D0D] py-14 px-7 md:px-12 min-h-[900px]">
      <div className="relative z-[2] max-w-[1120px] mx-auto">
        <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-[#6b7280] mb-4">
          ABOUT · <em className="not-italic text-[#a78bfa]">FIELD</em>
        </div>
        <h2 className="text-[clamp(1.85rem,3.4vw,2.75rem)] font-bold tracking-[-0.02em] leading-[1.1] uppercase mb-7">
          WHO I <span className="text-[#8B5CF6]">AM</span>
        </h2>

        {/* Dual field columns */}
        <div className="dual grid md:grid-cols-[1fr_1.15fr] gap-[18px] mb-12">
          {/* Photo field */}
          <article className="field relative border border-[rgba(139,92,246,0.32)] p-[22px] px-6 pb-[26px] bg-transparent min-h-[320px]">
            <span className="f-tl absolute top-[5px] left-[5px] w-[14px] h-[14px] border-t-[1.5px] border-l-[1.5px] border-[rgba(139,92,246,0.75)] pointer-events-none"></span>
            <span className="f-br absolute bottom-[5px] right-[5px] w-[14px] h-[14px] border-b-[1.5px] border-r-[1.5px] border-[rgba(255,255,255,0.4)] pointer-events-none"></span>
            
            <div className="field-meta font-mono text-[10px] tracking-[0.14em] uppercase text-[#6b7280] mb-[18px]">
              PHOTO · <em className="not-italic text-[#a78bfa]">FIELD</em>
            </div>
            
            <div className="photo-area aspect-[4/3] bg-[#161718] border border-[rgba(255,255,255,0.08)] flex flex-col items-center justify-center gap-[10px]">
              <div className="photo-glyph w-11 h-11 relative text-[rgba(139,92,246,0.5)]">
                <span className="absolute inset-[5px] border border-current rotate-45"></span>
                <span className="absolute inset-[13px] border border-[rgba(255,255,255,0.25)] rotate-45"></span>
              </div>
              <div className="photo-label font-mono text-[10px] tracking-[0.14em] uppercase text-[#6b7280]">
                PHOTO · FIELD
              </div>
            </div>
          </article>

          {/* Bio field */}
          <article className="field relative border border-[rgba(139,92,246,0.32)] p-[22px] px-6 pb-[26px] bg-transparent min-h-[320px]">
            <span className="f-tl absolute top-[5px] left-[5px] w-[14px] h-[14px] border-t-[1.5px] border-l-[1.5px] border-[rgba(139,92,246,0.75)] pointer-events-none"></span>
            <span className="f-br absolute bottom-[5px] right-[5px] w-[14px] h-[14px] border-b-[1.5px] border-r-[1.5px] border-[rgba(255,255,255,0.4)] pointer-events-none"></span>
            
            <div className="field-meta font-mono text-[10px] tracking-[0.14em] uppercase text-[#6b7280] mb-[18px]">
              BIO · <em className="not-italic text-[#a78bfa]">FIELD</em>
            </div>
            
            <div className="name-line text-[clamp(1.05rem,1.7vw,1.3rem)] font-bold leading-[1.3] tracking-[-0.015em] text-white mb-4">
              Vivek Patel — AI Engineer specializing in Computer Vision
            </div>
            <p className="bio text-[0.92rem] leading-[1.55] text-[#9ca3af] mb-5">
              I optimize complex AI systems for production. From real-time inference acceleration to automated data extraction at scale, I deliver measurable results faster than typical agency timelines.
            </p>
            <div className="diff-label font-mono text-[10px] tracking-[0.12em] uppercase text-[#6b7280] mb-[10px]">
              KEY DIFFERENTIATORS
            </div>
            <ul className="diff-block">
              <li className="relative pl-[14px] text-[0.88rem] leading-[1.5] text-[#9ca3af] mb-[7px] before:content-[''] before:absolute before:left-0 before:top-[0.55em] before:w-[5px] before:h-px before:bg-[rgba(139,92,246,0.65)]">
                Production inference work for MAGNA International
              </li>
              <li className="relative pl-[14px] text-[0.88rem] leading-[1.5] text-[#9ca3af] mb-[7px] before:content-[''] before:absolute before:left-0 before:top-[0.55em] before:w-[5px] before:h-px before:bg-[rgba(139,92,246,0.65)]">
                CUDA, ONNX, edge deployment specialist
              </li>
              <li className="relative pl-[14px] text-[0.88rem] leading-[1.5] text-[#9ca3af] before:content-[''] before:absolute before:left-0 before:top-[0.55em] before:w-[5px] before:h-px before:bg-[rgba(139,92,246,0.65)]">
                End-to-end: vision + scraping + AI agents
              </li>
            </ul>
          </article>
        </div>

        {/* When you hire me */}
        <div className="hire-head mb-5">
          <h2 className="text-[clamp(1.85rem,3.4vw,2.75rem)] font-bold tracking-[-0.02em] leading-[1.1] uppercase mb-3">
            WHEN YOU <span className="text-[#8B5CF6]">HIRE ME</span>
          </h2>
          <p className="hire-blurb text-[0.95rem] leading-[1.55] text-[#9ca3af] max-w-[640px]">
            Here's exactly what to expect. I deliver a clear process, regular updates, and production-ready results.
          </p>
        </div>

        {/* Quiet numbered mono list */}
        <div className="hire-list flex flex-col border-t border-[rgba(255,255,255,0.08)]">
          <div className="hire-row grid md:grid-cols-[72px_200px_1fr] gap-5 items-baseline py-[18px] border-b border-[rgba(255,255,255,0.06)]">
            <div className="hire-num font-mono text-[11px] tracking-[0.12em] text-[#a78bfa]">01</div>
            <div className="hire-title text-[0.98rem] font-bold text-white">Detailed Roadmap</div>
            <div className="hire-copy text-[0.88rem] leading-[1.45] text-[#9ca3af]">A clear project roadmap with milestones delivered within 24 hours of kickoff.</div>
          </div>
          <div className="hire-row grid md:grid-cols-[72px_200px_1fr] gap-5 items-baseline py-[18px] border-b border-[rgba(255,255,255,0.06)]">
            <div className="hire-num font-mono text-[11px] tracking-[0.12em] text-[#a78bfa]">02</div>
            <div className="hire-title text-[0.98rem] font-bold text-white">Regular Updates</div>
            <div className="hire-copy text-[0.88rem] leading-[1.45] text-[#9ca3af]">Bi-weekly progress updates and proactive communication. No surprises.</div>
          </div>
          <div className="hire-row grid md:grid-cols-[72px_200px_1fr] gap-5 items-baseline py-[18px] border-b border-[rgba(255,255,255,0.06)]">
            <div className="hire-num font-mono text-[11px] tracking-[0.12em] text-[#a78bfa]">03</div>
            <div className="hire-title text-[0.98rem] font-bold text-white">Production Code</div>
            <div className="hire-copy text-[0.88rem] leading-[1.45] text-[#9ca3af]">Production-ready code with comprehensive documentation and clear handover.</div>
          </div>
          <div className="hire-row grid md:grid-cols-[72px_200px_1fr] gap-5 items-baseline py-[18px] border-b border-[rgba(255,255,255,0.06)]">
            <div className="hire-num font-mono text-[11px] tracking-[0.12em] text-[#a78bfa]">04</div>
            <div className="hire-title text-[0.98rem] font-bold text-white">Support & Optimization</div>
            <div className="hire-copy text-[0.88rem] leading-[1.45] text-[#9ca3af]">30 days of post-delivery support and a complimentary optimization pass.</div>
          </div>
        </div>

        {/* Process quiet */}
        <div className="process-quiet mt-10 pt-7 border-t border-[rgba(255,255,255,0.06)]">
          <h2 className="text-[1.35rem] font-bold tracking-[-0.02em] leading-[1.1] uppercase mb-[18px]">
            MY <span className="text-[#8B5CF6]">PROCESS</span>
          </h2>
          <div className="process-grid grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-[0.95rem] font-bold mb-2 text-[#e5e7eb]">Strategy & Discovery</h3>
              <p className="text-[0.84rem] leading-[1.5] text-[#6b7280]">
                We'll start by understanding your data challenges, constraints, and success metrics to define the right approach—whether it's vision system optimization, data extraction, or a custom AI workflow.
              </p>
            </div>
            <div>
              <h3 className="text-[0.95rem] font-bold mb-2 text-[#e5e7eb]">Execution & Optimization</h3>
              <p className="text-[0.84rem] leading-[1.5] text-[#6b7280]">
                I build, test, and optimize the solution with production-grade performance standards. I deliver robust, working systems, not just prototypes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;