import React, { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Hero = () => {
  const heroRef = useRef(null);
  const bgBoxesRef = useRef([]);
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const handleCTAClick = () => {
    navigate('/contact/');
  };

  // Mouse parallax for background bboxes
  useEffect(() => {
    if (reduceMotion || !heroRef.current) return;

    const hero = heroRef.current;
    const boxes = bgBoxesRef.current.filter(Boolean);
    if (!boxes.length) return;

    let targetX = 0, targetY = 0, curX = 0, curY = 0;
    const maxShift = 20;
    let rafId = null;

    const handleMouseMove = (e) => {
      const r = hero.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
      const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
      targetX = nx * maxShift;
      targetY = ny * maxShift;
    };

    const handleMouseLeave = () => {
      targetX = 0;
      targetY = 0;
    };

    const tick = () => {
      curX += (targetX - curX) * 0.1;
      curY += (targetY - curY) * 0.1;
      boxes.forEach((box, i) => {
        const depth = parseFloat(box.getAttribute('data-depth') || '1');
        box.style.setProperty('--px', `${(curX * depth).toFixed(2)}px`);
        box.style.setProperty('--py', `${(curY * depth).toFixed(2)}px`);
      });
      rafId = requestAnimationFrame(tick);
    };

    hero.addEventListener('mousemove', handleMouseMove, { passive: true });
    hero.addEventListener('mouseleave', handleMouseLeave);
    rafId = requestAnimationFrame(tick);

    return () => {
      hero.removeEventListener('mousemove', handleMouseMove);
      hero.removeEventListener('mouseleave', handleMouseLeave);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [reduceMotion]);

  return (
    <section 
      ref={heroRef}
      className="relative min-h-[820px] flex flex-col justify-center overflow-hidden pt-10 pb-10 bg-[#0C0D0D] max-md:min-h-0 max-md:h-auto max-md:pb-14 max-md:pt-6 max-md:justify-start"
    >
      {/* Grid background */}
      <div 
        className="absolute inset-0 pointer-events-none z-0 opacity-100"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.016) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.016) 1px, transparent 1px)',
          backgroundSize: '68px 68px',
          WebkitMaskImage: 'radial-gradient(ellipse 72% 68% at 50% 44%, #000 18%, transparent 74%)',
          maskImage: 'radial-gradient(ellipse 72% 68% at 50% 44%, #000 18%, transparent 74%)'
        }}
      />

      {/* Radial gradient */}
      <div 
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse 38% 42% at 78% 46%, rgba(139,92,246,0.09) 0%, transparent 62%), radial-gradient(ellipse 34% 32% at 28% 40%, rgba(139,92,246,0.035) 0%, transparent 55%)'
        }}
      />

      {/* Background detection bboxes with parallax */}
      <div className="absolute inset-0 pointer-events-none z-[1] overflow-hidden" aria-hidden="true">
        {[
          { type: 'bracket', top: '9%', left: '4%', w: 64, h: 44, c: 15, dur: 15, delay: 0, dx: 16, dy: -14, op: 0.78, depth: 0.55 },
          { type: 'bracket', top: '18%', right: '8%', w: 48, h: 36, c: 12, dur: 17, delay: -3, dx: -15, dy: 12, op: 0.7, depth: 0.9, white: true },
          { type: 'rect', top: '28%', left: '38%', w: 88, h: 52, dur: 19, delay: -6, dx: 12, dy: -16, op: 0.58, depth: 0.35, pulse: true },
          { type: 'bracket', top: '42%', left: '12%', w: 42, h: 32, c: 11, dur: 13, delay: -2, dx: 14, dy: 15, op: 0.72, depth: 1.15 },
          { type: 'rect', bottom: '22%', left: '22%', w: 60, h: 40, dur: 16, delay: -8, dx: -13, dy: 11, op: 0.55, depth: 0.7, white: true },
          { type: 'bracket', bottom: '16%', right: '18%', w: 52, h: 38, c: 13, dur: 14, delay: -4, dx: 15, dy: -12, op: 0.68, depth: 0.85, white: true },
          { type: 'bracket', top: '58%', right: '36%', w: 36, h: 28, c: 10, dur: 11, delay: -1, dx: -12, dy: 14, op: 0.66, depth: 1.3, pulse: true },
          { type: 'rect', top: '12%', left: '58%', w: 44, h: 30, dur: 18, delay: -10, dx: 11, dy: 13, op: 0.5, depth: 0.45 }
        ].map((box, i) => (
          <div
            key={i}
            ref={(el) => { bgBoxesRef.current[i] = el; }}
            data-depth={box.depth}
            className={`absolute ${box.type === 'bracket' ? 'w-14 h-10' : 'w-18 h-12'}`}
            style={{
              top: box.top,
              left: box.left,
              right: box.right,
              bottom: box.bottom,
              width: box.w ? `${box.w}px` : undefined,
              height: box.h ? `${box.h}px` : undefined,
              transform: 'translate3d(var(--px, 0px), var(--py, 0px), 0)',
              willChange: 'transform'
            }}
          >
            <div
              className="w-full h-full"
              style={{
                animation: reduceMotion ? 'none' : `${box.pulse ? 'bg-drift-pulse' : 'bg-drift'} ${box.dur}s ease-in-out infinite`,
                animationDelay: `${box.delay}s`,
                willChange: reduceMotion ? 'auto' : 'transform, opacity',
                '--dx': `${box.dx}px`,
                '--dy': `${box.dy}px`,
                '--op': box.op
              }}
            >
              {box.type === 'bracket' ? (
                <div className="relative w-full h-full">
                  <span 
                    className={`absolute top-0 left-0 border-t border-l ${box.white ? 'border-white/[0.32]' : 'border-[#8B5CF6]/[0.52]'}`}
                    style={{ width: box.c || 14, height: box.c || 14, borderWidth: '1.5px 0 0 1.5px' }}
                  />
                  <span 
                    className={`absolute bottom-0 right-0 border-b border-r ${box.white ? 'border-white/[0.32]' : 'border-[#8B5CF6]/[0.52]'}`}
                    style={{ width: box.c || 14, height: box.c || 14, borderWidth: '0 1.5px 1.5px 0' }}
                  />
                </div>
              ) : (
                <div 
                  className={`w-full h-full ${box.white ? 'border-white/[0.24]' : 'border-[#8B5CF6]/[0.38]'} border rounded-[1px]`}
                  style={{ opacity: box.op }}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="container mx-auto px-6 md:px-12 relative z-10 py-6 max-md:px-4 max-md:py-3">
        <div className="max-w-[1320px] mx-auto flex flex-col gap-4 max-md:gap-2">
          {/* Status badge */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.12] bg-white/[0.03]">
              <span className="w-[7px] h-[7px] rounded-full bg-[#8B5CF6] shadow-[0_0_8px_rgba(139,92,246,0.65)]" />
              <span className="text-[11px] font-mono tracking-wider uppercase text-gray-400">Inference online</span>
            </div>
          </div>

          {/* Two columns: invoice | photo */}
          <div className="grid lg:grid-cols-[minmax(0,1.7fr)_minmax(260px,0.72fr)] gap-7 items-center max-lg:grid-cols-1 max-lg:gap-3">
            {/* Left: Profile Invoice */}
            <div className="flex flex-col gap-4 min-w-0 w-full max-lg:gap-0">
              <article 
                className="relative w-full max-w-[760px] border border-[#8B5CF6]/[0.28] rounded-lg px-7 py-6 max-md:px-3 max-md:py-3"
                style={{
                  background: 'linear-gradient(165deg, #141318 0%, #0f1012 55%, #0e0e10 100%)',
                  boxShadow: '0 0 0 1px rgba(255,255,255,0.03) inset, 0 24px 64px rgba(0,0,0,0.45), 0 0 48px rgba(139,92,246,0.1)'
                }}
                aria-label="Profile invoice field parse"
              >
                {/* Scan label */}
                <span 
                  className="absolute -top-[13px] left-[18px] font-mono text-[10px] tracking-wider uppercase text-purple-200 bg-[rgba(12,13,13,0.95)] px-2 py-[3px] border border-[#8B5CF6]/35 rounded-[2px]"
                >
                  doc · extract · 0.97
                </span>

                {/* Corner brackets */}
                <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
                  <i className="absolute top-[7px] left-[7px] w-3 h-3 border-l-[1.5px] border-t-[1.5px] border-[rgba(192,132,252,0.65)]" />
                  <i className="absolute top-[7px] right-[7px] w-3 h-3 border-r-[1.5px] border-t-[1.5px] border-[rgba(192,132,252,0.65)]" />
                  <i className="absolute bottom-[7px] left-[7px] w-3 h-3 border-l-[1.5px] border-b-[1.5px] border-[rgba(192,132,252,0.65)]" />
                  <i className="absolute bottom-[7px] right-[7px] w-3 h-3 border-r-[1.5px] border-b-[1.5px] border-[rgba(192,132,252,0.65)]" />
                </div>

                {/* Header */}
                <header className="flex justify-between items-start mb-5 pb-3.5 border-b border-white/[0.08] max-md:mb-3.5 max-md:pb-2.5">
                  <div>
                    <div className="font-mono text-[11px] font-semibold tracking-[0.14em] uppercase text-purple-200/[0.78]">Profile Invoice</div>
                    <div className="mt-1 font-mono text-[10px] text-gray-500 tracking-wide">field parse</div>
                  </div>
                  <div className="text-right font-mono text-[10px] leading-relaxed text-gray-500">
                    <strong className="block text-gray-400 font-medium tracking-wider">INV-VP-0045</strong>
                    OCR surface
                  </div>
                </header>

                {/* Name field */}
                <div className="mb-3.5 max-md:mb-2.5">
                  <span className="block mb-[7px] font-mono text-[9px] tracking-[0.12em] uppercase text-gray-500 max-md:mb-[5px]">Name</span>
                  <span className="relative inline-block border-[1.5px] border-[#8B5CF6] px-[7px] py-[3px] rounded-[1px] bg-[#8B5CF6]/[0.07]">
                    <span className="absolute -top-3 left-0 font-mono text-[10px] text-[#8B5CF6] tracking-wide bg-[rgba(14,14,16,0.95)] px-[3px] pointer-events-none z-[4]">
                      field · 0.99
                    </span>
                    <span className="text-[1.3rem] font-semibold tracking-tight text-white max-md:text-[1.1rem]">Vivek Patel</span>
                  </span>
                </div>

                {/* Role field */}
                <div className="mb-3.5 max-md:mb-3">
                  <span className="block mb-[7px] font-mono text-[9px] tracking-[0.12em] uppercase text-gray-500 max-md:mb-[5px]">Role</span>
                  <span className="relative inline-block border-[1.5px] border-[#8B5CF6] px-2 py-1 rounded-[1px] bg-[#8B5CF6]/[0.07]">
                    <span className="absolute -top-3 left-0 font-mono text-[10px] text-[#8B5CF6] tracking-wide bg-[rgba(14,14,16,0.95)] px-[3px] pointer-events-none z-[4]">
                      field · 0.98
                    </span>
                    <h1 className="text-[clamp(1.25rem,2.1vw,1.65rem)] font-bold text-white tracking-tight leading-[1.2] max-md:text-[1.12rem]">
                      Computer Vision & AI Engineer
                    </h1>
                  </span>
                </div>

                {/* Proofs folded under role */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 mb-3.5 max-md:grid-cols-1 max-md:gap-y-3.5 max-md:mb-2.5" role="group" aria-label="Detected credentials">
                  <div className="min-w-0">
                    <span className="block mb-2 font-mono text-[9px] tracking-[0.12em] uppercase text-gray-500 max-md:mb-[5px]">Credential</span>
                    <span className="relative inline-flex items-center gap-[7px] border-[1.5px] border-[#8B5CF6] px-[9px] py-[5px] rounded-[1px] bg-[#8B5CF6]/[0.07] max-w-full">
                      <span className="absolute -top-3 left-0 font-mono text-[10px] text-[#8B5CF6] tracking-wide bg-[rgba(14,14,16,0.95)] px-[3px] pointer-events-none z-[4]">
                        credential · 0.99
                      </span>
                      <span className="flex-shrink-0 w-3 h-3 text-purple-400 opacity-90" aria-hidden="true">
                        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-full h-full">
                          <path d="M7 1.5l1.4 2.8 3.1.45-2.25 2.2.53 3.1L7 8.6 4.22 10.05l.53-3.1L2.5 4.75l3.1-.45L7 1.5z"/>
                        </svg>
                      </span>
                      <span className="text-[0.88rem] font-semibold tracking-[-0.01em] text-white leading-[1.2] whitespace-nowrap max-md:text-[0.84rem] max-md:whitespace-normal">Top Rated Plus</span>
                    </span>
                    <p className="mt-[5px] ml-[2px] font-mono text-[9px] leading-[1.2] tracking-[0.04em] text-gray-500">Upwork freelancer</p>
                  </div>
                  <div className="min-w-0">
                    <span className="block mb-2 font-mono text-[9px] tracking-[0.12em] uppercase text-gray-500 max-md:mb-[5px]">Success</span>
                    <span className="relative inline-flex items-center gap-[7px] border-[1.5px] border-[#8B5CF6] px-[9px] py-[5px] rounded-[1px] bg-[#8B5CF6]/[0.07] max-w-full">
                      <span className="absolute -top-3 right-0 font-mono text-[10px] text-[#8B5CF6] tracking-wide bg-[rgba(14,14,16,0.95)] px-[3px] pointer-events-none z-[4] max-md:left-0 max-md:right-auto">
                        success · 0.99
                      </span>
                      <span className="flex-shrink-0 w-3 h-3 text-purple-400 opacity-90" aria-hidden="true">
                        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" className="w-full h-full">
                          <path d="M2.5 7.2l3.2 3.1L11.5 3.8"/>
                        </svg>
                      </span>
                      <span className="text-[0.88rem] font-semibold tracking-[-0.01em] text-white leading-[1.2] whitespace-nowrap max-md:text-[0.84rem] max-md:whitespace-normal">100% Job Success</span>
                    </span>
                    <p className="mt-[5px] ml-[2px] font-mono text-[9px] leading-[1.2] tracking-[0.04em] text-gray-500">Client delivery record</p>
                  </div>
                </div>

                {/* Rate & Location columns */}
                <div className="grid grid-cols-2 gap-x-[18px] gap-y-3.5 mb-3 max-md:mb-2.5 max-md:gap-y-2.5">
                  <div>
                    <span className="block mb-[7px] font-mono text-[9px] tracking-[0.12em] uppercase text-gray-500 max-md:mb-[5px]">Rate</span>
                    <span className="relative inline-block border-[1.5px] border-[#8B5CF6] px-[7px] py-[3px] rounded-[1px] bg-[#8B5CF6]/[0.07]">
                      <span className="absolute -top-3 left-0 font-mono text-[10px] text-[#8B5CF6] tracking-wide bg-[rgba(14,14,16,0.95)] px-[3px] pointer-events-none z-[4]">
                        field · 0.96
                      </span>
                      <span className="font-mono text-[1.05rem] font-semibold text-white leading-[1.2]">€45/hour</span>
                    </span>
                  </div>
                  <div>
                    <span className="block mb-[7px] font-mono text-[9px] tracking-[0.12em] uppercase text-gray-500 max-md:mb-[5px]">Location</span>
                    <span className="relative inline-block border-[1.5px] border-[#8B5CF6] px-[7px] py-[3px] rounded-[1px] bg-[#8B5CF6]/[0.07]">
                      <span className="absolute -top-3 right-0 font-mono text-[10px] text-[#8B5CF6] tracking-wide bg-[rgba(14,14,16,0.95)] px-[3px] pointer-events-none z-[4]">
                        field · 0.95
                      </span>
                      <span className="font-medium text-[0.92rem] text-gray-300 leading-[1.3]">Linz, Austria</span>
                    </span>
                  </div>
                </div>

                {/* Bio */}
                <div className="mb-3 max-md:mb-2.5">
                  <p className="max-w-[54ch] text-[0.78rem] leading-[1.4] text-gray-400 font-normal max-md:text-[0.72rem] max-md:max-w-full">
                    I build detectors, document extractors, and n8n workflows that turn camera feeds and messy files into reliable production data.
                  </p>
                </div>

                {/* Tags field */}
                <div>
                  <span className="block mb-[7px] font-mono text-[9px] tracking-[0.12em] uppercase text-gray-500 max-md:mb-[5px]">Tags</span>
                  <span className="relative inline-flex border-[1.5px] border-[#8B5CF6] px-2 py-1.5 rounded-[1px] bg-[#8B5CF6]/[0.07]">
                    <span className="absolute -top-3 left-0 font-mono text-[10px] text-[#8B5CF6] tracking-wide bg-[rgba(14,14,16,0.95)] px-[3px] pointer-events-none z-[4]">
                      field · 0.94
                    </span>
                    <span className="flex flex-wrap gap-1.5">
                      {['OCR', 'CV', 'n8n'].map((tag) => (
                        <span 
                          key={tag}
                          className="font-mono text-[11px] text-purple-200 px-2.5 py-1.5 rounded-[3px] border border-white/[0.1] bg-white/[0.03]"
                        >
                          {tag}
                        </span>
                      ))}
                    </span>
                  </span>
                </div>
              </article>
            </div>

            {/* Right: Photo detection card */}
            <div className="flex justify-center items-center max-lg:mx-auto max-lg:w-full max-lg:max-w-[220px]">
              <div className="relative w-full max-w-[300px] p-8 overflow-visible max-md:p-6 max-md:max-w-[220px]">
                {/* Ghost trail frames behind */}
                <div className="absolute inset-8 pointer-events-none z-[1] overflow-visible max-md:inset-6" aria-hidden="true">
                  {[
                    { class: 'g1', inset: '-12px', opacity: reduceMotion ? 0.22 : 0.4, delay: '0s', name: 'ghost-trail-a' },
                    { class: 'g2', inset: '-20px -8px -8px -20px', opacity: reduceMotion ? 0.16 : 0.32, delay: '-1s', name: 'ghost-trail-b' },
                    { class: 'g3', inset: '8px', opacity: reduceMotion ? 0 : 0.28, delay: '-2s', name: 'ghost-trail-c', radius: '24px' },
                    { class: 'g4', inset: '-28px -14px -14px -28px', opacity: reduceMotion ? 0 : 0.22, delay: '-3s', name: 'ghost-trail-d', radius: '34px' }
                  ].map((ghost, i) => (
                    <div
                      key={i}
                      className={`absolute rounded-[28px] border-[1.5px] ${
                        ghost.class === 'g3' ? 'border-white/[0.28]' : ghost.class === 'g2' ? 'border-purple-400/[0.4]' : 'border-[#8B5CF6]/[0.55]'
                      }`}
                      style={{
                        inset: ghost.inset,
                        borderRadius: ghost.radius || '28px',
                        opacity: ghost.opacity,
                        boxShadow: '0 0 0 1px rgba(255,255,255,0.06) inset, 0 0 18px rgba(139,92,246,0.12)',
                        animation: reduceMotion ? 'none' : `${ghost.name} 4s ease-in-out infinite ${ghost.delay}`,
                        willChange: reduceMotion ? 'auto' : 'transform, opacity'
                      }}
                    >
                      {/* Corner brackets on ghosts */}
                      <span className={`absolute -top-[1px] -left-[1px] w-[18px] h-[18px] border-l-2 border-t-2 ${ghost.class === 'g3' || ghost.class === 'g4' ? 'border-white/[0.35] opacity-70' : 'border-[#8B5CF6]/[0.55] opacity-70'}`} />
                      <span className={`absolute -top-[1px] -right-[1px] w-[18px] h-[18px] border-r-2 border-t-2 ${ghost.class === 'g3' ? 'border-white/[0.35] opacity-70' : 'border-[#8B5CF6]/[0.55] opacity-70'}`} />
                      <span className={`absolute -bottom-[1px] -left-[1px] w-[18px] h-[18px] border-l-2 border-b-2 ${ghost.class === 'g3' ? 'border-white/[0.35] opacity-70' : 'border-[#8B5CF6]/[0.55] opacity-70'}`} />
                      <span className={`absolute -bottom-[1px] -right-[1px] w-[18px] h-[18px] border-r-2 border-b-2 ${ghost.class === 'g3' || ghost.class === 'g4' ? 'border-white/[0.35] opacity-70' : 'border-[#8B5CF6]/[0.55] opacity-70'}`} />
                    </div>
                  ))}
                </div>

                {/* Purple L-brackets (static on top) */}
                <div className="absolute inset-1 pointer-events-none z-[3]" aria-hidden="true">
                  <span className="absolute top-0 left-0 w-6 h-6 border-l-[2.5px] border-t-[2.5px] border-[#8B5CF6]" style={{ filter: 'drop-shadow(0 0 4px rgba(139,92,246,0.55))' }} />
                  <span className="absolute top-0 right-0 w-6 h-6 border-r-[2.5px] border-t-[2.5px] border-[#8B5CF6]" style={{ filter: 'drop-shadow(0 0 4px rgba(139,92,246,0.55))' }} />
                  <span className="absolute bottom-0 left-0 w-6 h-6 border-l-[2.5px] border-b-[2.5px] border-[#8B5CF6]" style={{ filter: 'drop-shadow(0 0 4px rgba(139,92,246,0.55))' }} />
                  <span className="absolute bottom-0 right-0 w-6 h-6 border-r-[2.5px] border-b-[2.5px] border-[#8B5CF6]" style={{ filter: 'drop-shadow(0 0 4px rgba(139,92,246,0.55))' }} />
                </div>

                {/* Photo card */}
                <div 
                  className="relative z-[2] w-full rounded-[28px] overflow-hidden bg-[#8B5CF6]"
                  style={{
                    aspectRatio: '362 / 424',
                    boxShadow: '0 28px 64px rgba(0,0,0,0.5), 0 0 56px rgba(139,92,246,0.18)'
                  }}
                >
                  <img 
                    src="/assets/images/vivek-black-and-white.webp" 
                    alt="Tracked engineer portrait"
                    className="block w-full h-full object-cover object-[center_top]"
                  />
                  
                  {/* Scan line */}
                  {!reduceMotion && (
                    <span 
                      className="absolute left-0 right-0 h-[1.5px] z-[5] pointer-events-none"
                      style={{
                        background: 'linear-gradient(90deg, transparent 0%, rgba(139,92,246,0.05) 15%, rgba(233,213,255,0.45) 50%, rgba(139,92,246,0.05) 85%, transparent 100%)',
                        boxShadow: '0 0 10px rgba(139,92,246,0.35)',
                        opacity: 0.35,
                        animation: 'photo-scan 4.5s ease-in-out infinite'
                      }}
                    />
                  )}

                  {/* Badges */}
                  <span className="absolute top-[22px] left-[22px] z-[4] inline-flex items-center gap-1.5 px-[9px] py-[5px] rounded-md bg-[rgba(18,18,22,0.88)] border border-[#8B5CF6]/35 font-mono text-[11px] text-purple-200 tracking-wide backdrop-blur-sm max-md:top-4 max-md:left-4 max-md:text-[10px] max-md:px-2 max-md:py-1">
                    engineer · 0.99
                  </span>
                  <span className="absolute bottom-[22px] left-[22px] z-[4] inline-flex items-center gap-1.5 px-[9px] py-[5px] rounded-md bg-[rgba(18,18,22,0.88)] border border-[#8B5CF6]/35 font-mono text-[11px] text-purple-200 tracking-wide backdrop-blur-sm max-md:bottom-4 max-md:left-4 max-md:text-[10px] max-md:px-2 max-md:py-1">
                    ID 001 · TRACKED
                  </span>
                  <span className="absolute bottom-[22px] right-[22px] z-[4] inline-flex items-center gap-1.5 px-[9px] py-[5px] rounded-md bg-[rgba(18,18,22,0.88)] border border-red-400/35 font-mono text-[11px] text-red-400 tracking-wide backdrop-blur-sm max-md:bottom-4 max-md:right-4 max-md:text-[10px] max-md:px-2 max-md:py-1">
                    <span className="w-[7px] h-[7px] rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.7)]" />
                    REC
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* CTAs below invoice */}
          <div className="flex flex-wrap gap-3 mt-0.5 max-md:flex-col max-md:mt-1 max-md:gap-2">
            <Button
              onClick={handleCTAClick}
              className="bg-[#8B5CF6] hover:bg-[#9B6FFF] text-white font-semibold px-6 py-3.5 h-auto text-base rounded-[10px] min-w-[220px] min-h-[44px] max-md:min-w-0 max-md:w-full max-md:px-4 max-md:py-2.5"
            >
              Request a Project Estimate
            </Button>
            <Button
              asChild
              variant="outline"
              className="border border-white/[0.14] hover:bg-[#8B5CF6]/8 hover:border-purple-400/35 text-white px-6 py-3.5 h-auto text-base rounded-[10px] min-w-[150px] min-h-[44px] max-md:min-w-0 max-md:w-full max-md:px-4 max-md:py-2.5"
            >
              <a href="#portfolio">
                View Case Studies
              </a>
            </Button>
          </div>

          {/* Rate and location chips for a11y */}
          <div className="flex flex-wrap gap-2 mt-2 max-md:mt-1.5">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full border border-white/[0.08]" style={{ backgroundColor: 'rgb(12, 13, 13)' }}>
              <span className="text-[13px] text-gray-300">Starting at €45/hour</span>
            </span>
            <span className="inline-flex items-center px-3 py-1.5 rounded-full border border-white/[0.08]" style={{ backgroundColor: 'rgb(12, 13, 13)' }}>
              <span className="text-[13px] text-gray-300">Based in Linz, Austria</span>
            </span>
          </div>
        </div>
      </div>

      {/* CSS animations */}
      <style jsx>{`
        @keyframes bg-drift {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: var(--op, 0.72); }
          28% { transform: translate(var(--dx, 14px), var(--dy, -12px)) scale(1.02); opacity: calc(var(--op, 0.72) * 1.15); }
          55% { transform: translate(calc(var(--dx, 14px) * -0.85), calc(var(--dy, -12px) * -0.75)) scale(0.99); opacity: var(--op, 0.72); }
          78% { transform: translate(calc(var(--dx, 14px) * 0.45), calc(var(--dy, -12px) * 0.55)) scale(1.01); opacity: calc(var(--op, 0.72) * 0.88); }
        }
        @keyframes bg-drift-pulse {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: var(--op, 0.62); }
          35% { transform: translate(var(--dx, 12px), var(--dy, 10px)) scale(1.08); opacity: calc(var(--op, 0.62) * 1.35); }
          62% { transform: translate(calc(var(--dx, 12px) * -0.7), calc(var(--dy, 10px) * -0.55)) scale(0.96); opacity: calc(var(--op, 0.62) * 0.55); }
          82% { transform: translate(calc(var(--dx, 12px) * 0.35), calc(var(--dy, 10px) * 0.4)) scale(1.03); opacity: var(--op, 0.62); }
        }
        @keyframes ghost-trail-a {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.4; }
          25% { transform: translate(-10px, 7px) scale(1.045); opacity: 0.22; }
          50% { transform: translate(8px, -8px) scale(0.97); opacity: 0.36; }
          75% { transform: translate(-6px, -5px) scale(1.03); opacity: 0.18; }
        }
        @keyframes ghost-trail-b {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.32; }
          25% { transform: translate(9px, -7px) scale(0.96); opacity: 0.18; }
          50% { transform: translate(-9px, 10px) scale(1.05); opacity: 0.3; }
          75% { transform: translate(5px, 4px) scale(1.02); opacity: 0.15; }
        }
        @keyframes ghost-trail-c {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.28; }
          33% { transform: translate(11px, 5px) scale(1.06); opacity: 0.14; }
          66% { transform: translate(-7px, -9px) scale(0.95); opacity: 0.24; }
        }
        @keyframes ghost-trail-d {
          0%, 100% { transform: translate(0, 0) scale(1.02); opacity: 0.22; }
          40% { transform: translate(-12px, 8px) scale(1.07); opacity: 0.12; }
          70% { transform: translate(8px, -7px) scale(0.98); opacity: 0.2; }
        }
        @keyframes photo-scan {
          0% { top: 6%; opacity: 0; }
          8% { opacity: 0.35; }
          92% { opacity: 0.28; }
          100% { top: 92%; opacity: 0; }
        }
      `}</style>
    </section>
  );
};

export default Hero;
