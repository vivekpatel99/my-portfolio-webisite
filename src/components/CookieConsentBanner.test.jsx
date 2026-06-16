/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
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
});
