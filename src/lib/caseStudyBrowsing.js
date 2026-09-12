export const CASE_STUDY_BROWSING_STORAGE_KEY = 'case-studies-browsing';
export const DEFAULT_CASE_STUDY_PAGE_SIZE = 6;

const browserStorage = () => {
  try {
    return typeof window !== 'undefined' ? window.sessionStorage : null;
  } catch {
    return null;
  }
};

const eligibleCountValue = (eligibleCount) => Number.isInteger(eligibleCount) && eligibleCount >= 0 ? eligibleCount : 0;

const defaultLoadedCount = (eligibleCount, pageSize) => {
  const count = eligibleCountValue(eligibleCount);
  const size = Number.isInteger(pageSize) && pageSize > 0 ? pageSize : DEFAULT_CASE_STUDY_PAGE_SIZE;
  return Math.min(size, count);
};

const normalizeState = ({ loadedCount, scrollY }, eligibleCount, pageSize) => {
  const fallbackCount = defaultLoadedCount(eligibleCount, pageSize);
  const maxCount = eligibleCountValue(eligibleCount);
  const validLoadedCount = Number.isInteger(loadedCount) && loadedCount > 0
    ? Math.max(loadedCount, fallbackCount)
    : fallbackCount;

  return {
    loadedCount: Math.min(validLoadedCount, maxCount),
    scrollY: Number.isFinite(scrollY) && scrollY >= 0 ? scrollY : 0,
  };
};

export const readBrowsingState = ({
  storage = browserStorage(),
  eligibleCount = 0,
  pageSize = DEFAULT_CASE_STUDY_PAGE_SIZE,
  snapshot,
} = {}) => {
  if (snapshot && typeof snapshot === 'object' && !Array.isArray(snapshot)) {
    return normalizeState(snapshot, eligibleCount, pageSize);
  }
  if (!storage) return normalizeState({}, eligibleCount, pageSize);

  try {
    const raw = storage.getItem(CASE_STUDY_BROWSING_STORAGE_KEY);
    if (!raw) return normalizeState({}, eligibleCount, pageSize);
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return normalizeState({}, eligibleCount, pageSize);
    return normalizeState(parsed, eligibleCount, pageSize);
  } catch {
    return normalizeState({}, eligibleCount, pageSize);
  }
};

export const saveBrowsingState = (
  state,
  {
    storage = browserStorage(),
    eligibleCount = 0,
    pageSize = DEFAULT_CASE_STUDY_PAGE_SIZE,
  } = {},
) => {
  const normalized = normalizeState(state ?? {}, eligibleCount, pageSize);
  if (!storage) return normalized;

  try {
    storage.setItem(CASE_STUDY_BROWSING_STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    // Storage can be disabled or full; browsing still works for this visit.
  }
  return normalized;
};

export const clearBrowsingState = ({ storage = browserStorage() } = {}) => {
  if (!storage) return;

  try {
    storage.removeItem(CASE_STUDY_BROWSING_STORAGE_KEY);
  } catch {
    // Storage can be disabled; there is nothing else to clear.
  }
};

export const getInitialBrowsingState = ({
  storage = browserStorage(),
  eligibleCount = 0,
  navigationType = 'POP',
  resume = false,
  pageSize = DEFAULT_CASE_STUDY_PAGE_SIZE,
  snapshot,
} = {}) => {
  if (resume || navigationType === 'POP') {
    return readBrowsingState({ storage, eligibleCount, pageSize, snapshot });
  }

  return normalizeState({}, eligibleCount, pageSize);
};
