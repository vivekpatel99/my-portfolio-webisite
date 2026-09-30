/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { collectionCaseStudies, otherWorkCaseStudies } from '../data/caseStudies.js';
import { CASE_STUDY_BROWSING_STORAGE_KEY, clearBrowsingState } from '../lib/caseStudyBrowsing.js';
import CaseStudiesContent from './CaseStudiesContent.js';

const savedSnapshot = () => JSON.parse(sessionStorage.getItem(CASE_STUDY_BROWSING_STORAGE_KEY));
const otherWorkLinks = () => within(screen.getByRole('region', { name: /other work/i }))
  .getAllByRole('link', { name: /Read case study:/ });
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

  const initialCoreCount = Math.min(6, collectionCaseStudies.length);
  const otherWorkIndices = otherWorkCaseStudies.map((_, index) => index);
  const coreLinks = () => within(document.querySelector('[id^="case-study-grid-"]'))
    .getAllByRole('link', { name: /Read case study:/ });
  const loadAll = async (user) => {
    const loadMore = screen.getByRole('button', { name: /Load more|All case studies shown/ });
    for (let clicks = 0; clicks < collectionCaseStudies.length && coreLinks().length < collectionCaseStudies.length; clicks += 1) {
      await user.click(loadMore);
    }
    expect(coreLinks()).toHaveLength(collectionCaseStudies.length);
    expect(loadMore.textContent).toBe('All case studies shown');
  };
  const returnToCollection = (page) => {
    page.unmount();
    history.replaceState(null, '');
    return renderContent(['/case-studies/?resume=1']);
  };

  it('renders every Other Work card beside a paginated core collection', () => {
    renderContent();
    expect(otherWorkCaseStudies.length).toBeGreaterThan(0);
    expect(collectionCaseStudies.length).toBeGreaterThan(initialCoreCount);
    expect(otherWorkLinks()).toHaveLength(otherWorkCaseStudies.length);
  });

  it.each(otherWorkIndices)('fresh session: Other Work card %i saves its departure and resume restores it', (index) => {
    const first = renderContent();
    otherWorkLinks()[index].dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
    expect(savedSnapshot()).toEqual({ loadedCount: initialCoreCount, scrollY: 1388.5 });
    expect(history.state.caseStudyCollection).toEqual({ loadedCount: initialCoreCount, scrollY: 1388.5 });

    returnToCollection(first);
    expect(scrollTo).toHaveBeenCalledWith({ top: 1388.5, left: 0, behavior: 'instant' });
    expect(coreLinks()).toHaveLength(initialCoreCount);
    expect(otherWorkLinks()).toHaveLength(otherWorkCaseStudies.length);
  });

  it.each(otherWorkIndices)('stale core session: Other Work card %i overwrites the saved core snapshot', async (index) => {
    const user = userEvent.setup();
    const first = renderContent();
    scrollY.mockReturnValue(420);
    await user.click(coreLinks()[1]);
    expect(savedSnapshot()).toEqual({ loadedCount: initialCoreCount, scrollY: 420 });

    const returned = returnToCollection(first);
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 420, left: 0, behavior: 'instant' });
    scrollY.mockReturnValue(2210);
    await user.click(otherWorkLinks()[index]);
    expect(savedSnapshot()).toEqual({ loadedCount: initialCoreCount, scrollY: 2210 });

    returnToCollection(returned);
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 2210, left: 0, behavior: 'instant' });
    expect(coreLinks()).toHaveLength(initialCoreCount);
  });

  it.each(otherWorkIndices)('after Load more: Other Work card %i saves and restores the loaded count', async (index) => {
    const user = userEvent.setup();
    const first = renderContent();
    await loadAll(user);
    const loadedCount = collectionCaseStudies.length;
    expect(savedSnapshot()).toEqual({ loadedCount, scrollY: 0 });

    scrollY.mockReturnValue(2210);
    await user.click(otherWorkLinks()[index]);
    expect(savedSnapshot()).toEqual({ loadedCount, scrollY: 2210 });

    returnToCollection(first);
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 2210, left: 0, behavior: 'instant' });
    expect(coreLinks()).toHaveLength(loadedCount);
  });

  it('saves on middle-click and keyboard activation of Other Work cards', async () => {
    const user = userEvent.setup();
    renderContent();

    otherWorkLinks()[0].dispatchEvent(new MouseEvent('auxclick', { bubbles: true, cancelable: true, button: 1 }));
    expect(savedSnapshot()).toEqual({ loadedCount: initialCoreCount, scrollY: 1388.5 });

    clearBrowsingState({ storage: sessionStorage });
    scrollY.mockReturnValue(1500);
    otherWorkLinks().at(-1).focus();
    await user.keyboard('{Enter}');
    expect(savedSnapshot()).toEqual({ loadedCount: initialCoreCount, scrollY: 1500 });
  });

  it('still saves core card departures', () => {
    renderContent();
    scrollY.mockReturnValue(640);
    coreLinks()[0].dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
    expect(savedSnapshot()).toEqual({ loadedCount: initialCoreCount, scrollY: 640 });
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
