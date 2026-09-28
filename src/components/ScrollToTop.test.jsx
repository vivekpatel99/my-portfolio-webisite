/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ScrollToTop from './ScrollToTop';

describe('ScrollToTop', () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  let navigate;
  const NavigateProbe = () => {
    navigate = useNavigate();
    return null;
  };
  const renderAt = (entry) => render(
    <MemoryRouter initialEntries={[entry]}>
      <ScrollToTop />
      <NavigateProbe />
      <a href="/#services">Services</a>
      <main id="main-content"><section id="services">Services</section></main>
    </MemoryRouter>,
  );

  it('leaves collection scroll restoration to the collection view', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

    render(<MemoryRouter initialEntries={['/case-studies/']}><ScrollToTop /></MemoryRouter>);

    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('resets ordinary route navigation to the top', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

    render(<MemoryRouter initialEntries={['/contact']}><ScrollToTop /></MemoryRouter>);

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'auto' });
  });

  it('keeps initial page-load focus at the document start', () => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

    renderAt('/contact');

    expect(document.activeElement).toBe(document.body);
  });

  it('moves focus to main content after route navigation and after Back', () => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    renderAt('/');
    const main = document.getElementById('main-content');

    act(() => navigate('/contact'));
    expect(document.activeElement).toBe(main);
    expect(main.getAttribute('tabindex')).toBe('-1');

    act(() => main.blur());
    expect(main.hasAttribute('tabindex')).toBe(false);

    act(() => navigate(-1));
    expect(document.activeElement).toBe(main);
  });

  it('starts a new case studies visit at the top and focuses main content', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    renderAt('/');
    scrollTo.mockClear();

    act(() => navigate('/case-studies/'));

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'auto' });
    expect(document.activeElement).toBe(document.getElementById('main-content'));
  });

  it('preserves collection scroll restoration on Back', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    renderAt('/case-studies/');
    act(() => navigate('/contact'));
    scrollTo.mockClear();

    act(() => navigate(-1));

    expect(scrollTo).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(document.getElementById('main-content'));
  });

  it('moves focus to the hash destination after an anchor jump', () => {
    vi.useFakeTimers();
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    renderAt('/');
    const link = document.querySelector('a[href="/#services"]');
    link.focus();

    act(() => navigate('/#services'));
    act(() => vi.advanceTimersByTime(100));

    const target = document.getElementById('services');
    expect(target.scrollIntoView).toHaveBeenCalled();
    expect(document.activeElement).toBe(target);
  });

  it('refocuses a hash destination when navigating to the same hash again', () => {
    vi.useFakeTimers();
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    renderAt('/#services');
    act(() => vi.advanceTimersByTime(100));
    const target = document.getElementById('services');
    target.blur();

    act(() => navigate('/#services'));
    act(() => vi.advanceTimersByTime(100));

    expect(document.activeElement).toBe(target);
    expect(target.scrollIntoView).toHaveBeenCalledTimes(2);
  });
});
