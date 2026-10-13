/** @vitest-environment jsdom */
import React from 'react';
import { afterEach, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ServiceDetailContent from './ServiceDetailContent.js';
import { serviceOffers } from '../data/serviceOffers.js';

afterEach(cleanup);

it('puts invoice extraction proof next to the service scope as canonical ordinary links', () => {
  render(<MemoryRouter><ServiceDetailContent service={serviceOffers[0]} /></MemoryRouter>);
  const related = screen.getByRole('region', { name: 'Related work' });
  expect(within(related).getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual([
    '/project/invoice-ocr-extraction/',
    '/project/ai-invoice-processing-automation/',
    '/project/healthcare-document-intelligence/',
  ]);
});

it('uses the same contextual links in server rendering and the initial client render', async () => {
  const { renderToStaticMarkup } = await import('react-dom/server');
  const { CaseStudyArticle } = await import('./CaseStudyArticle.js');
  const { caseStudies } = await import('../data/caseStudies.js');
  const { JSDOM } = await import('jsdom');
  const inbound = new Set();
  const expected = {
    'data-extraction-automation-sprint': ['invoice-ocr-extraction', 'ai-invoice-processing-automation', 'healthcare-document-intelligence'],
    'ai-workflow-buildout': ['n8n-openai-data-extraction', 'n8n-python-ai-agents'],
    'computer-vision-production-optimization': ['sports-video-analytics-yolo', 'yolo-computer-vision-optimization', 'depth-based-distance-estimation'],
    'ai-project-planning-assistant': ['n8n-python-ai-agents'],
    'python-ci-workflow-automation': ['n8n-python-ai-agents'],
    'n8n-python-ai-agents': ['ai-project-planning-assistant', 'python-ci-workflow-automation'],
    'resumable-listing-data-extraction': ['browser-search-to-spreadsheet'],
    'browser-search-to-spreadsheet': ['resumable-listing-data-extraction'],
  };
  for (const [source, slugs] of Object.entries(expected)) {
    const service = serviceOffers.find((offer) => offer.id === source);
    const content = service
      ? <MemoryRouter><ServiceDetailContent service={service} /></MemoryRouter>
      : <CaseStudyArticle story={caseStudies.find((story) => story.slug === source)} />;
    const html = renderToStaticMarkup(content);
    const raw = new JSDOM(html).window.document;
    render(content);
    const links = within(screen.getByRole('region', { name: 'Related work' })).getAllByRole('link');
    const hrefs = slugs.map((slug) => `/project/${slug}/`);
    expect(links.map((link) => link.getAttribute('href'))).toEqual(hrefs);
    expect([...raw.querySelectorAll('section[aria-label="Related work"] a')].map((link) => link.getAttribute('href'))).toEqual(hrefs);
    slugs.forEach((slug) => inbound.add(slug));
    cleanup();
  }
  expect([...inbound].sort()).toEqual(caseStudies.map((story) => story.slug).sort());
  expect(inbound.size).toBe(12);
});

it('rejects unknown or unpublished targets rather than quietly dropping proof links', async () => {
  const { validateRelatedWork } = await import('../data/relatedWork.js');
  expect(() => validateRelatedWork()).not.toThrow();
  expect(() => validateRelatedWork({ [serviceOffers[0].id]: ['draft-story'] }, {}, [{ slug: 'public-story' }])).toThrow(/draft-story/);
  expect(() => validateRelatedWork({}, { 'draft-story': ['public-story'] }, [{ slug: 'public-story' }])).toThrow(/draft-story/);
  expect(() => validateRelatedWork({}, { 'public-story': ['unknown-story'] }, [{ slug: 'public-story' }])).toThrow(/unknown-story/);
});

it('rejects service mapping sources removed or renamed from the public offers', async () => {
  const { validateRelatedWork } = await import('../data/relatedWork.js');
  const publishedStories = [{ slug: 'public-story' }];
  const publishedServices = [{ id: 'current-service' }];
  expect(() => validateRelatedWork({ 'current-service': ['public-story'] }, {}, publishedStories, publishedServices)).not.toThrow();
  expect(() => validateRelatedWork({ 'retired-service': ['public-story'] }, {}, publishedStories, publishedServices)).toThrow(/retired-service/);
});
