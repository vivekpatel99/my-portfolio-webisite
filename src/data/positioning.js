import { socialLinks } from '../config/links.js';

export const positioning = {
  claimId: 'offer-reviewable-data-workflows',
  role: 'AI Automation Engineer',
  promise: 'Turn messy documents and web data into structured, reviewable records and dependable handoffs.',
  primaryFocus: 'Document and web-data extraction plus n8n and Python workflow automation for operations teams.',
  fit: 'Best for defined inputs, available data access, explicit fields and destinations, and a human review path for exceptions.',
  scope: 'Scope, timing, and commercial terms are agreed after reviewing the workflow and available materials.',
};

export const approvedProof = {
  upwork: {
    claimId: 'upwork-top-rated-plus-2026-09-06',
    label: 'Top Rated Plus',
    detail: 'Upwork credential checked 6 September 2026',
    href: socialLinks.upwork,
  },
};

export const proofItems = [
  approvedProof.upwork,
  {
    claimId: 'offer-reviewable-data-workflows',
    label: 'Structured, reviewable data',
    detail: 'Document and web-data extraction focus',
  },
  {
    claimId: 'offer-reviewable-data-workflows',
    label: 'Validation and handoff',
    detail: 'Designed around explicit fields and exceptions',
  },
];

export const serviceOffers = [
  {
    claimId: 'offer-document-data-extraction',
    title: 'DOCUMENT & WEB DATA EXTRACTION',
    description: 'Map incoming documents or web data to explicit fields, then build an extraction path your team can review before handoff.',
  },
  {
    claimId: 'offer-workflow-automation',
    title: 'WORKFLOW AUTOMATION',
    description: 'Connect n8n, Python, APIs, structured parsing, validation, and destinations into an inspectable operations workflow.',
  },
  {
    claimId: 'offer-computer-vision-support',
    title: 'COMPUTER VISION SUPPORT',
    description: 'Use computer vision for image inputs or existing pipelines when the input, expected output, and review path are clear.',
  },
];

export const caseStudyEvidence = {
  n8n: {
    claimIds: ['n8n-document-web-extraction-workflow'],
    claimPlacement: 'n8n case study',
    scope: 'Web and document inputs move through extraction steps into structured records. Define and test the fields against your own sources before relying on the workflow.',
  },
  invoice: {
    claimIds: ['ocr-client-fields-to-spreadsheet'],
    claimPlacement: 'invoice case study',
    scope: 'Client fields from a known invoice layout are exported for spreadsheet review. Other layouts need parser changes.',
  },
  pose: {
    claimIds: ['yolo-still-image-pose-estimation'],
    claimPlacement: 'pose case study',
    scope: 'Pose overlays are generated on still images. Timing and accuracy depend on your data and need evaluation.',
  },
};
