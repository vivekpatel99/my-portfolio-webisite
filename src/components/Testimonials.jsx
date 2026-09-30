import React, { useState, useEffect, useRef } from 'react';
import { testimonials } from '@/data/testimonials';

const INTERVAL = 6000;
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

const getReducedMotionQuery = () => (
    typeof window === 'undefined' ? null : window.matchMedia?.(REDUCED_MOTION_QUERY) ?? null
);

const Testimonials = () => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(
        () => getReducedMotionQuery()?.matches ?? false
    );
    // Independent stop reasons: a hover or focus exit clears only its own reason,
    // so it can never undo an explicit user pause (or the other transient reason).
    // Reduced motion is derived separately so a preference change never rewrites user intent.
    const [isUserPaused, setIsUserPaused] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [hasFocusWithin, setHasFocusWithin] = useState(false);
    const carouselRef = useRef(null);

    const isRotating = !prefersReducedMotion && !isUserPaused && !isHovered && !hasFocusWithin
        && testimonials.length > 1;

    useEffect(() => {
        const query = getReducedMotionQuery();
        if (!query) return undefined;
        const syncPreference = () => setPrefersReducedMotion(query.matches);
        syncPreference();
        if (typeof query.addEventListener === 'function') {
            query.addEventListener('change', syncPreference);
            return () => query.removeEventListener('change', syncPreference);
        }
        query.addListener?.(syncPreference);
        return () => query.removeListener?.(syncPreference);
    }, []);

    // Removing the focused playback control on a preference change emits no blur,
    // so re-derive focus-within from the actual active element after each switch.
    useEffect(() => {
        setHasFocusWithin(carouselRef.current?.contains(document.activeElement) ?? false);
    }, [prefersReducedMotion]);

    useEffect(() => {
        if (!isRotating) return undefined;

        const timer = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % testimonials.length);
        }, INTERVAL);

        return () => clearInterval(timer);
    }, [isRotating]);

    // Choosing a slide is an explicit request to read it, so it stops rotation until Play.
    const goToSlide = (index) => {
        setActiveIndex(index);
        setIsUserPaused(true);
    };

    // Only a real mouse pointer counts as hover. Touch taps emit a compatibility
    // mouseenter with no matching mouseleave, which would otherwise hold rotation forever.
    const handlePointerEnter = (e) => {
        if (e.pointerType === 'mouse') setIsHovered(true);
    };
    const handlePointerLeave = (e) => {
        if (e.pointerType === 'mouse') setIsHovered(false);
    };

    const handleFocusIn = () => setHasFocusWithin(true);
    const handleFocusOut = (e) => {
        if (!carouselRef.current?.contains(e.relatedTarget)) {
            setHasFocusWithin(false);
        }
    };

    const testimonial = testimonials[activeIndex];

    return (
        <section id="testimonials" className="section relative py-[92px] px-5 sm:px-12 overflow-hidden bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.035),transparent_42%),#0C0D0D]">
            <div className="inner relative z-[2] w-full max-w-[1120px] mx-auto">
                <div className="section-head mb-[54px]">
                    <div className="eyebrow font-mono text-[10px] text-[#9ca3af] mb-[19px] tracking-[0.15em] uppercase">
                        TESTIMONIALS · <span className="text-[#a78bfa]">DETECTED</span>
                    </div>
                    <h2 className="text-[clamp(2.35rem,4vw,4rem)] leading-[0.98] tracking-[-0.045em] uppercase font-[730]">
                        CLIENT <span className="text-[#8B5CF6]">RESULTS</span>
                    </h2>
                    <p className="sub mt-[17px] text-[#9ca3af] text-[15px] leading-[1.6]">
                        Real projects. Real impact.
                    </p>
                </div>

                <div
                    ref={carouselRef}
                    role="region"
                    aria-roledescription="carousel"
                    aria-label="Client testimonials"
                    onPointerEnter={handlePointerEnter}
                    onPointerLeave={handlePointerLeave}
                    onFocus={handleFocusIn}
                    onBlur={handleFocusOut}
                >
                    <div
                        role="group"
                        aria-roledescription="slide"
                        aria-label={`${activeIndex + 1} of ${testimonials.length}`}
                        aria-live={isRotating ? 'off' : 'polite'}
                        tabIndex={0}
                        className="field relative border border-[rgba(139,92,246,0.55)] min-h-[337px] grid grid-cols-1 md:grid-cols-[148px_1fr] bg-gradient-to-r from-[rgba(139,92,246,0.035)] to-transparent hover:border-[rgba(139,92,246,0.82)] focus-visible:border-[rgba(139,92,246,0.82)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#a78bfa] transition-colors"
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
                            <div className="count font-mono text-[9px] text-[#9ca3af] leading-[1.8]">
                                Field<br/>
                                <b className="text-[#a78bfa] font-medium">
                                    {String(activeIndex + 1).padStart(2, '0')} / {String(testimonials.length).padStart(2, '0')}
                                </b>
                            </div>
                        </aside>

                        {/* Quote area */}
                        <article className="quote-area py-[24px] md:py-[34px] px-5 md:px-12 flex flex-col">
                            <div className="meta font-mono text-[10px] text-[#9ca3af] pb-[19px] border-b border-[rgba(255,255,255,0.08)]">
                                TESTIMONIAL · <b className="text-[#a78bfa] font-medium">{testimonial.clientName}</b>
                            </div>
                            <div className="project font-mono mt-[27px] text-[#9ca3af] text-[10px]">
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
                                        <span className="source inline-block ml-[10px] border border-[rgba(255,255,255,0.13)] py-1 px-[7px] text-[#9ca3af] text-[8px] align-[2px]">
                                            {testimonial.source}
                                        </span>
                                    )}
                                </div>
                                <div className="font-mono text-[8px] text-[#9ca3af]">
                                    CLIENT RESPONSE · DETECTED
                                </div>
                            </footer>
                        </article>

                        <span className="micro absolute right-0 top-[-24px] text-[#9ca3af] text-[8px] font-mono">
                            BBOX · ACTIVE
                        </span>
                    </div>

                    {/* Diamonds are decorative marks inside unrotated, larger hit targets. */}
                    <div className="controls flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-[27px]">
                        <div className="dots markers flex flex-wrap items-center justify-center" role="group" aria-label={`${testimonials.length} carousel slides`}>
                            {testimonials.map((_, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    className="dot inline-flex items-center justify-center w-8 h-8 sm:w-11 sm:h-11 p-0 border-0 bg-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#a78bfa]"
                                    aria-label={`Slide ${index + 1}`}
                                    aria-current={index === activeIndex ? 'true' : undefined}
                                    onClick={() => goToSlide(index)}
                                >
                                    <span
                                        aria-hidden="true"
                                        className={`block ${index === activeIndex ? 'w-2 h-2 bg-[#8B5CF6] shadow-[0_0_14px_rgba(139,92,246,0.45)]' : 'w-[5px] h-[5px] bg-[#55545c]'} rotate-45 transition-[width,height,background-color,box-shadow] motion-reduce:transition-none`}
                                    ></span>
                                </button>
                            ))}
                        </div>
                        {prefersReducedMotion ? (
                            <span className="autoplay-status inline-flex items-center min-h-[44px] px-3 font-mono text-[10px] uppercase tracking-[0.15em] text-[#9ca3af]">
                                Autoplay off · Reduced motion
                            </span>
                        ) : (
                            <button
                                type="button"
                                className="pause-toggle inline-flex items-center justify-center gap-2 min-w-[44px] min-h-[44px] px-3 border border-[rgba(255,255,255,0.13)] bg-transparent font-mono text-[10px] uppercase tracking-[0.15em] text-[#9ca3af] hover:text-[#c4b5fd] hover:border-[rgba(139,92,246,0.55)] focus-visible:text-[#c4b5fd] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a78bfa] transition-colors"
                                aria-label={isUserPaused ? 'Play testimonials' : 'Pause testimonials'}
                                onClick={() => setIsUserPaused((paused) => !paused)}
                            >
                                {isUserPaused ? (
                                    <span aria-hidden="true" className="block w-0 h-0 border-y-[4px] border-y-transparent border-l-[7px] border-l-current"></span>
                                ) : (
                                    <span aria-hidden="true" className="block w-[7px] h-2 border-x-2 border-current"></span>
                                )}
                                {isUserPaused ? 'Play' : 'Pause'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Testimonials;
