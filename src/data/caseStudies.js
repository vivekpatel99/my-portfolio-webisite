import { portfolioImages, socialLinks } from '../config/links.js';
import { caseStudyEvidence } from './positioning.js';

export const caseStudies = [
  {
    id: 'n8n-openai-data-extraction', slug: 'n8n-openai-data-extraction', title: 'n8n + OpenAI Data Extraction',
    cardTitle: 'Document & Web Data Extraction', category: 'Workflow Automation',
    summary: 'An n8n workflow that assembles structured parsing, validation, and handoff steps for document and web data.',
    challenge: 'The implementation focused on moving defined incoming material toward structured records without hiding the steps that need review.',
    solution: 'The reviewed workflow combines n8n, structured parsing, HTTP, code, conditional, batch, and Sheets handoff pieces.',
    outcome: caseStudyEvidence.n8n.scope, claimIds: caseStudyEvidence.n8n.claimIds, claimPlacement: caseStudyEvidence.n8n.claimPlacement,
    image: { kind: 'schematic', alt: 'Illustrative diagram of input, extraction, validation, and handoff steps.', label: 'Input → extraction → validation → handoff' },
    gallery: [], stack: ['n8n', 'OpenAI', 'Structured Parsing', 'Data Validation'],
    externalLinks: [{ label: 'Upwork project', href: 'https://www.upwork.com/freelancers/vivekpatel99?p=1981676982472949760' }],
  },
  {
    id: 'invoice-ocr-extraction', slug: 'invoice-ocr-extraction', title: 'Invoice OCR Client-Field Extraction',
    cardTitle: 'Invoice OCR Data Extraction', category: 'Document AI',
    summary: 'A local OCR script that extracts client fields from a sample invoice layout into spreadsheet rows for human review.',
    challenge: 'The implementation scope was to identify defined client fields from a sample layout and produce a reviewable spreadsheet row.',
    solution: 'The reviewed Python script crops an image area, processes OCR results, and writes source-file, client-name, client-address, and tax-ID fields to Excel.',
    outcome: caseStudyEvidence.invoice.scope, claimIds: caseStudyEvidence.invoice.claimIds, claimPlacement: caseStudyEvidence.invoice.claimPlacement,
    image: { kind: 'schematic', alt: 'Illustrative diagram of an invoice image becoming client fields in a spreadsheet row.', label: 'Invoice image → client fields → review row' },
    gallery: [], stack: ['OCR', 'Python', 'Image Processing', 'Spreadsheet Export'],
    externalLinks: [{ label: 'Upwork project', href: 'https://www.upwork.com/freelancers/vivekpatel99?p=1961697513038176256' }],
  },
  {
    id: 'yolo-computer-vision-optimization', slug: 'yolo-computer-vision-optimization', title: 'YOLO Pose Estimation on Still Images',
    cardTitle: 'YOLO Pose Estimation', category: 'Computer Vision',
    summary: 'A YOLO-based pose-estimation workflow that processes still images and saves annotated overlays.',
    challenge: 'The work focused on applying a pose model to supplied still-image inputs and preserving a visual result for review.',
    solution: 'The reviewed code loads still images, runs model prediction, and saves pose-estimation overlays.',
    outcome: caseStudyEvidence.pose.scope, claimIds: caseStudyEvidence.pose.claimIds, claimPlacement: caseStudyEvidence.pose.claimPlacement,
    image: { kind: 'image', src: portfolioImages.yogaPose, alt: 'YOLO pose-estimation overlay on a still image.' },
    gallery: [], stack: ['YOLO', 'Python', 'Computer Vision', 'Still Images'],
    externalLinks: [{ label: 'Upwork project', href: 'https://www.upwork.com/freelancers/vivekpatel99?p=1962080616292315136' }],
  },
];

export const featuredCaseStudies = caseStudies;
export const getCaseStudyBySlug = (slug) => caseStudies.find((caseStudy) => caseStudy.slug === slug);
export const caseStudySlugs = caseStudies.map((caseStudy) => caseStudy.slug);
export const primaryContactHref = '/contact/';
export const directEmailHref = socialLinks.emailHref;
