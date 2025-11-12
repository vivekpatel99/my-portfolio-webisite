import React from 'react';
import { Star } from 'lucide-react';
import { socialLinks } from '@/config/links';
import './Testimonials.css'; // We'll create this file for the animation

const UpworkIcon = () => (
    <svg className="w-10 h-10 text-[#14A800] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.561 13.158c-1.102 0-2.135-.467-3.074-1.227l.228-1.076.008-.042c.207-1.143.849-3.06 2.839-3.06 1.492 0 2.703 1.212 2.703 2.703-.001 1.489-1.212 2.702-2.704 2.702zm0-8.14c-2.539 0-4.51 1.649-5.31 4.366-1.22-1.834-2.148-4.036-2.687-5.892H7.828v7.112c-.002 1.406-1.141 2.546-2.547 2.548-1.405-.002-2.543-1.143-2.545-2.548V3.492H0v7.112c0 2.914 2.37 5.303 5.281 5.303 2.913 0 5.283-2.389 5.283-5.303v-1.19c.529 1.107 1.182 2.229 1.974 3.221l-1.673 7.873h2.797l1.213-5.71c1.063.679 2.285 1.109 3.686 1.109 3 0 5.439-2.452 5.439-5.45 0-3-2.439-5.439-5.439-5.439z" />
    </svg>
);

const StarRating = () => (
    <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
            <Star
                key={i}
                className="w-5 h-5 fill-yellow-400 text-yellow-400"
            />
        ))}
    </div>
);

const testimonials = [
    {
        id: 1,
        projectTitle: 'Automated Data Extraction Workflow',
        clientName: 'Stephan P.',
        content: "Vivek delivered an excellent AI workflow fully aligned with our requirements. His work was precise, efficient, and exceeded our expectations. We highly recommend working with him!",
        link: socialLinks.upwork,
    },
    {
        id: 2,
        projectTitle: 'Software Engineer',
        clientName: 'Duncan H.',
        content: "Very high quality work. Great communication. High quality code and engineering. Really shined on thorough QA which stood out. Would definitely work with Vivek again on future projects.",
        link: socialLinks.upwork,
    },
    {
        id: 3,
        projectTitle: 'Pose Estimation for Fitness App',
        clientName: 'Upwork Client',
        content: "I find Vivek is highly professional and time bound individual. He has exceptional technical skills and understanding of the domain. He delivered the project on time with great quality.",
        link: socialLinks.upwork,
    },
    {
        id: 4,
        projectTitle: 'Feasibility check: n8n workflow for local transcription',
        clientName: 'Andrew W.',
        content: "Great experience working with Vivek. I'm impressed by his knowledge, his autonomy and how quickly he provided me feedback on issues with my workflow idea and possible solutions.",
        link: socialLinks.upwork,
    },
];

const TestimonialCard = ({ projectTitle, clientName, content, link }) => (
    <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="testimonial-card-link" // Use this for styling the card within the carousel
    >
        <div className="flex flex-col h-full bg-[#1E1E2A] p-6 rounded-2xl border border-white/10 transition-all duration-300 hover:border-accent-purple/50 hover:shadow-lg hover:shadow-accent-purple/10 hover:!transform-none">
            <div className="flex items-start gap-4 mb-4">
                <UpworkIcon />
                <div className="flex-1">
                    <h3 className="font-bold text-white text-lg leading-tight">{projectTitle}</h3>
                    <p className="text-sm text-gray-400">{clientName}</p>
                </div>
            </div>
            <div className="mb-4">
                <StarRating />
            </div>
            <blockquote className="text-gray-300 text-base leading-relaxed flex-1">
                "{content}"
            </blockquote>
        </div>
    </a>
);


const Testimonials = () => {
    // Duplicate testimonials for a seamless loop
    const duplicatedTestimonials = [...testimonials, ...testimonials];

    return (
        <section id="testimonials" className="py-24 bg-[#0C0D0D] overflow-hidden">
            <div className="container mx-auto px-6">
                <div className="text-left mb-12">
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight uppercase">
                        CLIENT <span className="text-accent-purple">RESULTS</span>
                    </h2>
                    <p className="text-lg text-gray-400 mt-2">Real projects. Real impact.</p>
                </div>
            </div>

            <div className="scroller">
                <div className="scroller-inner">
                    {duplicatedTestimonials.map((testimonial, index) => (
                        <TestimonialCard key={`${testimonial.id}-${index}`} {...testimonial} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Testimonials;