import React, { useEffect, useId, useState } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import { collectionCaseStudies } from '../data/caseStudies.js';
import {
  getInitialBrowsingState,
  saveBrowsingState,
} from '../lib/caseStudyBrowsing.js';
import CaseStudyCard from './CaseStudyCard.js';

const PAGE_SIZE = 6;

const CaseStudyCollection = ({ stories = collectionCaseStudies }) => {
  const location = useLocation();
  const navigationType = useNavigationType();
  const resumeRequested = new URLSearchParams(location.search).get('resume') === '1';
  const restorableEntry = resumeRequested || (
    navigationType === 'POP'
    && typeof window !== 'undefined'
    && Boolean(window.history.state?.caseStudyCollection)
  );
  const [initialState] = useState(() => getInitialBrowsingState({
    eligibleCount: stories.length,
    navigationType: restorableEntry ? 'POP' : 'PUSH',
    resume: restorableEntry,
    snapshot: !resumeRequested && typeof window !== 'undefined' ? window.history.state?.caseStudyCollection : undefined,
  }));
  const [visibleCount, setVisibleCount] = useState(initialState.loadedCount);
  const gridId = `case-study-grid-${useId()}`;
  const visibleStories = stories.slice(0, visibleCount);
  const hasMore = visibleCount < stories.length;

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    window.history.replaceState({ ...window.history.state, caseStudyCollection: initialState }, '');
    const frame = window.requestAnimationFrame(() => {
      window.scrollTo({ top: initialState.scrollY, left: 0, behavior: 'auto' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [initialState.scrollY]);

  if (stories.length === 0) {
    return React.createElement(
      React.Fragment,
      null,
      React.createElement('p', { role: 'status', 'aria-live': 'polite', className: 'mb-6 text-sm text-gray-400' }, 'Showing 0 of 0 case studies'),
      React.createElement('p', { className: 'rounded-lg border border-white/10 bg-white/[0.04] p-8 text-center text-gray-400' }, 'No case studies are available yet.'),
    );
  }

  const loadMore = () => setVisibleCount((count) => Math.min(count + PAGE_SIZE, stories.length));
  const saveBeforeArticle = () => {
    const savedState = saveBrowsingState(
      { loadedCount: visibleCount, scrollY: typeof window === 'undefined' ? 0 : window.scrollY },
      { eligibleCount: stories.length },
    );
    if (typeof window !== 'undefined') {
      window.history.replaceState({ ...window.history.state, caseStudyCollection: savedState }, '');
    }
  };
  const status = React.createElement(
    'p',
    { role: 'status', 'aria-live': 'polite', className: 'mb-6 text-sm text-gray-400' },
    `Showing ${visibleStories.length} of ${stories.length} case studies`,
  );
  const grid = React.createElement(
    'div',
    { id: gridId, className: 'grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3' },
    visibleStories.map((story) => React.createElement(CaseStudyCard, {
      key: story.slug,
      project: story,
      onClickCapture: saveBeforeArticle,
    })),
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

  return React.createElement(React.Fragment, null, status, grid, loadMoreButton);
};

export default CaseStudyCollection;
