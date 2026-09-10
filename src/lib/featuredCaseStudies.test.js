import { describe, expect, it } from 'vitest';
import { selectFeaturedCaseStudies } from './featuredCaseStudies';

const story = (slug, completedAt = '2025-01', projectStatus = 'completed') => ({
  slug,
  completedAt,
  projectStatus,
});

describe('selectFeaturedCaseStudies', () => {
  it.each([
    [0, []],
    [1, ['one']],
    [2, ['one', 'two']],
    [3, ['one', 'two', 'three']],
    [20, ['one', 'two', 'three']],
  ])('selects at most three configured stories from %i eligible stories', (count, expected) => {
    const stories = Array.from({ length: count }, (_, index) => story(['one', 'two', 'three', 'four'][index] ?? `story-${index}`));
    expect(selectFeaturedCaseStudies(stories, ['one', 'two', 'three', 'four']).map(({ slug }) => slug)).toEqual(expected);
  });

  it('follows configured order rather than newest completion order', () => {
    const stories = [story('newest', '2026-08'), story('handpicked-old', '2024-01'), story('other', '2025-06')];

    expect(selectFeaturedCaseStudies(stories, ['handpicked-old', 'other', 'newest']).map(({ slug }) => slug)).toEqual([
      'handpicked-old',
      'other',
      'newest',
    ]);
  });

  it('omits unavailable stories and duplicate configuration entries without filling slots', () => {
    const eligibleStories = [story('kept')];

    expect(selectFeaturedCaseStudies(eligibleStories, ['removed', 'kept', 'kept', 'ongoing'])).toEqual([eligibleStories[0]]);
  });

  it('does not mutate the eligible input', () => {
    const stories = [story('two'), story('one'), story('three')];
    const original = [...stories];

    selectFeaturedCaseStudies(stories, ['one', 'two']);

    expect(stories).toEqual(original);
  });
});
