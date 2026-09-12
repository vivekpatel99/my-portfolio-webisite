import React, { useEffect, useId, useState } from 'react';
import { collectionCaseStudies } from '../data/caseStudies.js';
import CaseStudyCard from './CaseStudyCard.js';

const PAGE_SIZE = 6;

const historyRecord = () => {
  const state = typeof history === 'undefined' ? null : history.state;
  return state && typeof state === 'object' ? state : {};
};

const initialVisibleCount = (storyCount) => {
  const loadedCount = historyRecord().loadedCount;
  if (!Number.isInteger(loadedCount) || loadedCount < 1) return Math.min(PAGE_SIZE, storyCount);
  return Math.min(loadedCount, storyCount);
};

const persistLoadedPage = (loadedCount) => {
  if (typeof history === 'undefined' || typeof history.replaceState !== 'function') return;
  history.replaceState({
    ...historyRecord(),
    loadedCount,
    scrollY: typeof window === 'undefined' ? 0 : window.scrollY,
  }, '');
};

const CaseStudyCollection = ({ stories = collectionCaseStudies }) => {
  const [visibleCount, setVisibleCount] = useState(() => initialVisibleCount(stories.length));
  const gridId = `case-study-grid-${useId()}`;
  const visibleStories = stories.slice(0, visibleCount);
  const extraStories = stories.slice(visibleCount);
  const hasMore = visibleCount < stories.length;

  useEffect(() => {
    const scrollY = historyRecord().scrollY;
    if (typeof scrollY === 'number') window.scrollTo(0, scrollY);
  }, []);

  if (stories.length === 0) {
    return React.createElement(
      React.Fragment,
      null,
      React.createElement('p', { role: 'status', 'aria-live': 'polite', className: 'mb-6 text-sm text-gray-400' }, 'Showing 0 of 0 case studies'),
      React.createElement('p', { className: 'rounded-lg border border-white/10 bg-white/[0.04] p-8 text-center text-gray-400' }, 'No case studies are available yet.'),
    );
  }

  const loadMore = () => setVisibleCount((count) => {
    const next = Math.min(count + PAGE_SIZE, stories.length);
    persistLoadedPage(next);
    return next;
  });
  const status = React.createElement(
    'p',
    { role: 'status', 'aria-live': 'polite', className: 'mb-6 text-sm text-gray-400' },
    `Showing ${visibleStories.length} of ${stories.length} case studies`,
  );
  const grid = React.createElement(
    'div',
    { id: gridId, className: 'grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3' },
    visibleStories.map((story) => React.createElement(CaseStudyCard, { key: story.slug, project: story })),
  );
  const extraLinks = extraStories.length === 0
    ? null
    : React.createElement(
      'nav',
      { hidden: true, 'aria-label': 'All case studies' },
      extraStories.map((story) => React.createElement('a', { key: story.slug, href: `/project/${story.slug}/` }, story.title)),
    );
  const loadMoreButton = stories.length > PAGE_SIZE
    ? React.createElement(
      'button',
      {
        type: 'button',
        className: 'mt-10 inline-flex min-h-11 items-center rounded-full border border-accent-purple px-5 text-sm font-semibold text-white transition-colors hover:bg-accent-purple disabled:cursor-default disabled:opacity-70',
        onClick: loadMore,
        disabled: !hasMore,
        'aria-controls': gridId,
      },
      hasMore ? 'Load more' : 'All case studies shown',
    )
    : null;

  return React.createElement(React.Fragment, null, status, grid, extraLinks, loadMoreButton);
};

export default CaseStudyCollection;
