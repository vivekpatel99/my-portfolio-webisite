/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Header from './Header';
import Footer from './Footer';

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
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
  });

  it('closes at the desktop breakpoint, restores background state and desktop focus', async () => {
    const user = userEvent.setup();
    const desktopQuery = { matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() };
    window.matchMedia = vi.fn().mockReturnValue(desktopQuery);
    render(
      <MemoryRouter>
        <a href="#main-content">Skip to content</a>
        <Header />
        <main id="main-content"><article><footer>Article footer</footer></article></main>
        <Footer />
      </MemoryRouter>,
    );
    const main = document.getElementById('main-content');
    const siteFooter = screen.getAllByRole('contentinfo').find((footer) => footer.textContent.includes('FOOTER'));
    siteFooter.setAttribute('aria-hidden', 'false');
    await user.click(screen.getByRole('button', { name: 'Toggle navigation menu' }));
    expect(main.hasAttribute('inert')).toBe(true);
    expect(siteFooter.hasAttribute('inert')).toBe(true);
    expect(desktopQuery.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    const onChange = desktopQuery.addEventListener.mock.calls[0][1];
    act(() => {
      desktopQuery.matches = true;
      onChange({ matches: true });
    });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(main.hasAttribute('inert')).toBe(false);
    expect(siteFooter.hasAttribute('inert')).toBe(false);
    expect(siteFooter.getAttribute('aria-hidden')).toBe('false');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Request Estimate' }));
    expect(desktopQuery.removeEventListener).toHaveBeenCalledWith('change', onChange);
    act(() => { desktopQuery.matches = false; });
    await user.click(screen.getByRole('button', { name: 'Toggle navigation menu' }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Toggle navigation menu' }));
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

  it('shows the logo instead of a VP text mark', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    const home = screen.getAllByRole('link', { name: 'Vivek Patel Logo' })[0];
    expect(home.querySelector('img')?.getAttribute('src')).toBe('/assets/logos/mylogo.png');
    expect(screen.queryByText(/NAV ·/i)).toBeNull();
  });
});
