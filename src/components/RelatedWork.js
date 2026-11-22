import React from 'react';
import { germanCardCopy } from '../data/caseStudies.de.js';
import { caseStudyArticleHref } from '../lib/caseStudyBrowsing.js';
import { getPublishedRelatedWork } from '../data/relatedWork.js';

// Shared by the prerenderer and React. Ordinary canonical anchors also work
// without JavaScript, and the copy comes only from validated public stories.
export default function RelatedWork({ slugs, className = '', locale = 'en' }) {
  const german = locale === 'de';
  const heading = german ? 'Passende Projekte' : 'Related work';
  const stories = getPublishedRelatedWork(slugs);
  if (!stories.length) return null;
  return React.createElement('section', {
    'aria-label': heading,
    className: `mt-10 border-t border-white/10 pt-6 ${className}`,
  },
  React.createElement('h2', { className: 'mb-4 text-xl font-medium text-white' }, heading),
  React.createElement('ul', { className: 'space-y-5' }, stories.map((story) => {
    const copy = german ? germanCardCopy(story) : {};
    return React.createElement('li', { key: story.slug },
      React.createElement('a', {
        href: caseStudyArticleHref(story.slug, { locale }),
        hrefLang: german ? 'en' : undefined,
        className: 'related-work-link inline-flex min-h-[44px] items-center text-[#c8abea] underline underline-offset-4 hover:text-[#eee5ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c8abea]',
      }, german ? `${copy.title ?? story.title} (auf Englisch)` : story.title),
      React.createElement('p', { className: 'mt-1 max-w-[70ch] text-sm leading-relaxed text-[#b6b8c2]' }, copy.summary ?? story.summary),
    );
  })));
}
