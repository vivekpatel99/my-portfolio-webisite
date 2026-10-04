/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import About from './About';
import { profileImages } from '@/config/links';

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

  it('uses an About-specific crop without replacing the shared original', () => {
    render(<About />);
    const portrait = screen.getByRole('img', { name: 'Portrait of Vivek Patel' });
    expect(portrait.getAttribute('src')).toBe(profileImages.aboutPortrait);
    expect(portrait.getAttribute('src')).not.toBe(profileImages.portrait);
  });

  it('reserves the crop dimensions and responsive sources in the lazy 4:3 panel (#298)', () => {
    render(<About />);
    const portrait = screen.getByRole('img', { name: 'Portrait of Vivek Patel' });
    expect(portrait.getAttribute('srcset')).toBe(profileImages.aboutPortraitSrcSet);
    expect(portrait.getAttribute('sizes')).toBe(
      '(min-width: 1216px) 465px, (min-width: 768px) calc((100vw - 114px) / 2.15 - 48px), calc(100vw - 104px)'
    );
    expect(portrait.getAttribute('width')).toBe('800');
    expect(portrait.getAttribute('height')).toBe('664');
    expect(portrait.getAttribute('loading')).toBe('lazy');
  });
});
