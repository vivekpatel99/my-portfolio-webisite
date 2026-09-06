import { socialLinks } from '../config/links.js';
import { PUBLISHING_STATUS, publishCaseStudies } from './caseStudyPublishing.js';

// This browser-imported list deliberately contains only Portfolio-safe Content.
// Unpublished records are metadata-only so draft text cannot enter the client bundle.
export const caseStudyPublicationRecords = [
  {
    id: 'n8n-openai-data-extraction', publishingStatus: PUBLISHING_STATUS.PUBLISHED, publicationApproved: true,
    portfolioSafeContent: {
      slug: 'n8n-openai-data-extraction', title: 'n8n + OpenAI Data Extraction', cardTitle: 'Document & Web Data Extraction', category: 'Workflow Automation',
      summary: 'An n8n workflow that assembles structured parsing, validation, and handoff steps for document and web data.',
      image: { kind: 'schematic', alt: 'Illustrative diagram of input, extraction, validation, and handoff steps.', label: 'Input → extraction → validation → handoff', caption: 'Schematic of the reviewed workflow stages; it is not a client workflow screenshot.' },
      gallery: [], stack: ['n8n', 'OpenAI', 'Structured Parsing', 'Data Validation'],
      claims: [{ id: 'n8n-document-web-extraction-workflow', placement: 'n8n case study' }],
      story: {
        situation: 'The implementation focused on moving defined incoming material toward structured records without hiding the steps that need review.',
        constraints: ['The evidence supports implementation pieces, not measured savings or reliability.', 'Fields must be defined and tested against the source material before the workflow is relied on.'],
        interpretationNotice: 'Engineering interpretation, not a record of client decisions.',
        decisions: ['Keeping the structured parser, HTTP, code, conditional, batch, and Sheets handoff pieces distinct makes the extraction and review path explicit.', 'The conditional and batch pieces provide visible stages for handling defined fields before the Sheets handoff.'],
        approach: ['The reviewed workflow combines n8n, structured parsing, HTTP, code, conditional, batch, and Sheets handoff pieces.', 'The approach moves web and document inputs through extraction steps into structured records for review.'],
        evidence: ['Reviewed workflow artifacts support the structured parser, HTTP, code, conditional, batch, and Sheets handoff pieces.'],
        result: ['The reviewed workflow defines extraction steps and a Sheets handoff for structured records. No measured client outcome, savings, reliability, or acceptance result is provided.'],
        limitations: ['Web and document inputs move through extraction steps into structured records. Define and test the fields against your own sources before relying on the workflow.'],
        relatedExperience: { status: 'not-provided', text: 'No approved case-specific credential is provided for this case study.', links: [] },
      },
      links: {
        service: [{ label: 'Discuss a similar workflow', href: '/contact/' }],
        clientFeedback: [],
        proof: [{ label: 'View related Upwork project', href: 'https://www.upwork.com/freelancers/vivekpatel99?p=1981676982472949760' }],
      },
    },
  },
  {
    id: 'invoice-ocr-extraction', publishingStatus: PUBLISHING_STATUS.PUBLISHED, publicationApproved: true,
    portfolioSafeContent: {
      slug: 'invoice-ocr-extraction', title: 'Invoice OCR Client-Field Extraction', cardTitle: 'Invoice OCR Data Extraction', category: 'Document AI',
      summary: 'A local OCR script that extracts client fields from a sample invoice layout into spreadsheet rows for human review.',
      image: { kind: 'schematic', alt: 'Illustrative diagram of an invoice image becoming client fields in a spreadsheet row.', label: 'Invoice image → client fields → review row', caption: 'Schematic of the reviewed OCR handoff; no invoice media is used because its public provenance is unresolved.' },
      gallery: [], stack: ['OCR', 'Python', 'Image Processing', 'Spreadsheet Export'],
      claims: [{ id: 'ocr-client-fields-to-spreadsheet', placement: 'invoice case study' }],
      story: {
        situation: 'The implementation scope was to identify defined client fields from a sample layout and produce a reviewable spreadsheet row.',
        constraints: ['The supported scope is client fields from a known invoice layout to spreadsheet rows for human review.', 'The source evidence does not support seller extraction, accuracy, time-saving, cloud, or UI assertions.'],
        interpretationNotice: 'Engineering interpretation, not a record of client decisions.',
        decisions: ['Cropping an image area before OCR narrows processing to the defined part of the known layout.', 'Writing source-file and client-field values to Excel makes the extracted row available for human review.'],
        approach: ['The reviewed Python script crops an image area, processes OCR results, and writes source-file, client-name, client-address, and tax-ID fields to Excel.', 'The spreadsheet row provides the handoff point for human review.'],
        evidence: ['The reviewed OCR source artifact supports extracting client fields from a sample invoice layout to spreadsheet rows.'],
        result: ['The supported implementation output is an Excel row with source-file, client-name, client-address, and tax-ID fields from the known layout. No measured client outcome, accuracy, time-saving, or acceptance result is provided.'],
        limitations: ['Client fields from a known invoice layout are exported for spreadsheet review. Other layouts need parser changes.'],
        relatedExperience: { status: 'not-provided', text: 'No approved case-specific credential is provided for this case study.', links: [] },
      },
      links: {
        service: [{ label: 'Discuss a similar extraction workflow', href: '/contact/' }],
        clientFeedback: [],
        proof: [{ label: 'View related Upwork project', href: 'https://www.upwork.com/freelancers/vivekpatel99?p=1961697513038176256' }],
      },
    },
  },
  {
    id: 'yolo-computer-vision-optimization', publishingStatus: PUBLISHING_STATUS.PUBLISHED, publicationApproved: true,
    portfolioSafeContent: {
      slug: 'yolo-computer-vision-optimization', title: 'YOLO Pose Estimation on Still Images', cardTitle: 'YOLO Pose Estimation', category: 'Computer Vision',
      summary: 'A YOLO-based pose-estimation workflow that processes still images and saves annotated overlays.',
      image: { kind: 'schematic', alt: 'Illustrative diagram of a still image being processed into a pose overlay.', label: 'Still image → pose overlay → review', caption: 'Schematic of still-image pose overlay processing; it is not a measured production demonstration.' },
      gallery: [], stack: ['YOLO', 'Python', 'Computer Vision', 'Still Images'],
      claims: [{ id: 'yolo-still-image-pose-estimation', placement: 'pose case study' }],
      story: {
        situation: 'The work focused on applying a pose model to supplied still-image inputs and preserving a visual result for review.',
        constraints: ['The evidence supports overlays on still images, not video, latency, accuracy, or application-delivery claims.', 'Timing and accuracy require evaluation for a buyer’s data.'],
        interpretationNotice: 'Engineering interpretation, not a record of client decisions.',
        decisions: ['Loading still images before model prediction keeps the supported input scope to individual images.', 'Saving pose-estimation overlays preserves a visual artifact that can be inspected after prediction.'],
        approach: ['The reviewed code loads still images, runs model prediction, and saves pose-estimation overlays.', 'The saved overlay preserves a visual result for review.'],
        evidence: ['Reviewed pose inference and training source artifacts support processing still images and saving pose overlays.'],
        result: ['The supported implementation output is saved pose-estimation overlays from still-image processing. No measured client outcome, accuracy, timing, video support, or acceptance result is provided.'],
        limitations: ['Pose overlays are generated on still images. Timing and accuracy depend on your data and need evaluation.'],
        relatedExperience: { status: 'not-provided', text: 'No approved case-specific credential is provided for this case study.', links: [] },
      },
      links: {
        service: [{ label: 'Discuss a similar computer-vision workflow', href: '/contact/' }],
        clientFeedback: [],
        proof: [{ label: 'View related Upwork project', href: 'https://www.upwork.com/freelancers/vivekpatel99?p=1962080616292315136' }],
      },
    },
  },
  { id: 'withheld-case-study', publishingStatus: PUBLISHING_STATUS.DRAFT, publicationApproved: false },
];

export const caseStudies = publishCaseStudies(caseStudyPublicationRecords);
export const featuredCaseStudies = caseStudies;
export const getCaseStudyBySlug = (slug) => caseStudies.find((caseStudy) => caseStudy.slug === slug);
export const caseStudySlugs = Object.freeze(caseStudies.map((caseStudy) => caseStudy.slug));
export const primaryContactHref = '/contact/';
export const directEmailHref = socialLinks.emailHref;
