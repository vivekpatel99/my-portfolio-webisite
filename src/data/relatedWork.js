import { caseStudies } from './caseStudies.js';
import { serviceOffers } from './serviceOffers.js';

// Explicit technical relevance, not a shared-client or shared-delivery claim.
export const serviceRelatedWork = {
  'data-extraction-automation-sprint': [
    'invoice-ocr-extraction',
    'ai-invoice-processing-automation',
    'healthcare-document-intelligence',
  ],
  'ai-workflow-buildout': ['n8n-openai-data-extraction', 'n8n-python-ai-agents'],
  'computer-vision-production-optimization': [
    'sports-video-analytics-yolo',
    'yolo-computer-vision-optimization',
    'depth-based-distance-estimation',
  ],
};

export const storyRelatedWork = {
  'ai-project-planning-assistant': ['n8n-python-ai-agents'],
  'python-ci-workflow-automation': ['n8n-python-ai-agents'],
  'n8n-python-ai-agents': ['ai-project-planning-assistant', 'python-ci-workflow-automation'],
  'resumable-listing-data-extraction': ['browser-search-to-spreadsheet'],
  'browser-search-to-spreadsheet': ['resumable-listing-data-extraction'],
};

// Integrity checks use the public projection: private/draft records cannot
// satisfy a mapping. Kept callable so isolated publication fixtures can build.
export function validateRelatedWork(services = serviceRelatedWork, stories = storyRelatedWork, publishedStories = caseStudies, publishedServices = serviceOffers) {
  const serviceIds = new Set(publishedServices.map((service) => service.id));
  for (const id of Object.keys(services)) {
    if (!serviceIds.has(id)) throw new Error(`Related work references an unknown or unpublished service: ${id}`);
  }
  const published = new Set(publishedStories.map((story) => story.slug));
  for (const slug of [...Object.keys(stories), ...Object.values(services).flat(), ...Object.values(stories).flat()]) {
    if (!published.has(slug)) throw new Error(`Related work references an unknown or unpublished story: ${slug}`);
  }
}

export function getPublishedRelatedWork(slugs = []) {
  // A withdrawn story must disappear from inbound links too. The integrity
  // test flags stale mappings; rendering never exposes private or draft data.
  return slugs.map((slug) => caseStudies.find((story) => story.slug === slug)).filter(Boolean);
}
