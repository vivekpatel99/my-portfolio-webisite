import React, { useState, useEffect, useRef } from 'react';
import { testimonials } from '@/data/testimonials';
import './Testimonials.css';

const StarRating = () => (
    <span className="stars" aria-label="5 out of 5 stars">★★★★★</span>
);

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

    return (
        <section id="testimonials" className="py-24 bg-[#0C0D0D]">
            <div className="container mx-auto px-6">
                <div className="text-left mb-12">
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight uppercase">
                        CLIENT <span className="text-accent-purple">RESULTS</span>
                    </h2>
                </div>

                <div 
                    className="carousel-wrap"
                    ref={carouselRef}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    onFocus={handleFocusIn}
                    onBlur={handleFocusOut}
                >
                    <div className="carousel-card">
                        <div className="carousel-slides">
                            {testimonials.map((testimonial, index) => {
                                const attribution = [
                                    testimonial.role,
                                    testimonial.country
                                ].filter(Boolean).join(' · ');

                                return (
                                    <blockquote
                                        key={testimonial.id}
                                        className={`carousel-slide ${index === activeIndex ? 'is-active' : ''}`}
                                        data-index={index}
                                    >
                                        <p className="carousel-quote">
                                            {testimonial.content}
                                        </p>
                                        <footer className="carousel-attr">
                                            <div>
                                                <div className="attr-name">{testimonial.clientName}</div>
                                                {attribution && <div className="attr-meta">{attribution}</div>}
                                            </div>
                                            <div className="attr-right">
                                                {testimonial.source && (
                                                    <span className="source-chip">{testimonial.source}</span>
                                                )}
                                                <StarRating />
                                            </div>
                                        </footer>
                                    </blockquote>
                                );
                            })}
                        </div>
                    </div>

                    <div className="carousel-dots" role="tablist" aria-label="Quote slides">
                        {testimonials.map((_, index) => (
                            <button
                                key={index}
                                type="button"
                                className={`carousel-dot ${index === activeIndex ? 'is-active' : ''}`}
                                role="tab"
                                aria-label={`Show quote ${index + 1}`}
                                aria-selected={index === activeIndex ? 'true' : 'false'}
                                onClick={() => goToSlide(index)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Testimonials;
