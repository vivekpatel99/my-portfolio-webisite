import React from 'react';
import { useParams } from 'react-router-dom';
import { Seo, routeSeo } from '@/lib/seo';
import { getCaseStudyBySlug } from '@/data/caseStudies';
import CaseStudyArticle from '@/components/CaseStudyArticle';
import NotFound from '@/pages/NotFound';
import '@/components/CaseStudyArticle.css';

const Project = () => {
  const { projectId } = useParams();
  const project = getCaseStudyBySlug(projectId);

  if (!project) return <NotFound />;

  return (
    <>
      <Seo {...routeSeo[`/project/${project.slug}`]} />
      <CaseStudyArticle story={project} />
    </>
  );
};

export default Project;
