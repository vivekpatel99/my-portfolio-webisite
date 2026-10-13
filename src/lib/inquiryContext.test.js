import { describe, expect, it } from 'vitest';
import { caseStudies } from '../data/caseStudies.js';
import { serviceOffers } from '../data/serviceOffers.js';
import { inquiryHref, readInquiryContext } from './inquiryContext.js';

describe('public inquiry context', () => {
  it.each(serviceOffers)('uses the public service name for $id', (service) => {
    const href = inquiryHref('service', service.id);
    expect(href).toBe(`/contact/?service=${service.id}`);
    expect(readInquiryContext(new URL(href, 'https://example.invalid').search)).toEqual({
      type: 'service', id: service.id, label: service.name,
      description: `I'd like to discuss ${service.name}.`,
    });
  });

  it.each(caseStudies)('uses only the published project title for $slug', (story) => {
    const href = inquiryHref('project', story.slug);
    expect(href).toBe(`/contact/?project=${story.slug}`);
    expect(readInquiryContext(new URL(href, 'https://example.invalid').search)?.label).toBe(story.title);
  });

  it.each(['', '?project=withdrawn-story', '?service=unknown', '?service=ai-workflow-buildout&project=ai-invoice-processing-automation', '?service=ai-workflow-buildout&service=ai-workflow-buildout', '?project=%3Cscript%3E', '?name=Private&description=Private'])('ignores absent, unknown, ambiguous and arbitrary input: %s', (search) => {
    expect(readInquiryContext(search)).toBeNull();
  });

  it('never builds an inquiry URL from unknown identifiers', () => {
    expect(inquiryHref('service', 'arbitrary-text')).toBe('/contact/');
    expect(inquiryHref('project', 'withdrawn-story')).toBe('/contact/');
    expect(inquiryHref('unknown', serviceOffers[0].id)).toBe('/contact/');
  });
});
