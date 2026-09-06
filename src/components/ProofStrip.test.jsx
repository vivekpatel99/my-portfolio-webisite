/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import ProofStrip from './ProofStrip';
import { approvedProof } from '@/data/positioning';

afterEach(cleanup);

describe('ProofStrip', () => {
  it('renders the dated, verified credential and its source link', () => {
    render(<ProofStrip />);

    expect(screen.getByRole('region', { name: /evidence and working focus/i })).toBeTruthy();
    expect(screen.getByText('Top Rated Plus')).toBeTruthy();
    expect(screen.getByText(/checked 6 september 2026/i)).toBeTruthy();
    expect(screen.getByRole('link', { name: /top rated plus.*checked 6 september 2026/i }).getAttribute('href')).toBe(approvedProof.upwork.href);
  });

  it('shows process focus without presenting unverified marketplace metrics', () => {
    const { container } = render(<ProofStrip />);
    const text = container.textContent;

    expect(text).toContain('Structured, reviewable data');
    expect(text).toContain('Validation and handoff');
    for (const unsupportedMetric of ['100% Job Success', '21+ Projects', '300+ Hours', '94% Faster']) {
      expect(text).not.toContain(unsupportedMetric);
    }
  });

  it('keeps a semantic, accessible list', () => {
    render(<ProofStrip />);
    expect(screen.getByRole('list')).toBeTruthy();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });
});
