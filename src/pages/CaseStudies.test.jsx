/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import CaseStudies from './CaseStudies';

describe('CaseStudies', () => {
  afterEach(cleanup);

  it('provides a navigable collection page heading', () => {
    render(
      <MemoryRouter>
        <CaseStudies />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /selected case studies/i })).toBeTruthy();
  });
});
