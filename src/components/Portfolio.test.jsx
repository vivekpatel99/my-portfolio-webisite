/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import Portfolio from './Portfolio';

describe('Portfolio', () => {
  it('uses internal links for case studies and real anchors for external project cards', () => {
    render(
      <MemoryRouter>
        <Portfolio />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', {
      name: /read case study: automated data extraction/i,
    }).getAttribute('href')).toBe('/project/n8n-openai-data-extraction');

    expect(screen.getByRole('link', {
      name: /view project: multi-player sports tracking/i,
    }).getAttribute('href')).toBe(
      'https://github.com/vivekpatel99/football-players-tracking-yolo',
    );
  });
});
