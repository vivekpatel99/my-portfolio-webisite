/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ScrollToTop from './ScrollToTop';

describe('ScrollToTop', () => {
  let frames;
  beforeEach(() => {
    vi.useFakeTimers();
    frames = new Map();
    let nextFrame = 0;
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback) => {
      frames.set(++nextFrame, callback);
      return nextFrame;
    }));
    vi.stubGlobal('cancelAnimationFrame', vi.fn((frameId) => frames.delete(frameId)));
  });
  const runFrame = () => act(() => {
    const callbacks = [...frames.values()];
    frames.clear();
    callbacks.forEach((callback) => callback(0));
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
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
      <main id="main-content"><button>Source action</button><section id="services">Services</section></main>
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
    expect(document.activeElement).toBe(document.body);
    runFrame();
    expect(document.activeElement).toBe(main);
    expect(main.getAttribute('tabindex')).toBe('-1');

    act(() => main.blur());
    expect(main.hasAttribute('tabindex')).toBe(false);

    act(() => navigate(-1));
    runFrame();
    expect(document.activeElement).toBe(main);
  });

  it('moves focus off a source action still mounted during route navigation', () => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    renderAt('/');
    const main = document.getElementById('main-content');
    const sourceAction = main.querySelector('button');
    sourceAction.focus();
    act(() => navigate('/contact'));
    expect(document.activeElement).toBe(sourceAction);
    runFrame();
    expect(document.activeElement).toBe(main);
  });

  it('starts a new case studies visit at the top and focuses main content', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    renderAt('/');
    scrollTo.mockClear();

    act(() => navigate('/case-studies/'));

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'auto' });
    runFrame();
    expect(document.activeElement).toBe(document.getElementById('main-content'));
  });

  it('preserves collection scroll restoration on Back', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    renderAt('/case-studies/');
    act(() => navigate('/contact'));
    scrollTo.mockClear();

    act(() => navigate(-1));

    expect(scrollTo).not.toHaveBeenCalled();
    runFrame();
    expect(document.activeElement).toBe(document.getElementById('main-content'));
  });

  it('cancels stale route focus when navigation changes to a hash before the frame', () => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    renderAt('/');
    act(() => navigate('/contact'));
    expect(frames.size).toBe(1);
    act(() => navigate('/#services'));
    expect(frames.size).toBe(0);
    act(() => vi.advanceTimersByTime(100));
    const target = document.getElementById('services');
    expect(document.activeElement).toBe(target);
    runFrame();
    expect(document.activeElement).toBe(target);
  });

  it('cancels pending route focus when the router unmounts', () => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const { unmount } = renderAt('/');
    act(() => navigate('/contact'));
    expect(frames.size).toBe(1);
    unmount();
    expect(frames.size).toBe(0);
  });

  it('moves focus to the hash destination after an anchor jump', () => {
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

  it.each(['/#%E0%A4%A', '/#%'])('ignores malformed fragments on cold load: %s', (entry) => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    const setInterval = vi.spyOn(window, 'setInterval');

    expect(() => renderAt(entry)).not.toThrow();
    act(() => vi.advanceTimersByTime(2200));
    runFrame();

    expect(scrollTo).not.toHaveBeenCalled();
    expect(window.HTMLElement.prototype.scrollIntoView).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(document.body);
    expect(setInterval).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each(['/#%E0%A4%A', '/#%'])('ignores malformed fragments after SPA navigation: %s', (entry) => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    const setInterval = vi.spyOn(window, 'setInterval');
    renderAt('/');
    scrollTo.mockClear();
    const sourceAction = document.querySelector('button');
    sourceAction.focus();

    expect(() => act(() => navigate(entry))).not.toThrow();
    act(() => vi.advanceTimersByTime(2200));
    runFrame();

    expect(scrollTo).not.toHaveBeenCalled();
    expect(window.HTMLElement.prototype.scrollIntoView).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(sourceAction);
    expect(setInterval).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('cancels pending anchor retries when the next fragment is malformed', () => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    renderAt('/#services');
    expect(vi.getTimerCount()).toBe(1);

    expect(() => act(() => navigate('/#%'))).not.toThrow();
    act(() => vi.advanceTimersByTime(2200));

    expect(vi.getTimerCount()).toBe(0);
    expect(window.HTMLElement.prototype.scrollIntoView).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(document.body);
  });

  it.each([['%73ervices', 'services'], ['caf%C3%A9', 'café']])('decodes valid fragment #%s before scrolling and focusing', (fragment, id) => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    renderAt(`/#${fragment}`);
    const target = document.getElementById('services');
    target.id = id;
    act(() => vi.advanceTimersByTime(100));

    expect(target.scrollIntoView).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(target);
  });
});
