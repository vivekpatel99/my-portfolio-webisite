import React, { useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Seo, routeSeo } from '@/lib/seo';
import { getCaseStudyBySlug } from '@/data/caseStudies';
import { collectionReturnHref, consumeCollectionOriginLocation } from '@/lib/caseStudyBrowsing';
import CaseStudyArticle from '@/components/CaseStudyArticle';
import NotFound from '@/pages/NotFound';
import '@/components/CaseStudyArticle.css';

const Project = () => {
  const { projectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const project = getCaseStudyBySlug(projectId);

  useEffect(() => {
    const consumed = consumeCollectionOriginLocation(location);
    if (!consumed) return;
    navigate(
      { pathname: location.pathname, search: consumed.search, hash: location.hash },
      { replace: true, state: consumed.state },
    );
  }, [location, navigate]);

  if (!project) return <NotFound />;

  return (
    <>
      <Seo {...routeSeo[`/project/${project.slug}`]} />
      <CaseStudyArticle story={project} backHref={collectionReturnHref(location)} />
    </>
  );
};

export default Project;
