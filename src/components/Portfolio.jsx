import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { featuredCaseStudies } from '@/data/caseStudies';

const CONFIDENCE_VALUES = ['0.98', '0.96', '0.99', '0.97', '0.95', '0.94'];

// framer-motion's whileInView requires IntersectionObserver (missing in jsdom).
const canObserveViewport = () =>
  typeof window !== 'undefined' && typeof window.IntersectionObserver === 'function';

const AnalysisOverlay = ({ confidence }) => (
  <div
    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
    aria-hidden="true"
  >
    <span className="absolute left-3 top-3 h-5 w-5 border-l-2 border-t-2 border-[#9372FF]" />
    <span className="absolute right-3 top-3 h-5 w-5 border-r-2 border-t-2 border-[#9372FF]" />
    <span className="absolute bottom-3 left-3 h-5 w-5 border-b-2 border-l-2 border-[#9372FF]" />
    <span className="absolute bottom-3 right-3 h-5 w-5 border-b-2 border-r-2 border-[#9372FF]" />
    <span className="cv-card-scanline absolute inset-x-0 top-0 h-px" />
    <span className="absolute right-3 bottom-3 rounded bg-black/70 px-2 py-0.5 font-mono text-[11px] tracking-wider text-[#d8caff]">
      match: {confidence}
    </span>
  </div>
);

const ProjectCard = ({ project, confidence }) => {
  const secondaryLink = project.externalLinks?.[0];
  return (
    <article className="group h-full overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] transition-all duration-300 hover:border-accent-purple/50 hover:bg-white/[0.07]">
      <Link
        to={`/project/${project.slug}`}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-purple"
        aria-label={`Read case study: ${project.cardTitle}`}
      >
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            alt={project.image.alt}
            src={project.image.src}
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent"></div>
          <AnalysisOverlay confidence={confidence} />
          <div className="absolute bottom-0 left-0 w-full p-5">
            <div className="mb-3 inline-flex rounded-full border border-accent-purple/30 bg-accent-purple/15 px-3 py-1 text-xs font-semibold uppercase text-[#d8caff]">
              {project.category}
            </div>
            <div className="flex items-end justify-between gap-4">
              <h3 className="text-xl font-bold leading-tight text-white">{project.cardTitle}</h3>
              <span className="rounded-full bg-white/10 p-3 backdrop-blur-sm" aria-hidden="true">
                <ArrowUpRight className="h-5 w-5 text-white" />
              </span>
            </div>
          </div>
        </div>
      </Link>
      <div className="flex min-h-[148px] flex-col justify-between p-5">
        <p className="text-sm leading-relaxed text-gray-400">{project.summary}</p>
        {secondaryLink && (
          <a
            href={secondaryLink.href}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-accent-purple hover:text-white"
          >
            {secondaryLink.label}
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>
        )}
      </div>
    </article>
  );
};

const Portfolio = () => {
  const reduceMotion = useReducedMotion();
  const observeViewport = canObserveViewport();

  return (
    <section id="portfolio" className="relative py-24 bg-[#0C0D0D]">
      <div className="absolute inset-0 cv-grid" aria-hidden="true"></div>
      <div className="container mx-auto px-6 relative">
        <div className="flex flex-col lg:flex-row gap-8 items-start justify-between">
          <div className="w-full lg:w-2/3">
            <div className="inline-block px-4 py-1.5 border border-white/20 rounded-full text-sm mb-4 uppercase">
              Portfolio
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight uppercase">
              Featured <span className="text-accent-purple">Case Studies</span>
            </h2>
            <p className="text-lg text-gray-400 mt-6 mb-12">
              Real client work in data extraction, OCR, and computer vision. Each case study shows the business problem, technical approach, and measurable outcome.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredCaseStudies.map((project, index) => (
            <motion.div
              key={project.id}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 36 }}
              {...(observeViewport
                ? {
                    whileInView: reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 },
                    viewport: { once: true, amount: 0.15 },
                  }
                : { animate: reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 } })}
              transition={{
                duration: reduceMotion ? 0.4 : 0.6,
                delay: reduceMotion ? 0 : (index % 3) * 0.12,
                ease: 'easeOut',
              }}
            >
              <ProjectCard
                project={project}
                confidence={CONFIDENCE_VALUES[index % CONFIDENCE_VALUES.length]}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Portfolio;
