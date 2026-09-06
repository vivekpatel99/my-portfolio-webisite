import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import SectionAnimator from '@/components/SectionAnimator';
import CaseStudyVisual from '@/components/CaseStudyVisual';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { Seo, routeSeo } from '@/lib/seo';
import { getCaseStudyBySlug } from '@/data/caseStudies';
import NotFound from '@/pages/NotFound';

const sections = [
  ['situation', 'Situation'],
  ['constraints', 'Constraints'],
  ['decisions', 'Design decisions'],
  ['approach', 'Approach'],
  ['evidence', 'Evidence'],
  ['result', 'Result'],
  ['limitations', 'Limitations'],
  ['related-experience', 'Related experience'],
];

const StoryList = ({ items }) => (
  <ul className="mt-5 space-y-3 text-lg leading-relaxed text-gray-400">
    {items.map((item, index) => <li key={`${item}-${index}`} className="border-l-2 border-accent-purple/40 pl-4">{item}</li>)}
  </ul>
);

const StorySection = ({ id, title, children, className = '' }) => (
  <section id={id} className={`scroll-mt-28 ${className}`} aria-labelledby={`${id}-heading`}>
    <h2 id={`${id}-heading`} className="text-2xl font-bold uppercase text-white md:text-3xl">{title}</h2>
    {children}
  </section>
);

