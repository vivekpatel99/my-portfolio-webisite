// Application code receives only the validated public projection. Vite
// replaces its dependency with an in-memory module before bundling so private
// records, drafts, claim references, and approval metadata cannot be emitted.
export {
  caseStudies,
  eligibleCaseStudies,
  collectionCaseStudies,
  eligibleCaseStudyCount,
  featuredCaseStudies,
  getCaseStudyBySlug,
  caseStudySlugs,
  primaryContactHref,
  directEmailHref,
} from '../../publication/public-case-studies.js';
