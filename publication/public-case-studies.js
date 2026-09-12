// Node consumers compile from the authoritative build-only manifest. Vite
// replaces this module before dependency traversal, so the manifest and its
// draft/approval metadata can never enter a browser bundle.
import { compileCaseStudyPublication, sortCaseStudiesByCompletion } from './compile-case-studies.js';

export const caseStudies = compileCaseStudyPublication();
export const eligibleCaseStudies = caseStudies.filter((caseStudy) => caseStudy.projectStatus === 'completed' && caseStudy.completedAt);
export const collectionCaseStudies = sortCaseStudiesByCompletion(eligibleCaseStudies);
export const eligibleCaseStudyCount = eligibleCaseStudies.length;
export const featuredCaseStudies = eligibleCaseStudies;
export const getCaseStudyBySlug = (slug) => caseStudies.find((caseStudy) => caseStudy.slug === slug);
export const caseStudySlugs = caseStudies.map((caseStudy) => caseStudy.slug);
export const primaryContactHref = '/contact/';
export const directEmailHref = 'mailto:contact@vivekpatel.com';
