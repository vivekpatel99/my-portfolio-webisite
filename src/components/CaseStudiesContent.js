import React from 'react';
import CaseStudyCollection from './CaseStudyCollection.js';

const CaseStudiesContent = ({ stories }) => React.createElement(
  'section',
  { className: 'bg-[#0C0D0D] py-24', 'aria-labelledby': 'case-studies-heading' },
  React.createElement(
    'div',
    { className: 'container mx-auto px-6' },
    React.createElement(
      'div',
      { className: 'mb-12 max-w-3xl' },
      React.createElement('p', { className: 'mb-4 inline-block rounded-full border border-white/20 px-4 py-1.5 text-sm uppercase' }, 'Case Studies'),
      React.createElement(
        'h1',
        { id: 'case-studies-heading', className: 'text-3xl font-bold uppercase leading-tight text-white md:text-4xl lg:text-5xl' },
        'Selected ',
        React.createElement('span', { className: 'text-accent-purple' }, 'Case Studies'),
      ),
      React.createElement('p', { className: 'mt-6 text-lg text-gray-400' }, 'Explore selected work in data extraction, OCR, automation, and computer vision.'),
    ),
    React.createElement(CaseStudyCollection, { stories }),
  ),
);

export default CaseStudiesContent;
