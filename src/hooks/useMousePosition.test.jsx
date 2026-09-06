// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import useMousePosition from './useMousePosition';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it('subscribes only while enabled, batches movement, and cancels pending frames on disable', () => {
  let callback;
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => { callback = cb; return 42; });
  const cancel = vi.spyOn(window, 'cancelAnimationFrame');
  const { result, rerender } = renderHook(({ enabled }) => useMousePosition(enabled), { initialProps: { enabled: false } });
  const move = (x) => window.dispatchEvent(new MouseEvent('mousemove', { clientX: x, clientY: 20 }));
  act(() => move(10));
  expect(window.requestAnimationFrame).not.toHaveBeenCalled();
  rerender({ enabled: true });
  act(() => { move(10); move(30); });
  expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1);
  act(() => callback());
  expect(result.current).toEqual({ x: 30, y: 20 });
  act(() => move(40));
  rerender({ enabled: false });
  expect(cancel).toHaveBeenCalledWith(42);
  rerender({ enabled: true });
  act(() => move(50));
  act(() => callback());
  expect(result.current.x).toBe(50);
});
