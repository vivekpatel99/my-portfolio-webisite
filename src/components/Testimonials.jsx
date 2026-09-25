import React, { useState, useEffect, useRef } from 'react';
import { testimonials } from '@/data/testimonials';

const Testimonials = () => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const carouselRef = useRef(null);
    const INTERVAL = 6000;

    useEffect(() => {
        const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
        
        if (prefersReducedMotion || isPaused || testimonials.length <= 1) {
            return;
        }

        const timer = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % testimonials.length);
        }, INTERVAL);

        return () => clearInterval(timer);
    }, [isPaused]);

    const goToSlide = (index) => {
        setActiveIndex(index);
    };

    const handleMouseEnter = () => setIsPaused(true);
    const handleMouseLeave = () => setIsPaused(false);
    
    const handleFocusIn = () => setIsPaused(true);
    const handleFocusOut = (e) => {
        if (carouselRef.current && !carouselRef.current.contains(e.relatedTarget)) {
            setIsPaused(false);
        }
    };

    const testimonial = testimonials[activeIndex];

    return (
        <section id="testimonials" className="section min-h-screen relative py-[92px] px-5 sm:px-12 overflow-hidden bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.035),transparent_42%),#0C0D0D]">
            <div className="inner relative z-[2] w-full max-w-[1120px] mx-auto">
                <header className="section-head mb-[54px]">
                    <div className="eyebrow font-mono text-[10px] text-[#6b7280] mb-[19px] tracking-[0.15em] uppercase">
                        TESTIMONIALS · <span className="text-[#a78bfa]">FIELD</span>
                    </div>
                    <h1 className="text-[clamp(2.35rem,4vw,4rem)] leading-[0.98] tracking-[-0.045em] uppercase font-[730]">
                        CLIENT <span className="text-[#8B5CF6]">RESULTS</span>
                    </h1>
                    <p className="sub mt-[17px] text-[#9ca3af] text-[15px] leading-[1.6]">
                        Real projects. Real impact.
                    </p>
                </header>

                <div 
                    ref={carouselRef}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    onFocus={handleFocusIn}
                    onBlur={handleFocusOut}
                    aria-label={`Testimonial carousel, slide ${activeIndex + 1} of ${testimonials.length}`}
                    className="field relative border border-[rgba(139,92,246,0.55)] min-h-[337px] grid grid-cols-1 md:grid-cols-[148px_1fr] bg-gradient-to-r from-[rgba(139,92,246,0.035)] to-transparent hover:border-[rgba(139,92,246,0.82)] transition-colors"
                >
                    {/* Corner brackets */}
                    <i className="corner tl absolute w-[22px] h-[22px] pointer-events-none top-[7px] left-[7px] border-t-[1.5px] border-l-[1.5px] border-[#8B5CF6]"></i>
                    <i className="corner br absolute w-[22px] h-[22px] pointer-events-none right-[7px] bottom-[7px] border-r-[1.5px] border-b-[1.5px] border-[rgba(255,255,255,0.62)]"></i>

                    {/* Rail */}
                    <aside className="rail border-r md:border-r border-b md:border-b-0 border-[rgba(139,92,246,0.19)] py-4 md:py-8 px-5 md:px-6 flex md:flex-col flex-row justify-between items-center md:items-start">
                        <div className="glyph w-[40px] h-[40px] md:w-[54px] md:h-[54px] relative text-[#8B5CF6]">
                            <span className="absolute inset-[5px] md:inset-[7px] border border-current rotate-45"></span>
                            <span className="absolute inset-[12px] md:inset-[17px] border border-[rgba(255,255,255,0.42)] rotate-45"></span>
                            <i className="absolute w-px h-full bg-current left-1/2 -translate-x-1/2"></i>
                            <i className="absolute h-px w-full bg-current top-1/2 -translate-y-1/2"></i>
                        </div>
                        <div className="count font-mono text-[9px] text-[#6b7280] leading-[1.8]">
                            Field<br/>
                            <b className="text-[#a78bfa] font-medium">
                                {String(activeIndex + 1).padStart(2, '0')} / {String(testimonials.length).padStart(2, '0')}
                            </b>
                        </div>
                    </aside>

                    {/* Quote area */}
                    <article className="quote-area py-[24px] md:py-[34px] px-5 md:px-12 flex flex-col">
                        <div className="meta font-mono text-[10px] text-[#6b7280] pb-[19px] border-b border-[rgba(255,255,255,0.08)]">
                            TESTIMONIAL · <b className="text-[#a78bfa] font-medium">{testimonial.clientName}</b>
                        </div>
                        <div className="project font-mono mt-[27px] text-[#74747e] text-[10px]">
                            PROJECT · <span className="text-[#c1b8da]">{testimonial.projectTitle || testimonial.project || 'Automated Data Extraction Workflow'}</span>
                        </div>
                        <blockquote className="quote mt-[19px] max-w-[790px] text-[clamp(1.2rem,2.35vw,2.12rem)] leading-[1.42] tracking-[-0.025em] font-[430]">
                            <span className="text-[#8B5CF6] mr-[5px]">"</span>
                            {testimonial.content}
                            <span className="text-[#8B5CF6]">"</span>
                        </blockquote>
                        <footer className="tf-foot flex items-end justify-between gap-5 mt-auto pt-[31px] flex-wrap">
                            <div className="identity">
                                <strong className="text-sm font-[650]">{testimonial.clientName}</strong>
                                {testimonial.source && (
                                    <span className="source inline-block ml-[10px] border border-[rgba(255,255,255,0.13)] py-1 px-[7px] text-[#777780] text-[8px] align-[2px]">
                                        {testimonial.source}
                                    </span>
                                )}
                            </div>
                            <div className="font-mono text-[8px] text-[#52525b]">
                                CLIENT RESPONSE · QUOTE
                            </div>
                        </footer>
                    </article>

                    <span className="micro absolute right-0 top-[-24px] text-[#484851] text-[8px] font-mono">
                        BBOX · ACTIVE
                    </span>
                </div>

                {/* Diamond dots */}
                <div className="dots markers flex items-center justify-center gap-[13px] mt-[27px]" aria-label={`${testimonials.length} carousel slides`}>
                    {testimonials.map((_, index) => (
                        <button
                            key={index}
                            type="button"
                            className={`dot block p-0 border-0 ${index === activeIndex ? 'w-2 h-2 bg-[#8B5CF6] shadow-[0_0_14px_rgba(139,92,246,0.45)]' : 'w-[5px] h-[5px] bg-[#55545c]'} rotate-45 transition-all`}
                            aria-label={`Slide ${index + 1}`}
                            aria-current={index === activeIndex ? 'true' : undefined}
                            onClick={() => goToSlide(index)}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Testimonials;
