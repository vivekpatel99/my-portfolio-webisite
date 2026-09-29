/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Hero from './Hero';

vi.mock('framer-motion', () => ({
  motion: new Proxy({}, { get: () => 'div' }),
  useReducedMotion: () => false,
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const renderHero = () =>
  render(
    <BrowserRouter>
      <Hero />
    </BrowserRouter>
  );

describe('Hero invoice proof fold (#176)', () => {
  it('renders Top Rated Plus credential in hero invoice', () => {
    renderHero();
    const credential = screen.getByText('Top Rated Plus', { exact: true });
    const whisper = screen.getByText('Upwork freelancer');
    expect(credential).toBeTruthy();
    expect(whisper).toBeTruthy();
  });

  it('renders 100% Job Success credential in hero invoice', () => {
    renderHero();
    const credential = screen.getByText('100% Job Success', { exact: true });
    const whisper = screen.getByText('Client delivery record');
    expect(credential).toBeTruthy();
    expect(whisper).toBeTruthy();
  });

  it('does not render Detected total footer (removed per #176)', () => {
    renderHero();
    expect(screen.queryByText('Detected total')).toBeNull();
    expect(screen.queryByText(/€45.*\/hr/)).toBeNull();
    expect(screen.queryByText(/ok/i)).toBeNull();
  });

  it('has accessible proofs region with role=group', () => {
    const { container } = renderHero();
    const proofsGroup = container.querySelector('[role="group"][aria-label="Detected credentials"]');
    expect(proofsGroup).not.toBeNull();
    expect(proofsGroup.className).toContain('grid');
    expect(proofsGroup.className).toContain('grid-cols-2');
  });

  it('proofs appear under Role field in invoice structure', () => {
    const { container } = renderHero();
    const roleLabel = screen.getByText('Role');
    const roleField = roleLabel.parentElement;
    const proofsGroup = container.querySelector('[role="group"][aria-label="Detected credentials"]');
    
    expect(roleField).not.toBeNull();
    expect(proofsGroup).not.toBeNull();
    
    const invoice = container.querySelector('article[aria-label="Profile invoice field parse"]');
    const children = Array.from(invoice.children);
    const roleIndex = children.findIndex(el => el.contains(roleLabel));
    const proofsIndex = children.findIndex(el => el === proofsGroup);
    
    expect(proofsIndex).toBeGreaterThan(roleIndex);
  });

  it('renders exact H1: Computer Vision & AI Engineer', () => {
    renderHero();
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.textContent).toBe('Computer Vision & AI Engineer');
  });

  it('displays Euro rate €45/hour only (no dollar or other currencies)', () => {
    const { container } = renderHero();
    const euroRate = screen.getByText('€45/hour', { exact: true });
    expect(euroRate).toBeTruthy();
    expect(container.textContent).not.toMatch(/\$|USD|GBP|£/);
  });

  it('shows the rate once, in the invoice RATE field, without the old hero line (#195)', () => {
    const { container } = renderHero();
    expect(screen.getAllByText('€45/hour', { exact: true })).toHaveLength(1);
    expect(container.textContent.match(/€45/g)).toHaveLength(1);
    expect(screen.queryByText(/Starting at/)).toBeNull();
    const rateLabel = screen.getByText('Rate', { exact: true });
    expect(rateLabel.parentElement.textContent).toContain('€45/hour');
    expect(screen.getByText('Based in Linz, Austria', { exact: true })).toBeTruthy();
  });

  it('displays exact location: Linz, Austria', () => {
    renderHero();
    const location = screen.getByText('Linz, Austria', { exact: true });
    expect(location).toBeTruthy();
  });

  it('renders proof icons with aria-hidden', () => {
    const { container } = renderHero();
    const proofsGroup = container.querySelector('[role="group"][aria-label="Detected credentials"]');
    const icons = proofsGroup.querySelectorAll('svg');
    expect(icons.length).toBe(2);
    icons.forEach((icon) => {
      const parent = icon.parentElement;
      expect(parent.getAttribute('aria-hidden')).toBe('true');
    });
  });

  it('renders bio after proofs and rate/location per invoice fold design', () => {
    renderHero();
    const bio = screen.getByText(/I build detectors, document extractors, and n8n workflows/);
    expect(bio).toBeTruthy();
  });

  it('renders invoice detection chrome and scan label', () => {
    renderHero();
    const scanLabel = screen.getByText('doc · extract · 0.97', { exact: true });
    const docId = screen.getByText('INV-VP-0045', { exact: true });
    const title = screen.getByText('Profile Invoice', { exact: true });
    expect(scanLabel).toBeTruthy();
    expect(docId).toBeTruthy();
    expect(title).toBeTruthy();
  });

  it('renders Request a Project Estimate CTA', () => {
    renderHero();
    const cta = screen.getByRole('button', { name: 'Request a Project Estimate' });
    expect(cta).toBeTruthy();
  });

  it('renders View Case Studies secondary CTA', () => {
    renderHero();
    const cta = screen.getByRole('link', { name: 'View Case Studies' });
    expect(cta).toBeTruthy();
  });
});

describe('Hero randomized field bboxes (#206)', () => {
  const FIELD_VALUES = {
    name: 'Vivek Patel',
    role: 'Computer Vision & AI Engineer',
    credential: 'Top Rated Plus',
    success: '100% Job Success',
    rate: '€45/hour',
    location: 'Linz, Austria',
  };

  const loadFreshPageHeroWithRandom = async (randomValue) => {
    vi.resetModules();
    vi.spyOn(Math, 'random').mockReturnValue(randomValue);
    const { default: FreshHero } = await import('./Hero');
    return FreshHero;
  };

  const renderFresh = (Component) =>
    render(
      <BrowserRouter>
        <Component />
      </BrowserRouter>
    );

  const detectedIds = (container) =>
    Array.from(container.querySelectorAll('[data-hero-field][data-detected="true"]'))
      .map((el) => el.getAttribute('data-hero-field'))
      .sort();

  it('frames exactly 3 of the 6 invoice fields', async () => {
    const FreshHero = await loadFreshPageHeroWithRandom(0);
    const { container } = renderFresh(FreshHero);

    const fields = container.querySelectorAll('[data-hero-field]');
    expect(fields).toHaveLength(6);
    expect(container.querySelectorAll('.invoice-field-corners')).toHaveLength(3);
    expect(detectedIds(container)).toEqual(['credential', 'role', 'success']);

    fields.forEach((field) => {
      const detected = field.getAttribute('data-detected') === 'true';
      expect(field.classList.contains('invoice-field-corners')).toBe(detected);
    });
  });

  it('keeps every label and value visible regardless of selection', async () => {
    const FreshHero = await loadFreshPageHeroWithRandom(0.999999);
    const { container } = renderFresh(FreshHero);

    ['Name', 'Role', 'Credential', 'Success', 'Rate', 'Location'].forEach((label) => {
      expect(screen.getByText(label, { exact: true })).toBeTruthy();
    });
    Object.entries(FIELD_VALUES).forEach(([id, value]) => {
      const field = container.querySelector(`[data-hero-field="${id}"]`);
      expect(field.textContent).toContain(value);
    });
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(FIELD_VALUES.role);
    expect(screen.getByText('doc · extract · 0.97', { exact: true })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Request a Project Estimate' })).toBeTruthy();
  });

  it('keeps the selection stable across rerenders and remounts in one page load', async () => {
    const FreshHero = await loadFreshPageHeroWithRandom(0);
    const { container, rerender, unmount } = renderFresh(FreshHero);
    const initial = detectedIds(container);

    vi.mocked(Math.random).mockReturnValue(0.999999);
    rerender(
      <BrowserRouter>
        <FreshHero />
      </BrowserRouter>
    );
    expect(detectedIds(container)).toEqual(initial);

    unmount();
    const remounted = renderFresh(FreshHero);
    expect(detectedIds(remounted.container)).toEqual(initial);
  });

  it('can pick a different selection after a fresh page load', async () => {
    const first = renderFresh(await loadFreshPageHeroWithRandom(0));
    const firstIds = detectedIds(first.container);
    cleanup();

    const second = renderFresh(await loadFreshPageHeroWithRandom(0.999999));
    const secondIds = detectedIds(second.container);

    expect(firstIds).toEqual(['credential', 'role', 'success']);
    expect(secondIds).toEqual(['credential', 'name', 'role']);
    expect(secondIds).not.toEqual(firstIds);
  });
});
