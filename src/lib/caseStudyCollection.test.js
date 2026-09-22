import { describe, expect, it } from 'vitest';
import {
  selectCoreCollectionCaseStudies,
  selectOtherWorkCaseStudies,
  sortCaseStudiesByCompletion,
} from './caseStudyCollection';

const story = (slug, completedAt, projectStatus = 'completed') => ({
  slug,
  completedAt,
  projectStatus,
});

describe('sortCaseStudiesByCompletion', () => {
  it('keeps an older project behind newer completion dates regardless of publication order', () => {
    const stories = [
      story('recently-published-older-project', '2024-02'),
      story('older-published-newer-project', '2026-08'),
      story('middle-project', '2025-11'),
    ];

    expect(sortCaseStudiesByCompletion(stories).map(({ slug }) => slug)).toEqual([
      'older-published-newer-project',
      'middle-project',
      'recently-published-older-project',
    ]);
  });

  it('uses an ASCII slug tie-breaker independent of input order', () => {
    const firstOrder = [story('zulu', '2025-06'), story('alpha', '2025-06'), story('bravo', '2025-06')];
    const secondOrder = [...firstOrder].reverse();

    expect(sortCaseStudiesByCompletion(firstOrder).map(({ slug }) => slug)).toEqual(['alpha', 'bravo', 'zulu']);
    expect(sortCaseStudiesByCompletion(secondOrder).map(({ slug }) => slug)).toEqual(['alpha', 'bravo', 'zulu']);
  });

  it('does not mutate input and places missing or invalid completion dates last', () => {
    const stories = [story('missing', undefined), story('known', '2025-01'), story('invalid', '2025-13')];
    const original = [...stories];

    expect(sortCaseStudiesByCompletion(stories).map(({ slug }) => slug)).toEqual(['known', 'invalid', 'missing']);
    expect(stories).toEqual(original);
  });
});

describe('other-work collection partition', () => {
  it('excludes configured slugs from core, includes them in other-work, and completion-sorts both', () => {
    const stories = [
      story('core-new', '2026-08'),
      story('other-old', '2024-01'),
      story('core-old', '2024-06'),
      story('other-new', '2026-01'),
    ];
    const slugs = ['other-old', 'other-new'];

    expect(selectCoreCollectionCaseStudies(stories, slugs).map(({ slug }) => slug)).toEqual([
      'core-new',
      'core-old',
    ]);
    expect(selectOtherWorkCaseStudies(stories, slugs).map(({ slug }) => slug)).toEqual([
      'other-new',
      'other-old',
    ]);
  });

  it('skips a missing slug', () => {
    const stories = [story('kept'), story('core')];

    expect(selectOtherWorkCaseStudies(stories, ['missing', 'kept']).map(({ slug }) => slug)).toEqual(['kept']);
    expect(selectCoreCollectionCaseStudies(stories, ['missing', 'kept']).map(({ slug }) => slug)).toEqual(['core']);
  });

  it('lists a duplicate configured slug once', () => {
    const stories = [story('kept'), story('core')];

    expect(selectOtherWorkCaseStudies(stories, ['kept', 'kept']).map(({ slug }) => slug)).toEqual(['kept']);
  });

  it('skips a slug that is not in the eligible input', () => {
    const stories = [story('kept')];

    expect(selectOtherWorkCaseStudies(stories, ['kept', 'elsewhere']).map(({ slug }) => slug)).toEqual(['kept']);
    expect(selectCoreCollectionCaseStudies(stories, ['elsewhere']).map(({ slug }) => slug)).toEqual(['kept']);
  });

  it('does not mutate the eligible input', () => {
    const stories = [story('two', '2024-01'), story('one', '2026-01')];
    const original = stories.map((item) => ({ ...item }));

    selectCoreCollectionCaseStudies(stories, ['one']);
    selectOtherWorkCaseStudies(stories, ['one']);

    expect(stories).toEqual(original);
  });

  it('returns sorted eligible as core and an empty other-work list when no slugs are configured', () => {
    const stories = [story('b', '2024-01'), story('a', '2026-01')];

    expect(selectCoreCollectionCaseStudies(stories, [])).toEqual(sortCaseStudiesByCompletion(stories));
    expect(selectOtherWorkCaseStudies(stories, [])).toEqual([]);
  });

  it('does not cap other-work at three stories', () => {
    const stories = ['a', 'b', 'c', 'd', 'core'].map((slug) => story(slug, '2025-01'));

    expect(selectOtherWorkCaseStudies(stories, ['a', 'b', 'c', 'd']).map(({ slug }) => slug)).toEqual([
      'a',
      'b',
      'c',
      'd',
    ]);
  });

  it('matches other-work slugs exactly, so uppercase names are skipped', () => {
    const stories = [story('kept', '2025-01'), story('core', '2025-01')];

    expect(selectOtherWorkCaseStudies(stories, ['KEPT', 'kept', '']).map(({ slug }) => slug)).toEqual(['kept']);
  });
});
