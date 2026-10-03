import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { collectionCaseStudies, otherWorkCaseStudies } from '../data/caseStudies.js';
import CaseStudyCard from './CaseStudyCard.js';
import CaseStudyCollection from './CaseStudyCollection.js';

const CaseStudiesContent = ({ stories }) => React.createElement(
  'section',
  { className: 'bg-[#0C0D0D] py-24 px-7 md:px-12', 'aria-labelledby': 'case-studies-heading' },
  React.createElement(
    'div',
    { className: 'max-w-[1180px] mx-auto' },
    React.createElement('a', {
      href: '/',
      className: 'detection-panel detection-action detection-action--compact mb-8 inline-flex',
    }, React.createElement(ArrowLeft, { size: 16, 'aria-hidden': true }), 'Back to home'),
    React.createElement(
      'div',
      { className: 'mb-12 max-w-3xl' },
      React.createElement(
        'h1',
        { id: 'case-studies-heading', className: 'text-[clamp(1.75rem,3.2vw,2.35rem)] font-bold uppercase leading-tight tracking-[-0.02em] text-white' },
        'SELECTED ',
        React.createElement('span', { className: 'text-[#8B5CF6]' }, 'CASE STUDIES'),
      ),
      React.createElement('p', { className: 'mt-6 text-lg text-[#9ca3af]' }, 'Explore selected work in data extraction, OCR, automation, and computer vision.'),
    ),
    React.createElement(
      CaseStudyCollection,
      { stories: stories ?? collectionCaseStudies },
      otherWorkCaseStudies.length === 0 ? null : React.createElement(
        'section',
        { className: 'mt-16', 'aria-labelledby': 'other-work-heading' },
        React.createElement(
          'div',
          { className: 'mb-12 max-w-3xl' },
          React.createElement(
            'h2',
            { id: 'other-work-heading', className: 'text-2xl font-bold uppercase leading-tight text-white' },
            'OTHER WORK',
          ),
          React.createElement('p', { className: 'mt-6 text-lg text-[#9ca3af]' }, 'Published work outside the main extraction, OCR, and computer vision collection.'),
        ),
        React.createElement(
          'div',
          { className: 'grid grid-cols-1 gap-[22px] md:grid-cols-2 lg:grid-cols-3' },
          otherWorkCaseStudies.map((project) => React.createElement(CaseStudyCard, {
            key: project.slug,
            project,
            fromCollection: true,
          })),
        ),
      ),
    ),
  ),
);

export default CaseStudiesContent;
