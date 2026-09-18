/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ScrollToTop from './ScrollToTop';

describe('ScrollToTop', () => {
  afterEach(() => vi.restoreAllMocks());

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
});
