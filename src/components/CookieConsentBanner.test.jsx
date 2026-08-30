/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, cleanup, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CookieConsentBanner from './CookieConsentBanner';
import { COOKIE_CONSENT_KEY } from '@/lib/consent';

const storage = new Map();

vi.mock('@/components/ui/use-toast', () => ({
  toast: vi.fn(),
}));

vi.mock('framer-motion', () => {
  const MotionDiv = React.forwardRef(({ children, ...props }, ref) => (
    <div ref={ref} {...props}>{children}</div>
  ));

  return {
    AnimatePresence: ({ children }) => <>{children}</>,
    motion: { div: MotionDiv },
  };
});

describe('CookieConsentBanner', () => {
  beforeEach(() => {
    cleanup();
    storage.clear();
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        clear: () => storage.clear(),
        getItem: (key) => storage.get(key) || null,
        removeItem: (key) => storage.delete(key),
        setItem: (key, value) => storage.set(key, String(value)),
      },
    });
    vi.clearAllMocks();
  });

  it('persists a reject choice when the close button is clicked', async () => {
    const user = userEvent.setup();
    const onConsent = vi.fn();
    const onHide = vi.fn();

    render(<CookieConsentBanner onConsent={onConsent} show onHide={onHide} />);

    await user.click(screen.getByRole('button', {
      name: /close cookie consent banner and reject optional cookies/i,
    }));

    expect(JSON.parse(window.localStorage.getItem(COOKIE_CONSENT_KEY))).toEqual({
      necessary: true,
      analytics: false,
    });
    expect(onConsent).not.toHaveBeenCalled();
    expect(onHide).toHaveBeenCalledTimes(1);
  });

  it('sits under the header on small screens so hero CTAs stay free', () => {
    render(<CookieConsentBanner onConsent={vi.fn()} show onHide={vi.fn()} />);
    const dialog = screen.getByRole('dialog', { name: /we value your privacy/i });
    const classes = dialog.className.split(/\s+/);
    expect(classes).toContain('top-20');
    expect(classes).toContain('sm:bottom-4');
    expect(classes).toContain('sm:max-w-lg');
    expect(classes).toContain('sm:right-4');
    expect(classes).not.toContain('left-4');
    expect(classes).not.toContain('right-4');
    expect(classes).not.toContain('bottom-0');
  });

  it('keeps expanded settings reachable', async () => {
    const user = userEvent.setup();
    render(<CookieConsentBanner onConsent={vi.fn()} show onHide={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: /customize/i }));
    expect(screen.getByRole('button', { name: /save preferences/i })).toBeTruthy();
    expect(screen.getByLabelText(/analytics and diagnostics cookies/i)).toBeTruthy();
  });

  it('moves focus to the manager when opened explicitly', async () => {
    const trigger = document.createElement('button');
    trigger.textContent = 'Manage Consent';
    document.body.appendChild(trigger);
    trigger.focus();

    render(<CookieConsentBanner onConsent={vi.fn()} show onHide={vi.fn()} />);

    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByRole('dialog', {
        name: /we value your privacy/i,
      }));
    });

    trigger.remove();
  });

  it('hides at once on first-visit Reject All', async () => {
    vi.useFakeTimers();
    const onHide = vi.fn();
    render(<CookieConsentBanner onConsent={vi.fn()} show={false} onHide={onHide} />);
    expect(screen.queryByRole('dialog')).toBeNull();
    await act(async () => {
      vi.advanceTimersByTime(1500);
    });
    fireEvent.click(screen.getByRole('button', { name: /^reject all$/i }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onHide).toHaveBeenCalledTimes(1);
    expect(JSON.parse(window.localStorage.getItem(COOKIE_CONSENT_KEY))).toEqual({
      necessary: true,
      analytics: false,
    });
    vi.useRealTimers();
  });
});
