import React from 'react';
import { Seo, routeSeo } from '@/lib/seo';
import CaseStudiesContent from '@/components/CaseStudiesContent.js';

const CaseStudies = () => (
  <>
    <Seo {...routeSeo['/case-studies']} />
    <CaseStudiesContent />
  </>
);

export default CaseStudies;
