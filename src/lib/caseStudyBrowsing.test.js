import { describe, expect, it } from 'vitest';
import {
  CASE_STUDY_BROWSING_STORAGE_KEY,
  clearBrowsingState,
  getInitialBrowsingState,
  readBrowsingState,
  saveBrowsingState,
} from './caseStudyBrowsing';

const storage = () => {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
};

describe('case study browsing state', () => {
  it('stores only the loaded count and scroll position, then clears it', () => {
    const session = storage();

    saveBrowsingState({ loadedCount: 12, scrollY: 480.5 }, { storage: session, eligibleCount: 20 });
    expect(JSON.parse(session.getItem(CASE_STUDY_BROWSING_STORAGE_KEY))).toEqual({ loadedCount: 12, scrollY: 480.5 });

    clearBrowsingState({ storage: session });
    expect(session.getItem(CASE_STUDY_BROWSING_STORAGE_KEY)).toBeNull();
  });

  it('defaults corrupt, unavailable, negative, and non-finite values safely', () => {
    const session = storage();
    session.setItem(CASE_STUDY_BROWSING_STORAGE_KEY, '{bad json');
    expect(readBrowsingState({ storage: session, eligibleCount: 20 })).toEqual({ loadedCount: 6, scrollY: 0 });

    session.setItem(CASE_STUDY_BROWSING_STORAGE_KEY, JSON.stringify({ loadedCount: -2, scrollY: -1 }));
    expect(readBrowsingState({ storage: session, eligibleCount: 20 })).toEqual({ loadedCount: 6, scrollY: 0 });
  });

  it('continues with defaults when session storage is unavailable', () => {
    const unavailable = {
      getItem: () => { throw new Error('blocked'); },
      setItem: () => { throw new Error('blocked'); },
      removeItem: () => { throw new Error('blocked'); },
    };

    expect(readBrowsingState({ storage: unavailable, eligibleCount: 20 })).toEqual({ loadedCount: 6, scrollY: 0 });
    expect(saveBrowsingState({ loadedCount: 12, scrollY: 50 }, { storage: unavailable, eligibleCount: 20 })).toEqual({ loadedCount: 12, scrollY: 50 });
    expect(() => clearBrowsingState({ storage: unavailable })).not.toThrow();
  });

  it('clamps saved counts when stories are removed and keeps finite scroll values', () => {
    const session = storage();
    session.setItem(CASE_STUDY_BROWSING_STORAGE_KEY, JSON.stringify({ loadedCount: 99, scrollY: 240 }));

    expect(readBrowsingState({ storage: session, eligibleCount: 4 })).toEqual({ loadedCount: 4, scrollY: 240 });
  });

  it('prefers a history-entry snapshot over a newer global session snapshot', () => {
    const session = storage();
    saveBrowsingState({ loadedCount: 18, scrollY: 900 }, { storage: session, eligibleCount: 20 });

    expect(readBrowsingState({
      storage: session,
      eligibleCount: 20,
      snapshot: { loadedCount: 6, scrollY: 120 },
    })).toEqual({ loadedCount: 6, scrollY: 120 });
  });

  it('restores POP or explicit resume entries but starts ordinary visits at the first page', () => {
    const session = storage();
    saveBrowsingState({ loadedCount: 12, scrollY: 300 }, { storage: session, eligibleCount: 20 });

    expect(getInitialBrowsingState({ storage: session, eligibleCount: 20, navigationType: 'POP' })).toEqual({ loadedCount: 12, scrollY: 300 });
    expect(getInitialBrowsingState({ storage: session, eligibleCount: 20, navigationType: 'PUSH', resume: true })).toEqual({ loadedCount: 12, scrollY: 300 });
    expect(getInitialBrowsingState({ storage: session, eligibleCount: 20, navigationType: 'PUSH' })).toEqual({ loadedCount: 6, scrollY: 0 });
  });

  it('resume with snapshot prefers entry snapshot over stale session', () => {
    const session = storage();
    saveBrowsingState({ loadedCount: 18, scrollY: 900 }, { storage: session, eligibleCount: 20 });

    expect(getInitialBrowsingState({
      storage: session,
      eligibleCount: 20,
      navigationType: 'PUSH',
      resume: true,
      snapshot: { loadedCount: 12, scrollY: 420 },
    })).toEqual({ loadedCount: 12, scrollY: 420 });
  });

  it('resume without snapshot falls back to session storage', () => {
    const session = storage();
    saveBrowsingState({ loadedCount: 18, scrollY: 900 }, { storage: session, eligibleCount: 20 });

    expect(getInitialBrowsingState({
      storage: session,
      eligibleCount: 20,
      navigationType: 'PUSH',
      resume: true,
    })).toEqual({ loadedCount: 18, scrollY: 900 });
  });

  it('resume with no snapshot and no session defaults to first page', () => {
    const session = storage();

    expect(getInitialBrowsingState({
      storage: session,
      eligibleCount: 20,
      navigationType: 'PUSH',
      resume: true,
    })).toEqual({ loadedCount: 6, scrollY: 0 });
  });
});
