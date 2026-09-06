/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import CaseStudyVisual from './CaseStudyVisual';

describe('CaseStudyVisual', () => {
  it('shows a visible provenance qualifier for a schematic', () => {
    render(<CaseStudyVisual visual={{ kind: 'schematic', alt: 'Input to review diagram.', label: 'Input → review', caption: 'Illustrative workflow schematic — not client source material.' }} />);
    expect(screen.getByRole('img', { name: 'Input to review diagram.' })).toBeTruthy();
    expect(screen.getByText(/not client source material/i)).toBeTruthy();
  });

  it('replaces an unavailable image with a meaningful illustrative fallback', () => {
    render(<CaseStudyVisual visual={{ kind: 'image', alt: 'A supplied visual.', src: '/missing-image.webp', label: 'Input → review', caption: 'Portfolio-safe visual with supplied provenance.' }} />);
    fireEvent.error(screen.getByRole('img', { name: 'A supplied visual.' }));
    expect(screen.getByText(/visual unavailable/i)).toBeTruthy();
    expect(screen.getByText(/illustrative fallback schematic/i)).toBeTruthy();
    expect(screen.getByRole('img', { name: 'A supplied visual.' })).toBeTruthy();
  });
});
