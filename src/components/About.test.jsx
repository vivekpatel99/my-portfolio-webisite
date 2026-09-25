/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import About from './About';

vi.mock('framer-motion', () => ({
  motion: new Proxy({}, { get: () => 'div' }),
}));

afterEach(() => {
  cleanup();
});

describe('About', () => {
  it('describes MAGNA work without retired timings', () => {
    render(<About />);
    expect(screen.getByText(/Production inference work for MAGNA International/)).toBeTruthy();
    expect(screen.getByText(/CUDA, ONNX, edge deployment specialist/)).toBeTruthy();
    expect(screen.queryByText(/94%/)).toBeNull();
    expect(screen.queryByText(/37s/)).toBeNull();
    expect(screen.queryByText(/2\.5s/)).toBeNull();
  });

  it('renders craft markers: ABOUT · DETECTED, PHOTO · FIELD, BIO · FIELD', () => {
    render(<About />);
    expect(screen.getByText(/ABOUT ·/i)).toBeInTheDocument();
    expect(screen.getByText(/DETECTED/i)).toBeInTheDocument();
    expect(screen.getAllByText(/PHOTO · FIELD/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/BIO ·/i)).toBeInTheDocument();
  });
});
