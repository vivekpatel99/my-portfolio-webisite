/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { StaticRouter } from 'react-router-dom/server';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { collectionCaseStudies } from '../data/caseStudies.js';
import { CASE_STUDY_BROWSING_STORAGE_KEY, clearBrowsingState } from '../lib/caseStudyBrowsing.js';
import CaseStudiesContent from './CaseStudiesContent.js';

const savedSnapshot = () => JSON.parse(sessionStorage.getItem(CASE_STUDY_BROWSING_STORAGE_KEY));
const migratedSlugs = ['ai-project-planning-assistant', 'python-ci-workflow-automation'];
const migratedLink = (slug) => {
  const links = document.querySelectorAll(`[id^="case-study-grid-"] a[href="/project/${slug}/?from=collection"]`);
  expect(links).toHaveLength(1);
  return links[0];
};
const renderContent = (initialEntries = ['/case-studies/']) => render(
  <MemoryRouter initialEntries={initialEntries}><CaseStudiesContent /></MemoryRouter>,
);

describe('CaseStudiesContent collection return', () => {
  let scrollY;
  let scrollTo;

  beforeEach(() => {
    scrollY = vi.spyOn(window, 'scrollY', 'get').mockReturnValue(1388.5);
    scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    scrollY.mockRestore();
    scrollTo.mockRestore();
    clearBrowsingState({ storage: sessionStorage });
    history.replaceState(null, '');
  });

  const initialCount = Math.min(6, collectionCaseStudies.length);
  const collectionLinks = () => within(document.querySelector('[id^="case-study-grid-"]'))
    .getAllByRole('link', { name: /Read case study:/ });
  const loadAll = async (user) => {
    const loadMore = screen.getByRole('button', { name: /Load more|All case studies shown/ });
    for (let clicks = 0; clicks < collectionCaseStudies.length && collectionLinks().length < collectionCaseStudies.length; clicks += 1) {
      await user.click(loadMore);
    }
    expect(collectionLinks()).toHaveLength(collectionCaseStudies.length);
    expect(loadMore.textContent).toBe('All case studies shown');
  };
  const returnToCollection = (page) => {
    page.unmount();
    history.replaceState(null, '');
    return renderContent(['/case-studies/?resume=1']);
  };

  it('paginates all twelve stories in one grid with each migrated story once', async () => {
    const user = userEvent.setup();
    renderContent();
    expect(collectionLinks()).toHaveLength(6);
    expect(screen.getByRole('status').textContent).toBe('Showing 6 of 12 case studies');
    expect(screen.queryByRole('region', { name: /other work/i })).toBeNull();
    expect(screen.queryByRole('heading', { name: /other work/i })).toBeNull();
    await loadAll(user);
    expect(collectionLinks()).toHaveLength(12);
    migratedSlugs.forEach((slug) => expect(migratedLink(slug)).toBeTruthy());
  });

  it.each(migratedSlugs)('fresh session: %s saves its departure and resume restores twelve cards', async (slug) => {
    const user = userEvent.setup();
    const first = renderContent();
    await loadAll(user);
    migratedLink(slug).dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
    expect(savedSnapshot()).toEqual({ loadedCount: 12, scrollY: 1388.5 });
    expect(history.state.caseStudyCollection).toEqual({ loadedCount: 12, scrollY: 1388.5 });

    returnToCollection(first);
    expect(scrollTo).toHaveBeenCalledWith({ top: 1388.5, left: 0, behavior: 'instant' });
    expect(collectionLinks()).toHaveLength(12);
    expect(migratedLink(slug)).toBeTruthy();
  });

  it.each(migratedSlugs)('stale session: %s replaces the first-batch snapshot after Load more', async (slug) => {
    const user = userEvent.setup();
    const first = renderContent();
    scrollY.mockReturnValue(420);
    await user.click(collectionLinks()[1]);
    expect(savedSnapshot()).toEqual({ loadedCount: initialCount, scrollY: 420 });

    const returned = returnToCollection(first);
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 420, left: 0, behavior: 'instant' });
    await loadAll(user);
    scrollY.mockReturnValue(2210);
    await user.click(migratedLink(slug));
    expect(savedSnapshot()).toEqual({ loadedCount: 12, scrollY: 2210 });

    returnToCollection(returned);
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 2210, left: 0, behavior: 'instant' });
    expect(collectionLinks()).toHaveLength(12);
  });

  it.each(migratedSlugs)('after Load more: %s saves and restores the loaded count', async (slug) => {
    const user = userEvent.setup();
    const first = renderContent();
    await loadAll(user);
    const loadedCount = collectionCaseStudies.length;
    expect(savedSnapshot()).toEqual({ loadedCount, scrollY: 0 });

    scrollY.mockReturnValue(2210);
    await user.click(migratedLink(slug));
    expect(savedSnapshot()).toEqual({ loadedCount, scrollY: 2210 });

    returnToCollection(first);
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 2210, left: 0, behavior: 'instant' });
    expect(collectionLinks()).toHaveLength(loadedCount);
  });

  it('saves on middle-click and keyboard activation of migrated cards', async () => {
    const user = userEvent.setup();
    renderContent();
    await loadAll(user);

    migratedLink(migratedSlugs[0]).dispatchEvent(new MouseEvent('auxclick', { bubbles: true, cancelable: true, button: 1 }));
    expect(savedSnapshot()).toEqual({ loadedCount: 12, scrollY: 1388.5 });

    clearBrowsingState({ storage: sessionStorage });
    scrollY.mockReturnValue(1500);
    migratedLink(migratedSlugs[1]).focus();
    await user.keyboard('{Enter}');
    expect(savedSnapshot()).toEqual({ loadedCount: 12, scrollY: 1500 });
  });

  it('restores a legacy ten-card snapshot and loads the final two cards', async () => {
    const user = userEvent.setup();
    sessionStorage.setItem(CASE_STUDY_BROWSING_STORAGE_KEY, JSON.stringify({ loadedCount: 10, scrollY: 960 }));
    renderContent(['/case-studies/?resume=1']);
    expect(collectionLinks()).toHaveLength(10);
    expect(scrollTo).toHaveBeenCalledWith({ top: 960, left: 0, behavior: 'instant' });
    await user.click(screen.getByRole('button', { name: 'Load more' }));
    expect(collectionLinks()).toHaveLength(12);
    expect(savedSnapshot()).toEqual({ loadedCount: 12, scrollY: 0 });
    migratedSlugs.forEach((slug) => expect(migratedLink(slug)).toBeTruthy());
  });

  it('includes both migrated stories in the static remaining-links navigation', () => {
    vi.stubGlobal('window', undefined);
    let markup;
    try {
      markup = renderToStaticMarkup(<StaticRouter location="/case-studies/"><CaseStudiesContent /></StaticRouter>);
    } finally {
      vi.unstubAllGlobals();
    }
    expect(markup.match(/<article/g)).toHaveLength(6);
    expect(markup).toContain('Showing 6 of 12 case studies');
    const noscript = markup.match(/<noscript>(.*?)<\/noscript>/)[1];
    migratedSlugs.forEach((slug) => {
      expect(noscript.split(`href="/project/${slug}/"`)).toHaveLength(2);
    });
    expect(markup).not.toContain('OTHER WORK');
  });

  it('still saves core card departures', () => {
    renderContent();
    scrollY.mockReturnValue(640);
    collectionLinks()[0].dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
    expect(savedSnapshot()).toEqual({ loadedCount: initialCount, scrollY: 640 });
  });

  it('does not save for non-collection controls inside the page', () => {
    renderContent();
    screen.getByRole('link', { name: 'Back to home' })
      .dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
    screen.getByRole('button', { name: 'Load more' })
      .dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
    expect(savedSnapshot()).toBeNull();
  });
});
