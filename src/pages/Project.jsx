import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Stats from '@/components/Stats';
import SectionAnimator from '@/components/SectionAnimator';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, ArrowUpRight } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Seo } from '@/lib/seo';
import { getCaseStudyBySlug } from '@/data/caseStudies';

const pageVariants = {
  initial: { opacity: 0 },
  in: { opacity: 1 },
  out: { opacity: 0 },
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.8,
};

const Project = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const project = getCaseStudyBySlug(projectId);

  useEffect(() => {
    if (!project) {
      toast({
        title: 'Project Not Found',
        description: 'That case study could not be found. You have been redirected to the homepage.',
        variant: 'destructive',
      });
      navigate('/', { replace: true });
    }
  }, [project, navigate]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [projectId]);

  if (!project) {
    return null;
  }

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="bg-[#0C0D0D] text-white"
    >
      <Seo
        title={`${project.title} | AI Case Study - Vivek Patel`}
        description={project.summary}
        keywords={`${project.title}, ${project.category}, case study, Vivek Patel, AI automation, computer vision, data extraction`}
        path={`/project/${project.slug}`}
        type="article"
        image={project.image.src}
      />

      <SectionAnimator>
        <header className="pt-40 pb-12 sm:pt-48 sm:pb-16">
          <div className="container mx-auto max-w-5xl px-6">
            <Link
              to="/#portfolio"
              className="mb-8 inline-flex items-center text-sm font-semibold text-gray-400 hover:text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
              View Case Studies
            </Link>
            <div className="inline-flex rounded-full border border-accent-purple/30 bg-accent-purple/15 px-4 py-1.5 text-sm font-semibold uppercase text-[#d8caff]">
              {project.category}
            </div>
            <h1 className="mt-6 max-w-4xl text-4xl font-bold uppercase leading-tight text-white md:text-6xl">
              {project.title}
            </h1>
            <p className="mt-6 max-w-3xl text-lg text-gray-400 md:text-xl">{project.summary}</p>
          </div>
        </header>
      </SectionAnimator>

      <SectionAnimator>
        <div className="container mx-auto px-6 pb-16">
          <div className="aspect-video overflow-hidden rounded-lg border border-white/10 shadow-2xl shadow-accent-purple/10">
            <img className="h-full w-full object-cover" alt={project.image.alt} src={project.image.src} />
          </div>
        </div>
      </SectionAnimator>

      <SectionAnimator>
        <section className="py-12">
          <div className="container mx-auto grid gap-8 px-6 md:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-6 md:col-span-1">
              <h2 className="text-xl font-bold uppercase text-white">Stack</h2>
              <div className="mt-5 flex flex-wrap gap-2">
                {project.stack.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-accent-purple/20 bg-accent-purple/10 px-3 py-1 text-sm font-semibold text-accent-purple"
                  >
                    {item}
                  </span>
                ))}
              </div>
              <div className="mt-8 space-y-3">
                {project.externalLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-gray-300 hover:text-white"
                  >
                    {link.label}
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </a>
                ))}
              </div>
            </div>

            <div className="grid gap-8 md:col-span-2 md:grid-cols-2">
              <div>
                <h2 className="text-3xl font-bold uppercase text-white">The Challenge</h2>
                <p className="mt-5 text-lg leading-relaxed text-gray-400">{project.challenge}</p>
              </div>
              <div>
                <h2 className="text-3xl font-bold uppercase text-white">The Solution</h2>
                <p className="mt-5 text-lg leading-relaxed text-gray-400">{project.solution}</p>
              </div>
            </div>
          </div>
        </section>
      </SectionAnimator>

      <SectionAnimator>
        <section className="py-12">
          <div className="container mx-auto px-6">
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-6 md:p-8">
              <h2 className="text-3xl font-bold uppercase text-white">Outcome</h2>
              <p className="mt-5 max-w-4xl text-lg leading-relaxed text-gray-400">{project.outcome}</p>
            </div>
          </div>
        </section>
      </SectionAnimator>

      <SectionAnimator>
        <div className="container mx-auto grid gap-6 px-6 py-12 md:grid-cols-2">
          {project.gallery.map((image) => (
            <div key={image.src} className="aspect-[4/3] overflow-hidden rounded-lg border border-white/10 bg-white/[0.04]">
              <img className="h-full w-full object-cover" alt={image.alt} src={image.src} loading="lazy" />
            </div>
          ))}
        </div>
      </SectionAnimator>

      <Stats customStats={project.stats} />

      <SectionAnimator>
        <section className="py-24 text-center">
          <div className="container mx-auto px-6">
            <div className="flex flex-col items-stretch justify-center gap-4 sm:flex-row sm:items-center">
              <Button
                asChild
                variant="outline"
                className="w-full rounded-full border-accent-purple/40 px-6 py-6 text-base text-white hover:bg-accent-purple/10 sm:w-auto sm:px-10 sm:py-7 sm:text-lg"
              >
                <Link to="/#portfolio">
                  <ArrowLeft className="mr-2 h-5 w-5" /> View Case Studies
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                className="group w-full rounded-full bg-accent-purple px-6 py-6 text-base text-white hover:bg-accent-purple/90 sm:w-auto sm:px-10 sm:py-7 sm:text-lg"
              >
                <Link to="/contact">
                  Request a Project Estimate
                  <ArrowRight className="ml-2 h-5 w-5 transform transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </SectionAnimator>
    </motion.div>
  );
};

export default Project;
