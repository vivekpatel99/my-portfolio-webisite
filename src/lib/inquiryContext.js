import { getCaseStudyBySlug } from '../data/caseStudies.js';
import { getServiceOfferById } from '../data/serviceOffers.js';

export function resolveInquiryContext(type, id) {
  const item = type === 'service' ? getServiceOfferById(id)
    : type === 'project' ? getCaseStudyBySlug(id) : null;
  if (!item) return null;
  const label = type === 'service' ? item.name : item.title;
  return { type, id, label };
}
