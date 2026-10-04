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

  it('labels the portrait and biography without duplicate detection instructions', () => {
    render(<About />);
    expect(screen.getByRole('heading', { name: 'WHO I AM' })).toBeTruthy();
    expect(screen.getByText('Portrait', { exact: true }).parentElement.contains(screen.getByRole('img', { name: 'Portrait of Vivek Patel' }))).toBe(true);
    expect(screen.queryByText(/ABOUT ·|DETECTED/i)).toBeNull();
    expect(screen.queryByText(/PHOTO · FIELD/i)).toBeNull();
    expect(screen.getByText(/BIO ·/i)).toBeTruthy();
  });

  it('fills the photo panel with the approved portrait', () => {
    render(<About />);
    const portrait = screen.getByRole('img', { name: 'Portrait of Vivek Patel' });
    expect(portrait.getAttribute('src')).toBe('/assets/images/vivek-black-and-white.webp');
  });

  it('shares the portrait derivatives, sized to the lazy photo panel (#252)', () => {
    render(<About />);
    const portrait = screen.getByRole('img', { name: 'Portrait of Vivek Patel' });
    expect(portrait.getAttribute('srcset')).toContain('/assets/images/vivek-black-and-white-480w-3a7a7a1ab19c.webp 480w');
    expect(portrait.getAttribute('srcset')).toContain('/assets/images/vivek-black-and-white.webp 1008w');
    expect(portrait.getAttribute('sizes')).toBe(
      '(min-width: 1216px) 461px, (min-width: 768px) calc(46.5vw - 103px), calc(100vw - 108px)'
    );
    expect(portrait.getAttribute('width')).toBe('1008');
    expect(portrait.getAttribute('height')).toBe('1367');
    expect(portrait.getAttribute('loading')).toBe('lazy');
  });
});
