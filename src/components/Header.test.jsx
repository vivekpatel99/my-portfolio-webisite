/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
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
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
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
});
