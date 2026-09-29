/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { cleanup, render, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import Services from './Services';
import {
  HOURLY_FROM_LABEL,
  serviceOffers,
  serviceTimelineLabel,
} from '@/data/serviceOffers';

afterEach(cleanup);

const renderServices = () => {
  return render(
    <MemoryRouter>
      <Services />
    </MemoryRouter>
  );
};

const section = () => document.getElementById('services');
const cards = () => within(section()).getAllByRole('article');
const cardFor = (offer) =>
  within(section()).getByRole('article', { name: offer.title });

describe('Services offers', () => {
  it('renders exactly the three current offers as open cards with no toggle controls', () => {
    renderServices();
    expect(cards()).toHaveLength(3);
    expect(within(section()).queryAllByRole('button')).toHaveLength(0);
    expect(section().querySelector('[aria-expanded]')).toBeNull();
    serviceOffers.forEach((offer) => {
      expect(cardFor(offer)).toBeTruthy();
    });
  });

  it.each(serviceOffers.map((offer) => [offer.id, offer]))(
    'shows the title, one sentence, typical weeks, and rate for %s without a click',
    (_id, offer) => {
      renderServices();
      const card = cardFor(offer);
      const text = card.textContent;
      const sentence = offer.summary.split(/(?<=\.)\s+/)[0];

      expect(within(card).getByRole('heading', { level: 3, name: offer.title })).toBeTruthy();
      expect(text).toContain(sentence);
      expect(sentence).toMatch(/^[^.]+\.$/);
      expect(text).not.toContain(offer.summary.slice(sentence.length).trim());
      expect(text).toContain(serviceTimelineLabel(offer));
      expect(text).toContain(HOURLY_FROM_LABEL);
      expect(HOURLY_FROM_LABEL).toBe('from €45/hour');
    },
  );

  it('renders titles white rather than greyed out', () => {
    renderServices();
    within(section()).getAllByRole('heading', { level: 3 }).forEach((heading) => {
      expect(heading.className).toContain('text-white');
      expect(heading.className).not.toMatch(/text-\[#9ca3af\]|text-\[#6b7280\]/);
    });
  });

  it('keeps in/out scope lists off the home cards and links each card to its detail page', () => {
    renderServices();
    serviceOffers.forEach((offer) => {
      const card = cardFor(offer);
      expect(card.textContent).not.toContain(offer.inScope[0]);
      expect(card.textContent).not.toContain(offer.outOfScope[0]);
      const link = within(card).getByRole('link', { name: /Scope details/i });
      expect(link.getAttribute('href')).toBe(`/services/${offer.id}`);
    });
    const linkNames = within(section())
      .getAllByRole('link', { name: /Scope details/i })
      .map((link) => link.textContent);
    expect(new Set(linkNames).size).toBe(3);
  });

  it('shows model development with optimization as part of the computer-vision offer', () => {
    renderServices();
    const cv = serviceOffers.find((offer) => offer.id === 'computer-vision-production-optimization');
    const text = cardFor(cv).textContent;
    expect(text).toMatch(/I build and fine-tune computer-vision models/);
    expect(text).toMatch(/optimization where needed/);
    expect(text).toContain('Timeline scoped per project');
    expect(text).not.toContain('Typically 1–2 weeks');
  });

  it('drops the old fixed-scope and ROI chips', () => {
    renderServices();
    expect(section().textContent).not.toMatch(/Fixed-scope builds|Automation ROI/i);
    expect(section().textContent).not.toMatch(/€80|3,600|7,200|guaranteed ROI|30-day support/i);
  });

  it('renders SERVICE · OFFER craft markers on each card', () => {
    renderServices();
    cards().forEach((card, index) => {
      expect(card.textContent).toMatch(/SERVICE · OFFER/i);
      expect(card.textContent).toContain(String(index + 1).padStart(2, '0'));
    });
  });
});
