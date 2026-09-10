import React from 'react';
import { collectionCaseStudies } from '../data/caseStudies.js';
import CaseStudyCard from './CaseStudyCard.js';

const CaseStudyCollection = ({ stories = collectionCaseStudies }) => {

  return stories.length > 0
    ? React.createElement(
      'div',
      { className: 'grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3' },
      stories.map((story) => React.createElement(CaseStudyCard, { key: story.slug, project: story })),
    )
    : React.createElement(
      'p',
      { className: 'rounded-lg border border-white/10 bg-white/[0.04] p-8 text-center text-gray-400' },
      'No case studies are available yet.',
    );
};

export default CaseStudyCollection;
