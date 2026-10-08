import React from 'react';
import { DetectionLabel } from './DetectionFrame.js';
import { collectionCaseStudies } from '../data/caseStudies.js';
import CaseStudyCollection from './CaseStudyCollection.js';

const CaseStudiesContent = ({ stories }) => React.createElement(
  'section',
  { className: 'bg-[#0C0D0D] py-24 px-7 md:px-12', 'aria-labelledby': 'case-studies-heading' },
  React.createElement(
    'div',
    { className: 'max-w-[1180px] mx-auto' },
    React.createElement(
      'div',
      { className: 'mb-12 max-w-3xl' },
      React.createElement(
        'h1',
        { id: 'case-studies-heading', className: 'detection-heading text-[clamp(1.75rem,3.2vw,2.35rem)] font-bold uppercase leading-tight tracking-[-0.02em] text-white' },
        React.createElement(DetectionLabel, { 'aria-hidden': true }, 'PREVIOUS WORK'),
        'SELECTED ',
        React.createElement('span', { className: 'text-[#8B5CF6]' }, 'CASE STUDIES'),
      ),
      React.createElement('p', { className: 'mt-6 text-lg text-[#9ca3af]' }, 'Explore selected work in data extraction, OCR, automation, and computer vision.'),
    ),
    React.createElement(
      CaseStudyCollection,
      { stories: stories ?? collectionCaseStudies },
    ),
  ),
);

export default CaseStudiesContent;
