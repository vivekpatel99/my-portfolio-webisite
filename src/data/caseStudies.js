// Application code receives only the validated public projection. Vite
// replaces its dependency with an in-memory module before bundling so private
// records, drafts, claim references, and approval metadata cannot be emitted.
export { otherWorkCaseStudySlugs } from '../../publication/case-study-other-work.js';
export {
  caseStudies,
  eligibleCaseStudies,
  collectionCaseStudies,
  otherWorkCaseStudies,
  eligibleCaseStudyCount,
  featuredCaseStudies,
  getCaseStudyBySlug,
  caseStudySlugs,
  primaryContactHref,
  directEmailHref,
} from '../../publication/public-case-studies.js';
