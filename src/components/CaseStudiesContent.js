import React from 'react';
import { ArrowLeft } from 'lucide-react';
import CaseStudyCollection from './CaseStudyCollection.js';

const CaseStudiesContent = ({ stories }) => React.createElement(
  'section',
  { className: 'bg-[#0C0D0D] py-24', 'aria-labelledby': 'case-studies-heading' },
  React.createElement(
    'div',
    { className: 'container mx-auto px-6' },
    React.createElement('a', {
      href: '/',
      className: 'group mb-8 inline-flex min-h-11 items-center gap-2 rounded-full border border-accent-purple/40 px-5 py-2 text-sm font-medium text-white transition-colors hover:border-accent-purple hover:bg-accent-purple/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-purple focus-visible:ring-offset-4 focus-visible:ring-offset-[#0C0D0D]',
    }, React.createElement(ArrowLeft, { size: 16, 'aria-hidden': true }), 'Back to home'),
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
