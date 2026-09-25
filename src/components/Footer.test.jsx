/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import Footer from './Footer.jsx';

describe('Footer Registration Strip', () => {
  afterEach(cleanup);

  it('renders registration footer with FOOTER · SITE meta', () => {
    const { container } = render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );

    // FOOTER · SITE meta is split across text and em elements
    expect(container.textContent).toContain('FOOTER ·');
    expect(container.textContent).toContain('SITE');
  });

  it('has flat inline navigation links', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );

    const navLinks = ['HOME', 'SERVICES', 'PORTFOLIO', 'ABOUT', 'CONTACT ME'];
    for (const text of navLinks) {
      expect(screen.getByRole('link', { name: new RegExp(text, 'i') })).toBeTruthy();
    }
  });

  it('includes social links (GitHub, LinkedIn)', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /github/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /linkedin/i })).toBeTruthy();
  });

  it('shows legal links (privacy policy, cookie policy, manage consent)', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /privacy policy/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /cookie policy/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /manage consent/i })).toBeTruthy();
  });

  it('displays copyright notice with current year', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );

    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`©.*${currentYear}.*VIVEK PATEL`, 'i'))).toBeTruthy();
  });

  it('includes ALL RIGHTS RESERVED text', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );

    expect(screen.getByText(/ALL RIGHTS RESERVED/i)).toBeTruthy();
  });
});
