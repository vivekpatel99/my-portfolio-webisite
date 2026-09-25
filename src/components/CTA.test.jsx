/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import CTA from './CTA.jsx';

describe('CTA Action Field', () => {
  afterEach(cleanup);

  it('displays €45/hour rate exactly (no mailto expectation)', () => {
    render(
      <MemoryRouter>
        <CTA />
      </MemoryRouter>,
    );

    // Locked preference: €45/hour public rates (€ only)
    expect(screen.getByText(/€45\/hour/i)).toBeTruthy();
    expect(screen.queryByText(/\$|USD|€80/i)).toBeNull();
  });

  it('shows RATE meta line with craft grammar', () => {
    render(
      <MemoryRouter>
        <CTA />
      </MemoryRouter>,
    );

    expect(screen.getByText(/RATE/i)).toBeTruthy();
  });

  it('has detection action field with REQUEST · ESTIMATE meta', () => {
    const { container } = render(
      <MemoryRouter>
        <CTA />
      </MemoryRouter>,
    );

    const actionField = screen.getByRole('button', { name: /request a project estimate/i });
    expect(actionField).toBeTruthy();
    
    // Meta label for detection field (appears in field-meta span)
    expect(container.querySelector('.field-meta')?.textContent).toContain('REQUEST · ESTIMATE');
  });

  it('shows ROUTE note indicating no primary mailto (locked preference)', () => {
    render(
      <MemoryRouter>
        <CTA />
      </MemoryRouter>,
    );

    // Locked preference: Contact stays form→DB, no primary mailto/phone
    expect(screen.getByText(/ROUTE.*\/CONTACT\/.*NO MAILTO/i)).toBeTruthy();
  });

  it('includes CTA · DETECTED eyebrow meta', () => {
    const { container } = render(
      <MemoryRouter>
        <CTA />
      </MemoryRouter>,
    );

    expect(container.textContent).toContain('CTA ·');
    expect(container.textContent).toContain('DETECTED');
  });

  it('has secondary View case studies button', () => {
    render(
      <MemoryRouter>
        <CTA />
      </MemoryRouter>,
    );

    const viewCaseStudies = screen.getByRole('button', { name: /view case studies/i });
    expect(viewCaseStudies).toBeTruthy();
  });

  it('renders heading with project estimate text', () => {
    render(
      <MemoryRouter>
        <CTA />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /ready to start your project/i })).toBeTruthy();
  });
});
