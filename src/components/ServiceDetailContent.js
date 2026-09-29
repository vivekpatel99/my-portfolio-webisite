import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { HOURLY_FROM_LABEL, serviceTimelineLabel } from '../data/serviceOffers.js';

// Plain .js (no JSX) so tools/generate-static-route-html.js can prerender the
// same service content in Node that the SPA renders in the browser.
export const SERVICES_SECTION_HREF = '/#services';

const scopeList = (heading, items) => React.createElement(
  'div',
  null,
  React.createElement('h2', { className: 'text-2xl font-bold text-white mb-4' }, heading),
  React.createElement(
    'ul',
    { className: 'space-y-3' },
    items.map((item) => React.createElement('li', { key: item, className: 'text-gray-300 text-base leading-relaxed' }, item)),
  ),
);

// `actions` lets the SPA pass its Button-styled CTAs; the static prerender
// falls back to plain links with the same targets.
const defaultActions = React.createElement(
  React.Fragment,
  null,
  React.createElement(Link, { to: '/contact', className: 'text-accent-purple hover:underline' }, 'Request a Project Estimate'),
  React.createElement(Link, { to: SERVICES_SECTION_HREF, className: 'text-accent-purple hover:underline' }, 'View All Services'),
);

const ServiceDetailContent = ({ service, actions = defaultActions }) => React.createElement(
  'div',
  { className: 'min-h-screen bg-[#0C0D0D] py-24' },
  React.createElement(
    'div',
    { className: 'container mx-auto px-6' },
    React.createElement(
      Link,
      { to: SERVICES_SECTION_HREF, className: 'inline-flex items-center gap-2 text-gray-300 hover:text-white transition-colors mb-8' },
      React.createElement(ArrowLeft, { size: 20 }),
      'Back to Services',
    ),
    React.createElement(
      'div',
      { className: 'max-w-4xl' },
      React.createElement('h1', { className: 'text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-white uppercase' }, service.title),
      React.createElement(
        'div',
        { className: 'flex flex-wrap gap-4 text-lg mb-8' },
        React.createElement('p', { className: 'text-white font-semibold' }, HOURLY_FROM_LABEL),
        React.createElement('p', { className: 'text-gray-300' }, serviceTimelineLabel(service)),
      ),
      React.createElement('p', { className: 'text-xl text-gray-300 mb-12 leading-relaxed' }, service.summary),
      React.createElement(
        'div',
        { className: 'grid gap-8 md:grid-cols-2 mb-12' },
        scopeList('In scope', service.inScope),
        scopeList('Out of scope', service.outOfScope),
      ),
      React.createElement('div', { className: 'flex flex-wrap gap-4' }, actions),
    ),
  ),
);

export default ServiceDetailContent;
