/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Request Estimate' }));
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
    const siteFooter = document.getElementById('site-footer');
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
    await waitFor(() => expect(document.activeElement).toBe(target));
    target.remove();
  });

  it.each([
    ['Cmd-click', { metaKey: true }],
    ['Ctrl-click', { ctrlKey: true }],
    ['middle-click', { button: 1 }],
  ])('leaves %s on header links to the browser for a new tab', (_, modifiers) => {
    const LocationProbe = () => {
      const location = useLocation();
      return <output data-testid="location">{`${location.pathname}${location.hash}`}</output>;
    };

    render(
      <MemoryRouter initialEntries={['/contact/']}>
        <Header />
        <LocationProbe />
      </MemoryRouter>,
    );

    const nav = within(screen.getByRole('navigation'));
    const links = [
      nav.getByRole('link', { name: 'Services' }),
      nav.getByRole('link', { name: 'Case Studies' }),
      screen.getAllByRole('link', { name: 'Vivek Patel Logo' })[0],
    ];
    links.forEach((link) => {
      expect(fireEvent.click(link, modifiers)).toBe(true);
    });
    expect(screen.getByTestId('location').textContent).toBe('/contact/');
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
    expect(home.querySelector('img')?.getAttribute('src')).toBe('/assets/logos/mylogo-60-c6065baa4d50.webp');
    expect(screen.queryByText(/NAV ·/i)).toBeNull();
  });

  it('serves the 30px logo from 60px/90px derivatives in the bar and the drawer (#252)', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );
    await user.click(screen.getByRole('button', { name: 'Toggle navigation menu' }));

    // The open drawer makes the bar inert, so include hidden links to reach both marks.
    const marks = screen
      .getAllByRole('link', { name: 'Vivek Patel Logo', hidden: true })
      .map((link) => link.querySelector('img'));
    expect(marks).toHaveLength(2);
    marks.forEach((img) => {
      expect(img.getAttribute('src')).toBe('/assets/logos/mylogo-60-c6065baa4d50.webp');
      expect(img.getAttribute('srcset')).toBe('/assets/logos/mylogo-60-c6065baa4d50.webp 2x, /assets/logos/mylogo-90-cbffb31a1bdc.webp 3x');
      expect(img.getAttribute('width')).toBe('30');
      expect(img.getAttribute('height')).toBe('30');
    });
  });
});
