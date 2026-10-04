/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
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

    const actionField = screen.getByRole('link', { name: /request a project estimate/i });
    expect(actionField).toBeTruthy();

    // Meta label for detection field (appears in field-meta span)
    expect(container.querySelector('.field-meta')?.textContent).toContain('REQUEST · ESTIMATE');
  });

  it('does not show a route instruction under the actions', () => {
    render(
      <MemoryRouter>
        <CTA />
      </MemoryRouter>,
    );

    expect(screen.queryByText(/NO MAILTO/i)).toBeNull();
    expect(screen.getByRole('link', { name: /request a project estimate/i })).toBeTruthy();
  });

  it('attaches Project inquiry to the heading without a duplicate eyebrow', () => {
    const { container } = render(
      <MemoryRouter>
        <CTA />
      </MemoryRouter>,
    );

    const heading = screen.getByRole('heading', { name: /ready to start your project/i });
    expect(heading.querySelector('.detection-label').textContent).toBe('Project inquiry');
    expect(heading.querySelector('.detection-label').getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelector('.eyebrow')).toBeNull();
    expect(container.textContent).not.toContain('CTA · DETECTED');
  });

  it('has secondary View case studies link', () => {
    render(
      <MemoryRouter>
        <CTA />
      </MemoryRouter>,
    );

    const viewCaseStudies = screen.getByRole('link', { name: /view case studies/i });
    expect(viewCaseStudies.getAttribute('href')).toBe('/case-studies/');
  });

  it.each([
    ['Cmd-click', { metaKey: true }],
    ['Ctrl-click', { ctrlKey: true }],
    ['middle-click', { button: 1 }],
  ])('leaves %s to the browser, then client-routes a plain click', (_, modifiers) => {
    const LocationProbe = () => <output data-testid="location">{useLocation().pathname}</output>;
    render(<MemoryRouter><CTA /><LocationProbe /></MemoryRouter>);
    const link = screen.getByRole('link', { name: /view case studies/i });
    expect(fireEvent.click(link, modifiers)).toBe(true);
    expect(screen.getByTestId('location').textContent).toBe('/');
    expect(fireEvent.click(link)).toBe(false);
    expect(screen.getByTestId('location').textContent).toBe('/case-studies/');
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
