import { getCaseStudyBySlug } from '../data/caseStudies.js';
import { getServiceOfferById } from '../data/serviceOffers.js';

export function resolveInquiryContext(type, id) {
  const item = type === 'service' ? getServiceOfferById(id)
    : type === 'project' ? getCaseStudyBySlug(id) : null;
  if (!item) return null;
  const label = type === 'service' ? item.name : item.title;
  return { type, id, label, description: `I'd like to discuss ${label}.` };
}

export function readInquiryContext(search) {
  const params = new URLSearchParams(search);
  const services = params.getAll('service');
  const projects = params.getAll('project');
  if (services.length + projects.length !== 1) return null;
  return services.length ? resolveInquiryContext('service', services[0])
    : resolveInquiryContext('project', projects[0]);
}

export function inquiryHref(type, id) {
  return resolveInquiryContext(type, id)
    ? `/contact/?${type}=${encodeURIComponent(id)}` : '/contact/';
}
