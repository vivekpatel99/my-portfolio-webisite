import { otherWorkCaseStudySlugs } from '../../publication/case-study-other-work.js';

const COMPLETION_MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;

const completionMonthValue = (completedAt) => {
  const match = typeof completedAt === 'string' ? completedAt.match(COMPLETION_MONTH_PATTERN) : null;
  return match ? Number(match[1]) * 12 + Number(match[2]) : null;
};

const compareSlugs = (left, right) => {
  const leftSlug = String(left.slug ?? '');
  const rightSlug = String(right.slug ?? '');
  if (leftSlug < rightSlug) return -1;
  if (leftSlug > rightSlug) return 1;
  return 0;
};

export const sortCaseStudiesByCompletion = (stories) => [...stories].sort((left, right) => {
  const leftMonth = completionMonthValue(left.completedAt);
  const rightMonth = completionMonthValue(right.completedAt);

  if (leftMonth === null && rightMonth !== null) return 1;
  if (leftMonth !== null && rightMonth === null) return -1;
  if (leftMonth !== null && rightMonth !== null && leftMonth !== rightMonth) return rightMonth - leftMonth;
  return compareSlugs(left, right);
});

export const selectOtherWorkCaseStudies = (
  eligibleStories,
  slugs = otherWorkCaseStudySlugs,
) => {
  const otherWorkSlugs = new Set(slugs);
  return sortCaseStudiesByCompletion(eligibleStories.filter((story) => otherWorkSlugs.has(story.slug)));
};

export const selectCoreCollectionCaseStudies = (
  eligibleStories,
  slugs = otherWorkCaseStudySlugs,
) => {
  const otherWorkSlugs = new Set(slugs);
  return sortCaseStudiesByCompletion(eligibleStories.filter((story) => !otherWorkSlugs.has(story.slug)));
};
