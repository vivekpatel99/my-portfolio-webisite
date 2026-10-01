// @vitest-environment jsdom
import React, { Profiler } from 'react';
import { act, cleanup, render, waitFor } from '@testing-library/react';
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
const dot = (container) => container.querySelector('[data-custom-cursor]');
const move = (x, y) => window.dispatchEvent(new MouseEvent('mousemove', { clientX: x, clientY: y }));

const expectDotAt = (cursor, x, y) => {
  expect(cursor.style.transform).toContain(`translateX(${x}px)`);
  expect(cursor.style.transform).toContain(`translateY(${y}px)`);
};

beforeEach(() => root.classList.remove('custom-cursor-enabled'));
afterEach(() => { cleanup(); window.matchMedia = nativeMatchMedia; });

it('keeps the native cursor until the first move and moves without React commits', async () => {
  installMatchMedia({ fine: true, reduced: false });
  const commits = vi.fn();
  const { container } = render(
    <Profiler id="custom-cursor" onRender={commits}>
      <CustomCursor />
    </Profiler>,
  );
  const cursor = dot(container);
  expect(cursor).not.toBeNull();
  expect(cursor.style.visibility).toBe('hidden');
  expect(root.classList.contains('custom-cursor-enabled')).toBe(false);

  const commitsBeforeMovement = commits.mock.calls.length;
  act(() => move(140, 90));
  expect(cursor.style.visibility).toBe('visible');
  await waitFor(() => expectDotAt(cursor, 140, 90));
  expect(root.classList.contains('custom-cursor-enabled')).toBe(true);

  act(() => {
    for (let x = 141; x < 241; x += 1) move(x, 120);
  });
  expect(commits).toHaveBeenCalledTimes(commitsBeforeMovement);
});

it('releases the cursor class and media listeners on unmount', () => {
  installMatchMedia({ fine: true, reduced: false });
  const { container, unmount } = render(<CustomCursor />);
  act(() => move(140, 90));
  expect(dot(container).style.visibility).toBe('visible');
  expect(root.classList.contains('custom-cursor-enabled')).toBe(true);

  unmount();
  expect(root.classList.contains('custom-cursor-enabled')).toBe(false);
  expect(queries['(pointer: fine)'].listeners.size).toBe(0);
  expect(queries['(prefers-reduced-motion: reduce)'].listeners.size).toBe(0);
});

it('resets pointer readiness across reduced-motion changes', async () => {
  installMatchMedia({ fine: true, reduced: false });
  const { container } = render(<CustomCursor />);
  act(() => move(80, 60));
  expect(root.classList.contains('custom-cursor-enabled')).toBe(true);

  act(() => queries['(prefers-reduced-motion: reduce)'].set(true));
  expect(dot(container)).toBeNull();
  expect(root.classList.contains('custom-cursor-enabled')).toBe(false);

  act(() => queries['(prefers-reduced-motion: reduce)'].set(false));
  const restored = dot(container);
  expect(restored).not.toBeNull();
  expect(restored.style.visibility).toBe('hidden');
  expect(root.classList.contains('custom-cursor-enabled')).toBe(false);

  act(() => move(220, 180));
  expect(restored.style.visibility).toBe('visible');
  await waitFor(() => expectDotAt(restored, 220, 180));
  expect(root.classList.contains('custom-cursor-enabled')).toBe(true);
});

it('keeps the native cursor on a coarse pointer and follows legacy pointer listeners', () => {
  installMatchMedia({ fine: false, reduced: false, legacy: true });
  const { container, unmount } = render(<CustomCursor />);
  expect(dot(container)).toBeNull();
  expect(root.classList.contains('custom-cursor-enabled')).toBe(false);

  act(() => queries['(pointer: fine)'].set(true));
  expect(dot(container)).not.toBeNull();
  expect(root.classList.contains('custom-cursor-enabled')).toBe(false);

  act(() => move(50, 70));
  expect(root.classList.contains('custom-cursor-enabled')).toBe(true);

  unmount();
  expect(root.classList.contains('custom-cursor-enabled')).toBe(false);
  expect(queries['(pointer: fine)'].listeners.size).toBe(0);
  expect(queries['(prefers-reduced-motion: reduce)'].listeners.size).toBe(0);
});
