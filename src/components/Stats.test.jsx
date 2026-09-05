// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import Stats from './Stats';

vi.mock('framer-motion', () => ({
  useInView: () => true,
  motion: { div: ({ children, initial, whileInView, viewport, transition, ...props }) => <div {...props}>{children}</div> },
}));

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it('finishes decimal counts and cancels pending animation when unmounted', () => {
  let callback;
  let frame = 0;
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => { callback = cb; return ++frame; });
  const cancel = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  const stats = [{ value: 2.5, suffix: 's', label: 'Inference', description: 'Measured result' }];
  const { unmount } = render(<Stats customStats={stats} />);
  act(() => callback(100));
  act(() => callback(2100));
  expect(screen.getByText('2.5s')).toBeTruthy();
  unmount();
  expect(cancel).toHaveBeenCalledWith(frame);
});

it('cancels an unfinished count when leaving a project', () => {
  vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(73);
  const cancel = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  const { unmount } = render(<Stats customStats={[{ value: 100, suffix: '%', label: 'Success' }]} />);
  unmount();
  expect(cancel).toHaveBeenCalledWith(73);
});
