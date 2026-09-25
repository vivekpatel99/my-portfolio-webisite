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
      className: 'group mb-8 inline-flex min-h-11 items-center gap-2 border border-[rgba(139,92,246,0.4)] px-5 py-2 text-sm font-medium text-white transition-colors hover:border-[#8B5CF6] hover:bg-[rgba(139,92,246,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] focus-visible:ring-offset-4 focus-visible:ring-offset-[#0C0D0D]',
    }, React.createElement(ArrowLeft, { size: 16, 'aria-hidden': true }), 'Back to home'),
    React.createElement(
      'div',
      { className: 'mb-12 max-w-3xl' },
      React.createElement('p', { className: 'mb-4 inline-block font-mono text-[10px] tracking-[0.16em] uppercase text-[#6b7280] px-4 py-1.5 border border-[rgba(139,92,246,0.35)]' }, 'COLLECTION'),
      React.createElement(
        'h1',
        { id: 'case-studies-heading', className: 'text-[clamp(1.75rem,3.2vw,2.35rem)] font-bold uppercase leading-tight tracking-[-0.02em] text-white' },
        'SELECTED ',
        React.createElement('span', { className: 'text-[#8B5CF6]' }, 'CASE STUDIES'),
      ),
      React.createElement('p', { className: 'mt-6 text-lg text-[#9ca3af]' }, 'Explore selected work in data extraction, OCR, automation, and computer vision.'),
    ),
    React.createElement(CaseStudyCollection, { stories: stories ?? collectionCaseStudies }),
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
);

export default CaseStudiesContent;
