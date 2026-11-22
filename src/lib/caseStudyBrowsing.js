import { localizedPath } from './localizedRoutes.js';

export const CASE_STUDY_BROWSING_STORAGE_KEY = 'case-studies-browsing';
export const DEFAULT_CASE_STUDY_PAGE_SIZE = 6;

const storageKey = (locale) => locale === 'de' ? `${CASE_STUDY_BROWSING_STORAGE_KEY}-de` : CASE_STUDY_BROWSING_STORAGE_KEY;

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
  locale,
} = {}) => {
  if (snapshot && typeof snapshot === 'object' && !Array.isArray(snapshot)) {
    return normalizeState(snapshot, eligibleCount, pageSize);
  }
  if (!storage) return normalizeState({}, eligibleCount, pageSize);

  try {
    const raw = storage.getItem(storageKey(locale));
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
    locale,
    eligibleCount = 0,
    pageSize = DEFAULT_CASE_STUDY_PAGE_SIZE,
  } = {},
) => {
  const normalized = normalizeState(state ?? {}, eligibleCount, pageSize);
  if (!storage) return normalized;

  try {
    storage.setItem(storageKey(locale), JSON.stringify(normalized));
  } catch {
    // Storage can be disabled or full; browsing still works for this visit.
  }
  return normalized;
};

export const clearBrowsingState = ({ storage = browserStorage(), locale } = {}) => {
  if (!storage) return;

  try {
    storage.removeItem(storageKey(locale));
  } catch {
    // Storage can be disabled; there is nothing else to clear.
  }
};

export const isCollectionArticleOrigin = (location) => {
  if (location?.state?.fromCollection === true) return true;
  if (typeof location?.search === 'string' && new URLSearchParams(location.search).get('from') === 'collection') {
    return true;
  }
  return false;
};

export const caseStudyArticleHref = (slug, { fromCollection = false, locale = 'en' } = {}) => {
  const params = new URLSearchParams();
  if (fromCollection) params.set('from', 'collection');
  if (locale === 'de') params.set('lang', 'de');
  return `/project/${slug}/${params.size ? `?${params}` : ''}`;
};

export const isGermanArticleOrigin = (location) => (
  new URLSearchParams(location?.search).get('lang') === 'de'
);

export const collectionReturnHref = (location) => {
  const path = localizedPath('/case-studies/', isGermanArticleOrigin(location) ? 'de' : 'en');
  return isCollectionArticleOrigin(location) ? `${path}?resume=1` : path;
};

export const consumeCollectionOriginLocation = (location) => {
  const params = new URLSearchParams(location?.search ?? '');
  if (params.get('from') !== 'collection') return null;
  params.delete('from');
  const search = params.toString();
  const priorState = location?.state && typeof location.state === 'object' && !Array.isArray(location.state)
    ? location.state
    : {};
  return {
    search: search ? `?${search}` : '',
    state: { ...priorState, fromCollection: true },
  };
};

export const getInitialBrowsingState = ({
  storage = browserStorage(),
  eligibleCount = 0,
  navigationType = 'POP',
  resume = false,
  pageSize = DEFAULT_CASE_STUDY_PAGE_SIZE,
  snapshot,
  locale,
} = {}) => {
  if (resume || navigationType === 'POP') {
    return readBrowsingState({ storage, eligibleCount, pageSize, snapshot, locale });
  }

  return normalizeState({}, eligibleCount, pageSize);
};
