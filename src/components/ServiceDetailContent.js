import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { HOURLY_FROM_LABEL, serviceOffers, serviceTimelineLabel } from '../data/serviceOffers.js';

// Plain .js (no JSX) so tools/generate-static-route-html.js can prerender the
// same service content in Node that the SPA renders in the browser.
export const SERVICES_SECTION_HREF = '/#services';

const frameCorners = () => React.createElement(
  React.Fragment,
  null,
  React.createElement('span', {
    'aria-hidden': true,
    className: 'pointer-events-none absolute left-[5px] top-[5px] h-4 w-4 border-l-[1.5px] border-t-[1.5px] border-[#8B5CF6]',
  }),
  React.createElement('span', {
    'aria-hidden': true,
    className: 'pointer-events-none absolute bottom-[5px] right-[5px] h-4 w-4 border-b-[1.5px] border-r-[1.5px] border-white/50',
  }),
);

const scopeList = (heading, items, index) => React.createElement(
  'section',
  { className: 'min-w-0 px-6 py-7 sm:px-8 sm:py-9' },
  React.createElement(
    'div',
    { className: 'mb-6 flex items-center gap-3' },
    React.createElement('span', { 'aria-hidden': true, className: 'font-mono text-xs text-[#a78bfa]' }, index),
    React.createElement('h2', { className: 'font-mono text-xs font-medium uppercase tracking-[0.16em] text-white' }, heading),
  ),
  React.createElement(
    'ul',
    { className: 'border-t border-white/10' },
    items.map((item) => React.createElement(
      'li',
      { key: item, className: 'flex gap-4 border-b border-white/10 py-3.5 text-sm leading-relaxed text-[#c5c6cd] sm:text-base' },
      React.createElement('span', { 'aria-hidden': true, className: 'mt-[0.6em] h-1.5 w-1.5 shrink-0 bg-[#8B5CF6]' }),
      item,
    )),
  ),
);

const ServiceDetailContent = ({ service }) => {
  const offerNumber = String(serviceOffers.findIndex((offer) => offer.id === service.id) + 1).padStart(2, '0');

  return React.createElement(
    'div',
    { className: 'relative min-h-screen overflow-hidden bg-[#0C0D0D] pb-24 pt-10 text-white md:pt-14' },
    React.createElement('div', {
      'aria-hidden': true,
      className: 'pointer-events-none absolute left-1/2 top-0 h-[540px] w-[850px] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(88,49,160,0.13),transparent_68%)]',
    }),
    React.createElement(
      'div',
      { className: 'relative mx-auto max-w-[1180px] px-6 md:px-12' },
      React.createElement(
        Link,
        { to: SERVICES_SECTION_HREF, className: 'mb-12 inline-flex min-h-11 items-center gap-2 font-mono text-xs uppercase tracking-[0.13em] text-[#a8aab5] transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8B5CF6] md:mb-16' },
        React.createElement(ArrowLeft, { size: 16, 'aria-hidden': true }),
        'Back to Services',
      ),
      React.createElement(
        'div',
        { className: 'grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(330px,0.8fr)] lg:items-start lg:gap-16' },
        React.createElement(
          'header',
          { className: 'max-w-[700px]' },
          React.createElement(
            'p',
            { className: 'mb-6 font-mono text-[11px] uppercase tracking-[0.19em] text-[#a78bfa]' },
            'SERVICE · OFFER ', offerNumber,
          ),
          React.createElement('h1', { className: 'max-w-[760px] text-[clamp(2.25rem,5.4vw,4.25rem)] font-bold uppercase leading-[1.06] tracking-[-0.035em]' }, service.title),
          React.createElement('div', { 'aria-hidden': true, className: 'my-8 h-px w-20 bg-[#8B5CF6]' }),
          React.createElement('p', { className: 'max-w-[640px] text-base leading-[1.75] text-[#b6b8c2] sm:text-lg' }, service.summary),
        ),
        React.createElement(
          'aside',
          { 'aria-label': 'Engagement details', className: 'relative border border-[rgba(139,92,246,0.45)] bg-[#121116]/80 p-6 sm:p-8' },
          frameCorners(),
          React.createElement('p', { className: 'mb-7 font-mono text-[11px] uppercase tracking-[0.16em] text-[#a78bfa]' }, 'ENGAGEMENT DETAILS'),
          React.createElement(
            'dl',
            { className: 'mb-8 border-y border-white/10' },
            React.createElement(
              'div',
              { className: 'grid grid-cols-[72px_1fr] gap-4 border-b border-white/10 py-4 sm:grid-cols-[90px_1fr]' },
              React.createElement('dt', { className: 'font-mono text-[11px] uppercase tracking-[0.12em] text-[#8f919e]' }, 'Rate'),
              React.createElement('dd', { className: 'text-sm font-semibold text-white sm:text-base' }, HOURLY_FROM_LABEL),
            ),
            React.createElement(
              'div',
              { className: 'grid grid-cols-[72px_1fr] gap-4 py-4 sm:grid-cols-[90px_1fr]' },
              React.createElement('dt', { className: 'font-mono text-[11px] uppercase tracking-[0.12em] text-[#8f919e]' }, 'Timeline'),
              React.createElement('dd', { className: 'text-sm font-semibold text-white sm:text-base' }, serviceTimelineLabel(service)),
            ),
          ),
          React.createElement(
            'div',
            { className: 'flex flex-col gap-3' },
            React.createElement(Link, {
              to: '/contact',
              className: 'inline-flex min-h-12 items-center justify-center bg-[#8B5CF6] px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-[#7c4ee3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white',
            }, 'Request a Project Estimate'),
            React.createElement(Link, {
              to: SERVICES_SECTION_HREF,
              className: 'inline-flex min-h-12 items-center justify-center border border-white/25 px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:border-[#8B5CF6] hover:text-[#c4a9ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8B5CF6]',
            }, 'View All Services'),
          ),
        ),
      ),
      React.createElement(
        'div',
        { className: 'relative mt-16 border border-[rgba(139,92,246,0.45)] bg-[#101014]/70 md:mt-20' },
        frameCorners(),
        React.createElement('div', { className: 'grid divide-y divide-white/10 md:grid-cols-2 md:divide-x md:divide-y-0' },
          scopeList('In scope', service.inScope, '01'),
          scopeList('Out of scope', service.outOfScope, '02'),
        ),
      ),
    ),
  );
};

export default ServiceDetailContent;
