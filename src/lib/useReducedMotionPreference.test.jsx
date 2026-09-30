/**
 * @vitest-environment jsdom
 */
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useReducedMotionPreference } from './useReducedMotionPreference';

function installMatchMedia(initialMatches) {
  const listeners = new Set();
  const query = {
    matches: initialMatches,
    addEventListener: vi.fn((type, listener) => listeners.add(listener)),
    removeEventListener: vi.fn((type, listener) => listeners.delete(listener)),
  };
  window.matchMedia = vi.fn(() => query);
  return {
    query,
    listeners,
    setMatches(matches) {
      query.matches = matches;
      listeners.forEach((listener) => listener({ matches }));
    },
  };
}

describe('useReducedMotionPreference', () => {
  afterEach(() => {
    cleanup();
    delete window.matchMedia;
  });

  it('reads the current reduce preference', () => {
    installMatchMedia(true);
    const { result } = renderHook(() => useReducedMotionPreference());
    expect(result.current).toBe(true);
    expect(window.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
  });

  it('re-renders a mounted component when the preference changes either way', () => {
    const media = installMatchMedia(false);
    const { result } = renderHook(() => useReducedMotionPreference());
    expect(result.current).toBe(false);

    act(() => media.setMatches(true));
    expect(result.current).toBe(true);

    act(() => media.setMatches(false));
    expect(result.current).toBe(false);
  });

  it('removes its listener on unmount', () => {
    const media = installMatchMedia(false);
    const { unmount } = renderHook(() => useReducedMotionPreference());
    expect(media.listeners.size).toBe(1);
    unmount();
    expect(media.listeners.size).toBe(0);
  });

  it('falls back to normal motion without matchMedia', () => {
    delete window.matchMedia;
    const { result } = renderHook(() => useReducedMotionPreference());
    expect(result.current).toBe(false);
  });
});
