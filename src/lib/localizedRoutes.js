import { serviceOffers, serviceRouteForId } from '../data/serviceOffers.js';

export const translatedRoutePairs = [
  '/',
  '/contact',
  '/legal',
  '/data-policy',
  '/case-studies',
  ...serviceOffers.map(({ id }) => serviceRouteForId(id)),
].map((en) => ({ en, de: en === '/' ? '/de' : `/de${en}` }));

export const localeFromPath = (pathname) => /^\/de(?:\/|$)/.test(pathname) ? 'de' : 'en';

export const findTranslatedRoute = (pathname) => {
  const route = pathname.replace(/\/+$/, '') || '/';
  return translatedRoutePairs.find(({ en, de }) => en === route || de === route);
};

export const localizedPath = (path, locale) => {
  const [pathname] = path.split(/[?#]/, 1);
  const pair = findTranslatedRoute(pathname);
  if (!pair || localeFromPath(pathname) === locale) return path;
  return `${pair[locale].replace(/\/$/, '')}/${path.slice(pathname.length)}`;
};

export const alternatePaths = (pathname) => {
  const pair = findTranslatedRoute(pathname);
  return pair ? { ...pair, 'x-default': pair.en } : { en: pathname, 'x-default': pathname };
};
