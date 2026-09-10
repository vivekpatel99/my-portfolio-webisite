import { featuredCaseStudySlugs } from '../../publication/case-study-featured.js';

export const selectFeaturedCaseStudies = (
  eligibleStories,
  configuredSlugs = featuredCaseStudySlugs,
) => {
  const storiesBySlug = new Map(eligibleStories.map((story) => [story.slug, story]));
  const selected = [];
  const selectedSlugs = new Set();

  for (const slug of configuredSlugs) {
    if (selected.length === 3 || selectedSlugs.has(slug)) continue;

    const story = storiesBySlug.get(slug);
    if (!story) continue;

    selected.push(story);
    selectedSlugs.add(slug);
  }

  return selected;
};
