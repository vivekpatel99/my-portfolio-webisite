import React from 'react';
import { Link } from 'react-router-dom';
import { featuredCaseStudies } from '@/data/caseStudies';

const ProjectCard = ({ project }) => {
  return (
    <article className="group overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] transition-all duration-300 hover:border-accent-purple/50 hover:bg-white/[0.07]">
      {project.image ? <img className="block h-auto w-full" alt={project.image.alt} src={project.image.src} width={project.image.width} height={project.image.height} loading="lazy" /> : null}
      <div className="flex min-h-[148px] flex-col justify-between gap-4 p-5">
        <div>
          {project.category ? <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#d8caff]">{project.category}</p> : null}
          <h3 className="text-xl font-bold leading-tight text-white">{project.title}</h3>
          <p className="mt-3 text-sm leading-relaxed text-gray-400">{project.summary}</p>
        </div>
        <Link
          to={`/project/${project.slug}/`}
          className="inline-flex min-h-11 items-center text-sm font-semibold text-accent-purple hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-purple"
          aria-label={`Read case study: ${project.title}`}
        >
          Read case study →
        </Link>
      </div>
    </article>
  );
};

const Portfolio = () => {
  return (
    <section id="portfolio" className="py-24 bg-[#0C0D0D]">
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-8 items-start justify-between">
          <div className="w-full lg:w-2/3">
            <div className="inline-block px-4 py-1.5 border border-white/20 rounded-full text-sm mb-4 uppercase">
              Portfolio
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight uppercase">
              Featured <span className="text-accent-purple">Case Studies</span>
            </h2>
            <p className="text-lg text-gray-400 mt-6 mb-12">
              Selected work in data extraction, OCR, and computer vision. Each case study shows the problem, the build, and the outcome.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredCaseStudies.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Portfolio;
