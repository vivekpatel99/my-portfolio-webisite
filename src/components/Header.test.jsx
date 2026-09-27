/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Header from './Header';

vi.mock('framer-motion', () => {
  const motion = new Proxy(
    {},
    {
      get: (_, tag) =>
        React.forwardRef(function MotionComponent({ children, ...props }, ref) {
          return React.createElement(String(tag), { ref, ...props }, children);
        }),
    },
  );

  return { AnimatePresence: ({ children }) => <>{children}</>, motion };
});

describe('Header', () => {
  afterEach(cleanup);

  beforeEach(() => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  it('closes the mobile menu at the desktop breakpoint and restores focus to a visible control', async () => {
    const user = userEvent.setup();
    const desktopListeners = new Set();
    const desktopQuery = {
      matches: false,
      media: '(min-width: 768px)',
      addEventListener: vi.fn((event, listener) => {
        if (event === 'change') desktopListeners.add(listener);
      }),
      removeEventListener: vi.fn((event, listener) => {
        if (event === 'change') desktopListeners.delete(listener);
      }),
    };
    window.matchMedia = vi.fn((query) => (
      query === desktopQuery.media ? desktopQuery : { matches: false }
    ));

    render(
      <MemoryRouter>
        <Header />
        <main id="main-content"><button type="button">Main action</button></main>
        <footer id="site-footer"><a href="/privacy">Privacy</a></footer>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Toggle navigation menu' }));
    expect(screen.getByRole('dialog', { name: 'Navigation menu' })).toBeTruthy();
    expect(document.getElementById('main-content').hasAttribute('inert')).toBe(true);

    await act(async () => {
      desktopQuery.matches = true;
      desktopListeners.forEach((listener) => listener({ matches: true, media: desktopQuery.media }));
    });

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Navigation menu' })).toBeNull();
    });
    const logo = screen.getByRole('link', { name: 'Vivek Patel Logo' });
    expect(document.activeElement).toBe(logo);
    expect(document.getElementById('main-content').hasAttribute('inert')).toBe(false);
    expect(document.getElementById('site-footer').hasAttribute('inert')).toBe(false);
  });

  it('isolates the site footer without adding modal attributes to a nested content footer', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Header />
        <main id="main-content">
          <article><footer data-testid="content-footer">Attribution</footer></article>
        </main>
        <footer id="site-footer" data-testid="site-footer">Site links</footer>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Toggle navigation menu' }));

    const contentFooter = screen.getByTestId('content-footer');
    const siteFooter = screen.getByTestId('site-footer');
    expect(contentFooter.hasAttribute('inert')).toBe(false);
    expect(contentFooter.hasAttribute('aria-hidden')).toBe(false);
    expect(siteFooter.hasAttribute('inert')).toBe(true);
    expect(siteFooter.getAttribute('aria-hidden')).toBe('true');
  });

  it('scrolls when clicking a nav link for the current hash', async () => {
    const user = userEvent.setup();
    const target = document.createElement('section');
    target.id = 'services';
    document.body.appendChild(target);

    render(
      <MemoryRouter initialEntries={['/#services']}>
        <Header />
      </MemoryRouter>,
    );

    await user.click(within(screen.getByRole('navigation')).getByRole('link', { name: 'Services' }));

    expect(target.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
    target.remove();
  });

  it('navigates to the case studies collection from the header', async () => {
    const user = userEvent.setup();
    const LocationProbe = () => {
      const location = useLocation();
      return <output data-testid="location">{location.pathname}</output>;
    };

    render(
      <MemoryRouter initialEntries={['/']}>
        <Header />
        <LocationProbe />
      </MemoryRouter>,
    );

    const link = within(screen.getByRole('navigation')).getByRole('link', { name: 'Case Studies' });
    expect(link.getAttribute('href')).toBe('/case-studies/');
    await user.click(link);

    await waitFor(() => expect(screen.getByTestId('location').textContent).toBe('/case-studies/'));
  });

  it('renders Detection Bar with NAV · SITE craft marker', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    expect(screen.getByText(/NAV ·/i)).toBeTruthy();
    expect(screen.getByText(/SITE/i)).toBeTruthy();
  });
});
