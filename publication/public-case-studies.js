// Node consumers compile from the authoritative build-only manifest. Vite
// replaces this module before dependency traversal, so the manifest and its
// draft/approval metadata can never enter a browser bundle.
import { compileCaseStudyPublication } from './compile-case-studies.js';
import { sortCaseStudiesByCompletion } from '../src/lib/caseStudyCollection.js';
import { selectFeaturedCaseStudies } from '../src/lib/featuredCaseStudies.js';

export const caseStudies = compileCaseStudyPublication();
export const eligibleCaseStudies = caseStudies.filter((caseStudy) => caseStudy.projectStatus === 'completed' && caseStudy.completedAt);
export const collectionCaseStudies = sortCaseStudiesByCompletion(eligibleCaseStudies);
export const eligibleCaseStudyCount = eligibleCaseStudies.length;
export const featuredCaseStudies = selectFeaturedCaseStudies(eligibleCaseStudies);
export const getCaseStudyBySlug = (slug) => caseStudies.find((caseStudy) => caseStudy.slug === slug);
export const caseStudySlugs = caseStudies.map((caseStudy) => caseStudy.slug);
export const primaryContactHref = '/contact/';
export const directEmailHref = 'mailto:contact@vivekpatel.com';
