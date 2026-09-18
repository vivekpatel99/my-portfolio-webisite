import React from 'react';
import { Seo, routeSeo } from '@/lib/seo';
import { useLocation } from 'react-router-dom';
import CaseStudiesContent from '@/components/CaseStudiesContent.js';

const CaseStudies = () => {
  const location = useLocation();

  return (
    <>
      <Seo {...routeSeo['/case-studies']} />
      <CaseStudiesContent key={location.key} />
    </>
  );
};

export default CaseStudies;
