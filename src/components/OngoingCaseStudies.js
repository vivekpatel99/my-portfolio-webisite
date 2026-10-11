import React from 'react';
import { Link, useInRouterContext } from 'react-router-dom';
import { DetectionLabel } from './DetectionFrame.js';

const OngoingCaseStudies = ({ stories = [] }) => {
  const inRouter = useInRouterContext();
  if (stories.length === 0) return null;
  const NavigationLink = inRouter ? Link : 'a';
  const destination = inRouter ? 'to' : 'href';
  return React.createElement(
    'section',
    {
      id: 'in-progress',
      className: 'mt-16',
      'aria-labelledby': 'ongoing-case-studies-heading',
    },
    React.createElement(
      'h2',
      {
        id: 'ongoing-case-studies-heading',
        className: 'detection-heading text-[clamp(1.5rem,2.6vw,2rem)] font-bold leading-tight tracking-[-0.02em] text-white',
      },
      React.createElement(DetectionLabel, { 'aria-hidden': true }, 'WORK IN PROGRESS'),
      'In progress',
    ),
    React.createElement(
      'p',
      { className: 'mt-6 max-w-3xl text-lg text-[#9ca3af]' },
      'Prototype work with unfinished features.',
    ),
    React.createElement(
      'ul',
      { className: 'mt-8 max-w-3xl list-none space-y-6 p-0' },
      stories.map((story) => {
        const summary = story.summary;
        return React.createElement(
          'li',
          { key: story.slug },
          React.createElement(
            NavigationLink,
            {
              className: 'block rounded-sm text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8B5CF6]',
              [destination]: `/project/${story.slug}/`,
            },
            React.createElement('span', { className: 'block font-semibold' }, story.title),
            ' ',
            React.createElement('span', { className: 'mt-1 block text-sm text-[#8B5CF6]' }, 'In progress'),
            summary
              ? React.createElement('span', { className: 'mt-2 block text-base font-normal text-[#9ca3af]' }, summary)
              : null,
          ),
        );
      }),
    ),
  );
};

export default OngoingCaseStudies;
