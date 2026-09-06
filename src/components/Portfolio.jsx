import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { featuredCaseStudies } from '@/data/caseStudies';
import CaseStudyVisual from '@/components/CaseStudyVisual';

const ProjectCard = ({ project }) => (
  <article className="group overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] transition-colors duration-300 hover:border-accent-purple/50 hover:bg-white/[0.07]">
    <Link
      to={`/project/${project.slug}/`}
      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-purple"
      aria-label={`Read case study: ${project.cardTitle}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <CaseStudyVisual className="h-full w-full motion-reduce:transform-none" visual={project.image} />
      </div>
      <div className="border-t border-white/10 bg-[#121316] p-5">
        <div className="mb-3 inline-flex rounded-full border border-accent-purple/30 bg-accent-purple/15 px-3 py-1 text-xs font-semibold uppercase text-[#d8caff]">
          {project.category}
        </div>
        <div className="flex items-end justify-between gap-4">
          <h3 className="text-xl font-bold leading-tight text-white">{project.cardTitle}</h3>
          <span className="rounded-full bg-white/10 p-3" aria-hidden="true"><ArrowUpRight className="h-5 w-5 text-white" /></span>
        </div>
      </div>
    </Link>
    <div className="flex min-h-[132px] flex-col justify-between p-5">
      <p className="text-sm leading-relaxed text-gray-400">{project.summary}</p>
      <Link to={`/project/${project.slug}/`} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#d8caff] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-purple">
        Read the full story
        <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  </article>
);

const Portfolio = () => (
  <section id="portfolio" className="bg-[#0C0D0D] py-24" aria-labelledby="portfolio-heading">
    <div className="container mx-auto px-6">
      <div className="flex flex-col items-start justify-between gap-8 lg:flex-row">
        <div className="w-full lg:w-2/3">
          <div className="mb-4 inline-block rounded-full border border-white/20 px-4 py-1.5 text-sm uppercase">Portfolio</div>
          <h2 id="portfolio-heading" className="text-3xl font-bold uppercase leading-tight text-white md:text-4xl lg:text-5xl">Featured <span className="text-accent-purple">Case Studies</span></h2>
          <p className="mb-12 mt-6 text-lg text-gray-400">Explore technical stories about document extraction, workflow automation, and computer vision, with their scope and limits made clear.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {featuredCaseStudies.map((project) => <ProjectCard key={project.id} project={project} />)}
      </div>
    </div>
  </section>
);

export default Portfolio;
