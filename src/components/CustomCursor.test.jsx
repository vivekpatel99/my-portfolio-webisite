// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import CustomCursor from './CustomCursor';

const queries = {};
const nativeMatchMedia = window.matchMedia;

const installMatchMedia = ({ fine, reduced, legacy = false }) => {
  const state = { '(pointer: fine)': fine, '(prefers-reduced-motion: reduce)': reduced };
  window.matchMedia = vi.fn((media) => {
    const listeners = new Set();
    const query = {
      media,
      get matches() { return state[media]; },
      set: (matches) => { state[media] = matches; listeners.forEach((listener) => listener()); },
      listeners,
    };
    const add = (...args) => listeners.add(args.at(-1));
    const remove = (...args) => listeners.delete(args.at(-1));
    Object.assign(query, { addListener: add, removeListener: remove });
    if (!legacy) Object.assign(query, { addEventListener: add, removeEventListener: remove });
    queries[media] = query;
    return query;
  });
};

const root = document.documentElement;
const dot = (container) => container.querySelector('.rounded-full');

beforeEach(() => root.classList.remove('custom-cursor-enabled'));
afterEach(() => { cleanup(); window.matchMedia = nativeMatchMedia; });

it('owns the enabled class only while the dot is rendered and releases it on unmount', () => {
  installMatchMedia({ fine: true, reduced: false });
  const { container, unmount } = render(<CustomCursor />);
  expect(dot(container)).not.toBeNull();
  expect(root.classList.contains('custom-cursor-enabled')).toBe(true);

  unmount();
  expect(root.classList.contains('custom-cursor-enabled')).toBe(false);
  expect(queries['(pointer: fine)'].listeners.size).toBe(0);
  expect(queries['(prefers-reduced-motion: reduce)'].listeners.size).toBe(0);
});

it('removes and restores the dot and class across reduced-motion changes', () => {
  installMatchMedia({ fine: true, reduced: false });
  const { container } = render(<CustomCursor />);

  act(() => queries['(prefers-reduced-motion: reduce)'].set(true));
  expect(dot(container)).toBeNull();
  expect(root.classList.contains('custom-cursor-enabled')).toBe(false);

  act(() => queries['(prefers-reduced-motion: reduce)'].set(false));
  expect(dot(container)).not.toBeNull();
  expect(root.classList.contains('custom-cursor-enabled')).toBe(true);
});

it('keeps the native cursor on a coarse pointer and follows legacy pointer listeners', () => {
  installMatchMedia({ fine: false, reduced: false, legacy: true });
  const { container, unmount } = render(<CustomCursor />);
  expect(dot(container)).toBeNull();
  expect(root.classList.contains('custom-cursor-enabled')).toBe(false);

  act(() => queries['(pointer: fine)'].set(true));
  expect(root.classList.contains('custom-cursor-enabled')).toBe(true);

  unmount();
  expect(root.classList.contains('custom-cursor-enabled')).toBe(false);
  expect(queries['(pointer: fine)'].listeners.size).toBe(0);
  expect(queries['(prefers-reduced-motion: reduce)'].listeners.size).toBe(0);
});
