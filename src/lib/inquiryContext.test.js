import { describe, expect, it } from 'vitest';
import { caseStudies } from '../data/caseStudies.js';
import { serviceOffers } from '../data/serviceOffers.js';
import { resolveInquiryContext } from './inquiryContext.js';

describe('public analytics context validation', () => {
  it.each(serviceOffers)('resolves the public service $id', (service) => {
    expect(resolveInquiryContext('service', service.id)).toEqual({ type: 'service', id: service.id, label: service.name });
  });
  it.each(caseStudies)('resolves the published project $slug', (story) => {
    expect(resolveInquiryContext('project', story.slug)).toEqual({ type: 'project', id: story.slug, label: story.title });
  });
  it.each([['service', 'unknown'], ['project', 'withdrawn-story'], ['unknown', serviceOffers[0].id]])('rejects %s / %s', (type, id) => {
    expect(resolveInquiryContext(type, id)).toBeNull();
  });
});
