/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ServiceDetail from './ServiceDetail';
import { serviceOffers, HOURLY_FROM_LABEL, typicalDurationLabel } from '@/data/serviceOffers';

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, asChild, ...props }) => {
    if (asChild) {
      return <>{children}</>;
    }
    return <button {...props}>{children}</button>;
  },
}));

afterEach(cleanup);

describe('ServiceDetail', () => {
  const renderWithRouter = (serviceId) => {
    return render(
      <MemoryRouter initialEntries={[`/services/${serviceId}`]}>
        <Routes>
          <Route path="/services/:serviceId" element={<ServiceDetail />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('displays service details for a valid service ID', () => {
    const service = serviceOffers[0];
    renderWithRouter(service.id);

    expect(screen.getByText(service.title)).toBeTruthy();
    expect(screen.getByText(HOURLY_FROM_LABEL)).toBeTruthy();
    expect(screen.getByText(typicalDurationLabel(service))).toBeTruthy();
    expect(screen.getByText(service.summary)).toBeTruthy();
    expect(screen.getByText('In scope')).toBeTruthy();
    expect(screen.getByText('Out of scope')).toBeTruthy();
    expect(screen.getByText(service.inScope[0])).toBeTruthy();
    expect(screen.getByText(service.outOfScope[0])).toBeTruthy();
  });

  it('displays CTAs with correct links', () => {
    const service = serviceOffers[0];
    renderWithRouter(service.id);

    const primaryCta = screen.getByRole('link', { name: /Request a Project Estimate/i });
    expect(primaryCta.getAttribute('href')).toBe('/contact');

    const secondaryCtas = screen.getAllByRole('link', { name: /View All Services/i });
    secondaryCtas.forEach(cta => {
      expect(cta.getAttribute('href')).toMatch(/^\/#services$/);
    });
  });

  it('displays back link to services section', () => {
    const service = serviceOffers[0];
    renderWithRouter(service.id);

    const backLink = screen.getByRole('link', { name: /Back to Services/i });
    expect(backLink.getAttribute('href')).toBe('/#services');
  });

  it('shows not found message for invalid service ID', () => {
    renderWithRouter('invalid-service-id');

    expect(screen.getByText('Service Not Found')).toBeTruthy();
    expect(screen.getByRole('link', { name: /View All Services/i })).toBeTruthy();
  });

  it('uses euro sign for pricing, never dollar sign', () => {
    const service = serviceOffers[0];
    renderWithRouter(service.id);

    expect(screen.getByText(HOURLY_FROM_LABEL)).toBeTruthy();
    expect(HOURLY_FROM_LABEL).toContain('€');
    expect(HOURLY_FROM_LABEL).not.toContain('$');
  });

  it('renders all three service offers correctly', () => {
    serviceOffers.forEach(service => {
      const { unmount } = renderWithRouter(service.id);
      expect(screen.getByText(service.title)).toBeTruthy();
      expect(screen.getByText(service.summary)).toBeTruthy();
      unmount();
    });
  });
});
