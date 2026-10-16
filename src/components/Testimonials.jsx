import './Testimonials.css';
import React, { useState, useEffect, useRef, useId } from 'react';
import { Star } from 'lucide-react';
import { testimonials } from '@/data/testimonials';
import { socialLinks } from '@/config/links';
import { DetectionHeading, DetectionLabel } from './DetectionFrame';

const INTERVAL = 6000;
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
// Keep the English site's month/year stable across visitor and build time zones.
const feedbackDateFormatter = new Intl.DateTimeFormat('en-GB', {
    month: 'long', year: 'numeric', timeZone: 'UTC',
});

const getReducedMotionQuery = () => (
    typeof window === 'undefined' ? null : window.matchMedia?.(REDUCED_MOTION_QUERY) ?? null
);

const Testimonials = () => {
    const starGradientId = useId();
    const profileLinkRef = useRef(null);
    const cardGesture = useRef(null);
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

    useEffect(() => {
        if (!isRotating) return undefined;

        const timer = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % testimonials.length);
        }, INTERVAL);

        return () => clearInterval(timer);
    }, [isRotating]);

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

    const trackCardMovement = (event) => {
        const gesture = cardGesture.current;
        if (gesture && Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > 10) {
            gesture.cancelled = true;
        }
    };
    const handleCardClick = (event) => {
        const gesture = cardGesture.current;
        cardGesture.current = null;
        // Keyboard activation stays native, even if text remains selected.
        if (event.detail === 0 || event.defaultPrevented) return;
        const selection = window.getSelection();
        const selectingCardText = selection && !selection.isCollapsed
            && (event.currentTarget.contains(selection.anchorNode)
                || event.currentTarget.contains(selection.focusNode));
        if (gesture?.cancelled || selectingCardText) {
            event.preventDefault();
            return;
        }
        // Footer clicks keep native modified-click behavior and must not be forwarded twice.
        if (event.target.closest('a')) return;
        if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
            profileLinkRef.current?.click();
        }
    };

    const testimonial = testimonials[activeIndex];

    return (
        <section id="testimonials" className="section relative py-[92px] px-5 sm:px-12 overflow-hidden bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.035),transparent_42%),#0C0D0D]">
            <div className="inner relative z-[2] w-full max-w-[1120px] mx-auto">
                <div className="section-head mb-[54px]">
                    <DetectionHeading label="Testimonials" className="text-[clamp(2.35rem,4vw,4rem)] leading-[0.98] tracking-[-0.045em] uppercase font-[730]">
                        CLIENT <span className="text-[#8B5CF6]">RESULTS</span>
                    </DetectionHeading>
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
                        className="field testimonial-card detection-panel relative min-h-[337px] flex flex-col min-w-0 transition-colors motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#a78bfa]"
                        onPointerDown={(event) => {
                            cardGesture.current = { x: event.clientX, y: event.clientY, cancelled: false };
                        }}
                        onPointerMove={trackCardMovement}
                        onPointerUp={trackCardMovement}
                        onPointerCancel={() => {
                            if (cardGesture.current) cardGesture.current.cancelled = true;
                        }}
                        onClick={handleCardClick}
                        onKeyDown={(event) => {
                            if (event.target !== event.currentTarget || event.defaultPrevented
                                || (event.key !== 'Enter' && event.key !== ' ')) return;
                            event.preventDefault();
                            if (!event.repeat) profileLinkRef.current?.click();
                        }}
                    >
                        <DetectionLabel>
                            TESTIMONIAL · <b className="font-medium">{testimonial.clientName}</b>
                        </DetectionLabel>

                        {/* Quote area */}
                        <article className="quote-area py-[24px] md:py-[34px] px-5 md:px-12 flex flex-col flex-1">
                            <div className="project font-mono mt-2 text-[#9ca3af] text-[10px]">
                                PROJECT · <span className="text-[#c1b8da]">{testimonial.projectTitle || testimonial.project || 'Automated Data Extraction Workflow'}</span>
                            </div>
                            <blockquote className="quote mt-[19px] max-w-[790px] text-[clamp(1.2rem,2.35vw,2.12rem)] leading-[1.42] tracking-[-0.025em] font-[430]">
                                <span className="text-[#8B5CF6] mr-[5px]">“</span>
                                {testimonial.content}
                                <span className="text-[#8B5CF6]">”</span>
                            </blockquote>
                            {testimonial.rating === 5 && (
                                <span role="img" aria-label="Rated 5 out of 5" className="inline-flex self-center items-center gap-1.5 mt-6 drop-shadow-[0_0_5px_rgba(251,191,36,0.45)]">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star key={star} size={24} fill={`url(#${starGradientId})`} stroke="#FFE6A0" strokeWidth={1} aria-hidden="true">
                                            {star === 1 && (
                                                <defs>
                                                    <linearGradient id={starGradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                                                        <stop offset="0%" stopColor="#FFF4BF" />
                                                        <stop offset="35%" stopColor="#FFD568" />
                                                        <stop offset="60%" stopColor="#F5B82E" />
                                                        <stop offset="100%" stopColor="#D9921B" />
                                                    </linearGradient>
                                                </defs>
                                            )}
                                        </Star>
                                    ))}
                                </span>
                            )}
                            <footer className="tf-foot flex items-end justify-between gap-5 mt-auto pt-[31px] flex-wrap">
                                <div className="identity min-w-0">
                                    <strong className="text-sm font-[650]">{testimonial.clientName}</strong>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-2 text-xs text-[#9ca3af]">
                                        {testimonial.source ? <span className="source">{testimonial.source}</span> : null}
                                        <a
                                            ref={profileLinkRef}
                                            href={socialLinks.upwork}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            tabIndex={0}
                                            className="testimonial-link text-[#a78bfa] underline underline-offset-4"
                                        >
                                            View my Upwork profile{' '}<span className="sr-only">(opens in a new tab)</span>
                                        </a>
                                        {testimonial.feedbackDate ? (
                                            <span>
                                                Feedback · <time dateTime={testimonial.feedbackDate.slice(0, 7)}>
                                                    {feedbackDateFormatter.format(new Date(`${testimonial.feedbackDate}T00:00:00Z`))}
                                                </time>
                                            </span>
                                        ) : null}
                                    </div>
                                </div>
                                <div className="count shrink-0 whitespace-nowrap font-mono text-[9px] text-[#9ca3af] leading-[1.8]">
                                    Field<br/>
                                    <b className="text-[#a78bfa] font-medium">
                                        {String(activeIndex + 1).padStart(2, '0')} / {String(testimonials.length).padStart(2, '0')}
                                    </b>
                                </div>
                            </footer>
                        </article>
                    </div>

                    {/* Diamonds are decorative marks inside unrotated, larger hit targets. */}
                    <div className="controls flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-[27px]">
                        <div className="dots markers flex flex-wrap items-center justify-center" role="group" aria-label={`${testimonials.length} carousel slides`}>
                            {testimonials.map((_, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    disabled={typeof window === 'undefined'}
                                    className="dot detection-utility inline-flex items-center justify-center w-11 h-11 p-0 border-0 bg-transparent"
                                    aria-label={`Slide ${index + 1}`}
                                    aria-current={index === activeIndex ? 'true' : undefined}
                                    onClick={() => goToSlide(index)}
                                >
                                    <span
                                        aria-hidden="true"
                                        className={`block ${index === activeIndex ? 'w-2 h-2 bg-[#8B5CF6] shadow-[0_0_14px_rgba(139,92,246,0.45)]' : 'w-[5px] h-[5px] bg-[#6b7280]'} rotate-45 transition-[width,height,background-color,box-shadow] motion-reduce:transition-none`}
                                    ></span>
                                </button>
                            ))}
                        </div>
                        {prefersReducedMotion && (
                            <span className="autoplay-status inline-flex items-center min-h-[44px] px-3 font-mono text-[10px] uppercase tracking-[0.15em] text-[#9ca3af]">
                                Autoplay off · Reduced motion
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Testimonials;
