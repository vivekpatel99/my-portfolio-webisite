/** @vitest-environment jsdom */
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { socialLinks } from '@/config/links';
import PrivacyPolicyContent from './PrivacyPolicyContent';
import CookiePolicyContent from './CookiePolicyContent';

afterEach(cleanup);

describe('shared policy content', () => {
  it.each([
    ['Privacy Policy', PrivacyPolicyContent, 'Last updated: June 1, 2026', '/data-policy/'],
    ['Cookie Policy', CookiePolicyContent, 'Last updated: 30 August 2026', '/legal/'],
  ])('renders %s as readable static markup with native destinations', (heading, Content, date, crossPath) => {
    const html = renderToStaticMarkup(<MemoryRouter><Content /></MemoryRouter>);
    expect(html).toMatch(new RegExp(`<h1\\b[^>]*>${heading}</h1>`));
    expect(html).toContain(date);
    expect(html).toContain(`href="${crossPath}"`);
    expect(html).toContain(`href="${socialLinks.emailHref}"`);
    expect(html).not.toMatch(/opacity:0|transform:|<noscript/);
  });

  it('explains unavailable consent controls without exposing a dead button', () => {
    render(<MemoryRouter><CookiePolicyContent /></MemoryRouter>);
    expect(screen.getByText(/Cookie consent controls need JavaScript\./)).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByRole('link', { name: socialLinks.contactEmail }).getAttribute('href')).toBe(socialLinks.emailHref);
  });

  it('uses the supplied consent opener when the application is available', async () => {
    const onManageCookies = vi.fn();
    render(<MemoryRouter><CookiePolicyContent onManageCookies={onManageCookies} /></MemoryRouter>);
    const opener = screen.getByRole('button', { name: 'Manage Your Cookie Consent' });
    expect(opener.type).toBe('button');
    await userEvent.setup().click(opener);
    expect(onManageCookies).toHaveBeenCalledOnce();
    expect(screen.queryByText(/Cookie consent controls need JavaScript\./)).toBeNull();
  });
});
