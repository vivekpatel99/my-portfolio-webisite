import React from 'react';
import { getPublishedRelatedWork } from '../data/relatedWork.js';

// Shared by the prerenderer and React. Ordinary canonical anchors also work
// without JavaScript, and the copy comes only from validated public stories.
export default function RelatedWork({ slugs, className = '' }) {
  const stories = getPublishedRelatedWork(slugs);
  if (!stories.length) return null;
  return React.createElement('section', {
    'aria-label': 'Related work',
    className: `mt-10 border-t border-white/10 pt-6 ${className}`,
  },
  React.createElement('h2', { className: 'mb-4 text-xl font-medium text-white' }, 'Related work'),
  React.createElement('ul', { className: 'space-y-5' }, stories.map((story) => React.createElement('li', { key: story.slug },
    React.createElement('a', {
      href: `/project/${story.slug}/`,
      className: 'related-work-link inline-flex min-h-[44px] items-center text-[#c8abea] underline underline-offset-4 hover:text-[#eee5ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c8abea]',
    }, story.title),
    React.createElement('p', { className: 'mt-1 max-w-[70ch] text-sm leading-relaxed text-[#b6b8c2]' }, story.summary),
  ))));
}
