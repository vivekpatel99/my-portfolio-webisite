export const HOURLY_FROM_EUR = 45;
export const HOURLY_FROM_LABEL = `from €${HOURLY_FROM_EUR}/hour`;

export function serviceTimelineLabel({ minWeeks, maxWeeks, timelineLabel }) {
  return timelineLabel ?? `Typically ${minWeeks}–${maxWeeks} weeks`;
}

export const serviceRouteForId = (id) => `/services/${id}`;

export const serviceOffers = [
  {
    id: 'data-extraction-automation-sprint',
    title: 'DATA EXTRACTION AUTOMATION SPRINT',
    name: 'Data Extraction Automation Sprint',
    summary:
      'A focused buildout for teams stuck copying information from websites, PDFs, invoices, or messy internal sources. I map the workflow, build the extractor, add validation, and deliver a reusable automation your team can actually operate.',
    minWeeks: 1,
    maxWeeks: 2,
    inScope: [
      'Map the current copy-paste workflow',
      'Build an extractor for websites, PDFs, invoices, or messy internal sources',
      'Add validation',
      'Hand over a reusable automation the team can operate',
    ],
    outOfScope: [
      'Ongoing managed extraction as a service',
      'A full document-management product',
      'Training a new machine-learning model from scratch',
    ],
  },
  {
    id: 'computer-vision-production-optimization',
    title: 'COMPUTER VISION MODEL DEVELOPMENT',
    name: 'Computer Vision Model Development',
    summary:
      'I build and fine-tune computer-vision models for image and video tasks, with inference optimization where needed. An engagement can cover training data, evaluation, reviewable outputs, and integration into an agreed workflow.',
    timelineLabel: 'Timeline scoped per project',
    inScope: [
      'Define the vision task, data requirements, and evaluation approach',
      'Build or fine-tune a model for the agreed vision task',
      'Deliver training and inference code with reviewable outputs',
      'Optimize inference or deployment where the project needs it',
    ],
    outOfScope: [
      'Hardware procurement or plant-floor install',
    ],
  },
  {
    id: 'ai-workflow-buildout',
    title: 'AI WORKFLOW BUILDOUT',
    name: 'AI Workflow Buildout',
    summary:
      'A complete workflow build for operations teams that need LLMs, n8n, APIs, scraping, and human review connected into one dependable system. Best for replacing repeatable decisions and handoffs without hiring multiple specialists.',
    minWeeks: 2,
    maxWeeks: 4,
    inScope: [
      'Connect LLMs, n8n, APIs, scraping, and human review into one system',
      'Replace a repeatable operations handoff',
      'Deliver a workflow the operations team can run',
    ],
    outOfScope: [
      'Staffing or hiring specialists',
      'Open-ended research with no named workflow',
      '24/7 operations coverage',
    ],
  },
];

export const getServiceOfferById = (id) => serviceOffers.find((offer) => offer.id === id);