const Project = () => {
  const { projectId } = useParams();
  const project = getCaseStudyBySlug(projectId);
  const reduceMotion = useReducedMotion();

  if (!project) {
    return <NotFound />;
  }

  const projectSeo = routeSeo[`/project/${project.slug}`];
  const { story, links } = project;
  const serviceLink = links.service.find((link) => link.href.startsWith('/'));
  const proofLinks = links.proof;

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0 }}
      transition={{ type: 'tween', ease: 'easeOut', duration: reduceMotion ? 0 : 0.35 }}
      className="bg-[#0C0D0D] text-white"
    >
      <Seo {...projectSeo} />

      <SectionAnimator>
        <header className="pt-40 pb-12 sm:pt-48 sm:pb-16">
          <div className="container mx-auto max-w-5xl px-6">
            <Link to="/#portfolio" className="mb-8 inline-flex items-center text-sm font-semibold text-gray-400 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-purple">
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
              View Case Studies
            </Link>
            <div className="inline-flex rounded-full border border-accent-purple/30 bg-accent-purple/15 px-4 py-1.5 text-sm font-semibold uppercase text-[#d8caff]">{project.category}</div>
            <h1 className="mt-6 max-w-4xl text-4xl font-bold uppercase leading-tight text-white md:text-6xl">{project.title}</h1>
            <p className="mt-6 max-w-3xl text-lg text-gray-400 md:text-xl">{project.summary}</p>
          </div>
        </header>
      </SectionAnimator>

      <SectionAnimator>
        <div className="container mx-auto px-6 pb-12">
          <div className="overflow-hidden rounded-lg border border-white/10 shadow-2xl shadow-accent-purple/10">
            <CaseStudyVisual className="min-h-[18rem] md:min-h-[28rem]" visual={project.image} />
          </div>
        </div>
      </SectionAnimator>

      <nav aria-label="Case study sections" className="border-y border-white/10 bg-white/[0.03]">
        <div className="container mx-auto max-w-5xl overflow-x-auto px-6">
          <ul className="flex min-w-max gap-1 py-3">
            {sections.map(([id, label]) => <li key={id}><a href={`#${id}`} className="inline-flex rounded-full px-3 py-2 text-sm font-semibold text-gray-300 hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-purple">{label}</a></li>)}
          </ul>
        </div>
      </nav>

      <div className="container mx-auto grid max-w-5xl gap-10 px-6 py-16 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="space-y-16">
          <StorySection id="situation" title="Situation">
            <p className="mt-5 text-lg leading-relaxed text-gray-400">{story.situation}</p>
          </StorySection>

          <StorySection id="constraints" title="Constraints">
            <StoryList items={story.constraints} />
          </StorySection>

          <StorySection id="decisions" title="Design decisions">
            <p className="mt-5 text-sm leading-relaxed text-gray-400">{story.interpretationNotice}</p>
            <StoryList items={story.decisions} />
          </StorySection>

          <StorySection id="approach" title="Approach">
            <StoryList items={story.approach} />
          </StorySection>

          <StorySection id="evidence" title="Evidence">
            <StoryList items={story.evidence} />
            <p className="mt-5 text-sm leading-relaxed text-gray-400">No private repository or client material is presented as public proof.</p>
            {proofLinks.length > 0 && <ul className="mt-5 space-y-3">{proofLinks.map((link) => <li key={link.href}><a href={link.href} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-[#d8caff] hover:text-white">{link.label}</a></li>)}</ul>}
            {proofLinks.length > 0 && <p className="mt-3 text-sm leading-relaxed text-gray-400">A public Upwork project record can provide engagement context. It does not independently verify the technical claims on this page.</p>}
          </StorySection>

          <StorySection id="result" title="Result">
            <StoryList items={story.result} />
          </StorySection>

          <StorySection id="limitations" title="Limitations">
            <StoryList items={story.limitations} />
          </StorySection>

          <StorySection id="related-experience" title="Related experience">
            <p className="mt-5 text-lg leading-relaxed text-gray-400">{story.relatedExperience.text}</p>
            {story.relatedExperience.links.length > 0 && <ul className="mt-5 space-y-3">{story.relatedExperience.links.map((link) => <li key={link.href}><a href={link.href} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-[#d8caff] hover:text-white">{link.label}</a></li>)}</ul>}
          </StorySection>
        </div>

        <aside className="h-fit space-y-6 rounded-lg border border-white/10 bg-white/[0.04] p-6 lg:sticky lg:top-28" aria-label="Case study links and scope">
          <div>
            <h2 className="text-lg font-bold uppercase text-white">Tools used</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {(project.stack || []).map((item) => <span key={item} className="rounded-full border border-accent-purple/20 bg-accent-purple/10 px-3 py-1 text-sm font-semibold text-[#d8caff]">{item}</span>)}
            </div>
          </div>
          <div className="border-t border-white/10 pt-6">
            <h2 className="text-lg font-bold uppercase text-white">Continue exploring</h2>
            <div className="mt-4 space-y-3">
              <Link to="/#services" className="block text-sm font-semibold text-[#d8caff] hover:text-white">Explore services</Link>
              <Link to="/#testimonials" className="block text-sm font-semibold text-[#d8caff] hover:text-white">View client feedback</Link>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-gray-400">Client feedback is linked from the homepage. It is separate from this case study’s technical evidence.</p>
          </div>
        </aside>
      </div>

      <SectionAnimator>
        <section className="py-24 text-center" aria-label="Case study next steps">
          <div className="container mx-auto px-6">
            <div className="flex flex-col items-stretch justify-center gap-4 sm:flex-row sm:items-center">
              <Button asChild variant="outline" className="w-full rounded-full border-accent-purple/40 px-6 py-6 text-base text-white hover:bg-accent-purple/10 sm:w-auto sm:px-10 sm:py-7 sm:text-lg">
                <Link to="/#portfolio"><ArrowLeft className="mr-2 h-5 w-5" /> View Case Studies</Link>
              </Button>
              <Button asChild size="lg" className="group w-full rounded-full bg-accent-purple px-6 py-6 text-base text-white hover:bg-accent-purple/90 sm:w-auto sm:px-10 sm:py-7 sm:text-lg">
                <Link to={serviceLink.href}>Request a Project Estimate<span className="sr-only">: {serviceLink.label}</span><ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transform-none motion-reduce:transition-none" /></Link>
              </Button>
            </div>
          </div>
        </section>
      </SectionAnimator>
    </motion.article>
  );
};

export default Project;
