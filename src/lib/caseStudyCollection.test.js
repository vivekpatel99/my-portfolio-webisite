import { describe, expect, it } from 'vitest';
import { sortCaseStudiesByCompletion } from './caseStudyCollection';

const story = (slug, completedAt) => ({ slug, completedAt });

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
