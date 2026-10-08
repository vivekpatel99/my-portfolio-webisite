/** @vitest-environment jsdom */
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import CaseStudyArticle from './CaseStudyArticle.js';

const story = { slug: 'synthetic-story', title: 'Synthetic story', summary: 'Synthetic summary', sections: [] };
const Location = () => {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}{location.search}{location.hash}</output>;
};

afterEach(cleanup);

describe('case study internal navigation', () => {
  const articleLinks = [
    ['← View case studies', '/case-studies/?resume=1'],
    ['Back to home', '/'],
    ['Discuss a similar project', '/contact/'],
  ];

  it.each(articleLinks)('routes an ordinary %s click in the current document', (name, href) => {
    render(<MemoryRouter initialEntries={['/project/synthetic-story/']}>
      <CaseStudyArticle story={story} backHref="/case-studies/?resume=1" /><Location />
    </MemoryRouter>);
    const link = screen.getByRole('link', { name, exact: true });
    expect(link.getAttribute('href')).toBe(href);
    fireEvent.click(link);
    expect(screen.getByTestId('location').textContent).toBe(href);
  });

  it.each(articleLinks)('leaves modified and middle %s clicks to the browser', (name) => {
    render(<MemoryRouter initialEntries={['/project/synthetic-story/']}>
      <CaseStudyArticle story={story} /><Location />
    </MemoryRouter>);
    for (const options of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }]) {
      const event = new MouseEvent('click', { bubbles: true, cancelable: true, ...options });
      screen.getByRole('link', { name, exact: true }).dispatchEvent(event);
      expect(event.defaultPrevented).toBe(false);
      expect(screen.getByTestId('location').textContent).toBe('/project/synthetic-story/');
    }
  });

  it('keeps standalone article rendering usable without a router', () => {
    const markup = renderToStaticMarkup(<CaseStudyArticle story={story} />);
    for (const href of ['/#portfolio', '/', '/contact/']) expect(markup).toContain(`href="${href}"`);
    expect(markup).toContain('Discuss a similar project');
  });
});
