/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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
  beforeEach(() => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
  });

  it('scrolls when clicking a nav link for the current hash', async () => {
    const user = userEvent.setup();
    const target = document.createElement('section');
    target.id = 'portfolio';
    document.body.appendChild(target);

    render(
      <MemoryRouter initialEntries={['/#portfolio']}>
        <Header />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('link', { name: 'Portfolio' }));

    expect(target.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
    target.remove();
  });
});
