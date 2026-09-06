/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import Portfolio from './Portfolio';

describe('Portfolio', () => {
  it('links portfolio cards to internal case studies', () => {
    render(
      <MemoryRouter>
        <Portfolio />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', {
      name: /read case study: document & web data extraction/i,
    }).getAttribute('href')).toBe('/project/n8n-openai-data-extraction/');

    expect(screen.getByRole('link', {
      name: /read case study: invoice ocr data extraction/i,
    }).getAttribute('href')).toBe('/project/invoice-ocr-extraction/');

    expect(screen.getByText(/explore document extraction, workflow automation/i)).toBeTruthy();
    expect(screen.queryByText(/measurable outcome/i)).toBeNull();
  });
});
