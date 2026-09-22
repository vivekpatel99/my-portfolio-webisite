/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import ServiceDetail from './ServiceDetail';
import { HOURLY_FROM_LABEL, serviceOffers } from '@/data/serviceOffers';

afterEach(cleanup);

const renderServiceDetail = (serviceId) => render(
  <MemoryRouter initialEntries={[`/services/${serviceId}`]}>
    <Routes>
      <Route path="/services/:serviceId" element={<ServiceDetail />} />
    </Routes>
  </MemoryRouter>
);

describe('ServiceDetail', () => {
  it('displays service title, rate, and duration', () => {
    const service = serviceOffers[0];
    renderServiceDetail(service.id);
    expect(screen.getByText(service.title)).toBeTruthy();
    expect(screen.getByText(HOURLY_FROM_LABEL)).toBeTruthy();
    expect(screen.getByText(`Typically ${service.minWeeks}–${service.maxWeeks} weeks`)).toBeTruthy();
  });

  it('displays service summary', () => {
    const service = serviceOffers[0];
    renderServiceDetail(service.id);
    expect(screen.getByText(service.summary)).toBeTruthy();
  });

  it('displays in-scope and out-of-scope items', () => {
    const service = serviceOffers[0];
    renderServiceDetail(service.id);
    expect(screen.getByText('In scope')).toBeTruthy();
    expect(screen.getByText('Out of scope')).toBeTruthy();
    expect(screen.getByText(service.inScope[0])).toBeTruthy();
    expect(screen.getByText(service.outOfScope[0])).toBeTruthy();
  });

  it('displays primary CTA to contact page', () => {
    renderServiceDetail(serviceOffers[0].id);
    const cta = screen.getByText('Request a Project Estimate');
    expect(cta).toBeTruthy();
    expect(cta.closest('a').getAttribute('href')).toBe('/contact');
  });

  it('displays back to services link', () => {
    renderServiceDetail(serviceOffers[0].id);
    const backLink = screen.getByText('Back to Services');
    expect(backLink).toBeTruthy();
    expect(backLink.closest('a').getAttribute('href')).toBe('/#services');
  });

  it('displays secondary CTA to view all services', () => {
    renderServiceDetail(serviceOffers[0].id);
    const secondaryCta = screen.getByText('View All Services');
    expect(secondaryCta).toBeTruthy();
    expect(secondaryCta.closest('a').getAttribute('href')).toBe('/#services');
  });

  it('renders all three service pages without error', () => {
    serviceOffers.forEach(service => {
      renderServiceDetail(service.id);
      expect(screen.getByText(service.title)).toBeTruthy();
      cleanup();
    });
  });
});
