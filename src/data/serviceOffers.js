export const HOURLY_FROM_EUR = 45;
export const HOURLY_FROM_LABEL = `from €${HOURLY_FROM_EUR}/hour`;

export function typicalDurationLabel({ minWeeks, maxWeeks }) {
  return `Typically ${minWeeks}–${maxWeeks} weeks`;
}

export const serviceOffers = [
  {
    id: 'data-extraction-automation-sprint',
    title: 'DATA EXTRACTION AUTOMATION SPRINT',
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
    title: 'COMPUTER VISION PRODUCTION OPTIMIZATION',
    summary:
      'For existing YOLO, OCR, OpenCV, ONNX, or edge-AI systems that need to become faster and more reliable. I profile the bottlenecks, improve inference flow, and prepare the pipeline for production constraints.',
    minWeeks: 1,
    maxWeeks: 2,
    inScope: [
      'Profile bottlenecks in an existing YOLO, OCR, OpenCV, ONNX, or edge-AI system',
      'Improve inference flow',
      'Fit the pipeline to production constraints',
    ],
    outOfScope: [
      'Building a computer-vision product from scratch',
      'Training a new model from zero',
      'Hardware procurement or plant-floor install',
    ],
  },
  {
    id: 'ai-workflow-buildout',
    title: 'AI WORKFLOW BUILDOUT',
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
