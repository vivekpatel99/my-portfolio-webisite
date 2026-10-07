/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Layout from '@/components/Layout';
import { COOKIE_CONSENT_KEY } from '@/lib/consent';
import DataPolicy from './DataPolicy';

vi.mock('@/components/Header', () => ({ default: () => <header>Header</header> }));
vi.mock('@/components/Footer', () => ({ default: () => <footer>Footer</footer> }));
vi.mock('@/components/CustomCursor', () => ({ default: () => null }));
vi.mock('@/components/GoogleAnalytics', () => ({ default: () => null }));
vi.mock('@/components/SentryTelemetry', () => ({ default: () => null }));
vi.mock('@/components/ui/toaster', () => ({ Toaster: () => null }));
vi.mock('@/components/ui/use-toast', () => ({ toast: vi.fn() }));

const preferences = { necessary: true, analytics: false };
const storage = new Map();

beforeEach(() => {
  storage.clear();
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, String(value)),
    },
  });
  window.localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(preferences));
});

afterEach(cleanup);

function renderPolicy() {
  const onSubmit = vi.fn((event) => event.preventDefault());
  render(
    <MemoryRouter initialEntries={['/data-policy']}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/data-policy" element={<form onSubmit={onSubmit}><DataPolicy /></form>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
  return onSubmit;
}

describe('cookie-policy consent opener', () => {
  it('loads and preserves a saved analytics-on preference', async () => {
    const user = userEvent.setup();
    const savedPreferences = { necessary: true, analytics: true };
    window.localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(savedPreferences));
    const onSubmit = renderPolicy();
    const opener = screen.getByRole('button', { name: 'Manage Your Cookie Consent' });
    await user.click(opener);
    const manager = screen.getByRole('dialog', { name: 'We value your privacy' });
    await waitFor(() => expect(document.activeElement).toBe(manager));
    expect(window.localStorage.getItem(COOKIE_CONSENT_KEY)).toBe(JSON.stringify(savedPreferences));
    await user.click(screen.getByRole('button', { name: 'Options' }));
    expect(screen.getByRole('checkbox', { name: 'Analytics' }).getAttribute('aria-checked')).toBe('true');
    await user.click(screen.getByRole('button', { name: 'Save Preferences' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    await waitFor(() => expect(document.activeElement).toBe(opener));
    expect(window.localStorage.getItem(COOKIE_CONSENT_KEY)).toBe(JSON.stringify(savedPreferences));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it.each([
    ['mouse', 'close'],
    ['Enter', 'Reject'],
    ['Space', 'Save Preferences'],
  ])('opens with %s and restores focus after %s', async (activation, dismissal) => {
    const user = userEvent.setup();
    const onSubmit = renderPolicy();
    const opener = screen.getByRole('button', { name: 'Manage Your Cookie Consent' });
    expect(opener.tagName).toBe('BUTTON');
    expect(opener.type).toBe('button');

    if (activation === 'mouse') {
      await user.click(opener);
    } else {
      opener.focus();
      await user.keyboard(activation === 'Enter' ? '{Enter}' : ' ');
    }

    const manager = screen.getByRole('dialog', { name: 'We value your privacy' });
    await waitFor(() => expect(document.activeElement).toBe(manager));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(COOKIE_CONSENT_KEY)).toBe(JSON.stringify(preferences));

    if (dismissal === 'Save Preferences') {
      await user.click(screen.getByRole('button', { name: 'Options' }));
      expect(screen.getByRole('checkbox', { name: 'Analytics' }).getAttribute('aria-checked')).toBe('false');
    }
    await user.click(screen.getByRole('button', {
      name: dismissal === 'close' ? /close cookie consent banner/i : dismissal,
    }));

    expect(screen.queryByRole('dialog')).toBeNull();
    await waitFor(() => expect(document.activeElement).toBe(opener));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(COOKIE_CONSENT_KEY)).toBe(JSON.stringify(preferences));
  });
});
