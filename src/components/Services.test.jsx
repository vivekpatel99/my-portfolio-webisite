/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Services from './Services';
import {
  HOURLY_FROM_LABEL,
  serviceOffers,
  typicalDurationLabel,
} from '@/data/serviceOffers';

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

afterEach(cleanup);

const section = () => document.getElementById('services');

const renderServices = () => render(
  <BrowserRouter>
    <Services />
  </BrowserRouter>
);

describe('Services offers', () => {
  it('starts with the first offer open and the other two closed', () => {
    renderServices();
    const rows = within(section()).getAllByRole('button');
    expect(rows).toHaveLength(3);
    expect(rows[0].getAttribute('aria-expanded')).toBe('true');
    expect(rows[1].getAttribute('aria-expanded')).toBe('false');
    expect(rows[2].getAttribute('aria-expanded')).toBe('false');
  });

  it('shows hourly rate, typical duration, and scope above the summary when first offer is open', () => {
    renderServices();
    const offer = serviceOffers[0];
    const button = within(section()).getAllByRole('button')[0];
    const panel = document.getElementById(button.getAttribute('aria-controls'));
    const text = panel.textContent;
    expect(text).toContain(HOURLY_FROM_LABEL);
    expect(text).toContain(typicalDurationLabel(offer));
    expect(text).toContain('In scope');
    expect(text).toContain('Out of scope');
    expect(text).toContain(offer.inScope[0]);
    expect(text).toContain(offer.outOfScope[0]);
    expect(text.indexOf(HOURLY_FROM_LABEL)).toBeLessThan(text.indexOf(offer.summary));
    expect(text.indexOf('In scope')).toBeLessThan(text.indexOf(offer.summary));
    expect(text.indexOf('Out of scope')).toBeLessThan(text.indexOf(offer.summary));
    expect(text.indexOf('Typically')).toBeLessThan(text.indexOf(offer.summary));
    [...panel.querySelectorAll('li')].forEach((item) => {
      expect(item.className).toContain('text-gray-300');
    });
  });

  it('shows "View details" link in expanded accordion', async () => {
    const user = userEvent.setup();
    renderServices();
    const button = within(section()).getAllByRole('button')[0];
    const panel = document.getElementById(button.getAttribute('aria-controls'));
    const link = within(panel).getByText('View details →');
    expect(link).toBeTruthy();
    expect(link.getAttribute('href')).toContain('/services/');
  });

  it('keeps the catalog rate visible when every row is closed', async () => {
    const user = userEvent.setup();
    renderServices();
    await user.click(within(section()).getAllByRole('button')[0]);
    within(section()).getAllByRole('button').forEach((row) => {
      expect(row.getAttribute('aria-expanded')).toBe('false');
    });
    expect(section().textContent).toContain(HOURLY_FROM_LABEL);
    expect(within(section()).getAllByRole('button')[1].textContent).not.toContain(HOURLY_FROM_LABEL);
    expect(within(section()).getAllByRole('button')[1].textContent).not.toContain('Typically');
  });

  it('opens only one offer at a time and never adds a fourth accordion control', async () => {
    const user = userEvent.setup();
    renderServices();
    const rows = () => within(section()).getAllByRole('button');
    await user.click(rows()[2]);
    expect(rows()).toHaveLength(3);
    expect(rows()[0].getAttribute('aria-expanded')).toBe('false');
    expect(rows()[2].getAttribute('aria-expanded')).toBe('true');
    const panel = document.getElementById(rows()[2].getAttribute('aria-controls'));
    expect(panel.textContent).toContain(HOURLY_FROM_LABEL);
    expect(panel.textContent).toContain(typicalDurationLabel(serviceOffers[2]));
    expect(screen.queryByRole('button', { name: /Request a Project Estimate/i })).toBeNull();
  });

  it('drops the old fixed-scope and ROI chips', () => {
    renderServices();
    expect(section().textContent).not.toMatch(/Fixed-scope builds|Automation ROI/i);
    expect(section().textContent).not.toMatch(/€80|3,600|7,200|guaranteed ROI|30-day support/i);
  });
});
