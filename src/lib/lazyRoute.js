import React, { lazy, useSyncExternalStore } from 'react';

let generation = 0;
const subscribers = new Set();

function subscribe(notify) {
  subscribers.add(notify);
  return () => subscribers.delete(notify);
}

export function getLazyRouteGeneration() {
  return generation;
}

/** Bump the lazy-route generation so Retry remounts with a fresh React.lazy factory. */
export function retryLazyRoutes() {
  generation += 1;
  subscribers.forEach((notify) => notify());
}

/** @visibleForTesting */
export function resetLazyRouteGenerationForTests() {
  generation = 0;
  subscribers.forEach((notify) => notify());
}

/**
 * Pull the static dynamic-import specifier Vite embeds in the factory source.
 * Production: `./ContactRoute-<hash>.js`. Dev: `/src/pages/ContactRoute.jsx`.
 */
export function extractImportSpecifier(importer) {
  const source = typeof importer?.toString === 'function'
    ? importer.toString()
    : Function.prototype.toString.call(importer);
  const match = source.match(/import\s*\(\s*["'`]([^"'`]+)["'`]\s*\)/);
  return match?.[1] ?? null;
}

/**
 * Resolve a Vite chunk specifier to an absolute URL.
 * Relative `./chunk.js` specs are resolved against `baseUrl` (typically import.meta.url
 * of this module, which Vite places alongside other assets under /assets/).
 */
export function resolveImportUrl(specifier, baseUrl = import.meta.url) {
  if (!specifier) return null;
  if (/^https?:\/\//i.test(specifier)) return specifier;
  if (specifier.startsWith('/')) {
    if (typeof window !== 'undefined' && window.location?.origin) {
      return new URL(specifier, window.location.origin).href;
    }
    return specifier;
  }
  try {
    return new URL(specifier, baseUrl).href;
  } catch {
    return null;
  }
}

export function cacheBustImportUrl(url, attempt) {
  const busted = new URL(url);
  busted.searchParams.set('retry', String(attempt));
  return busted.href;
}

async function loadRouteModule(importer, attempt, baseUrl) {
  if (attempt === 0) {
    return importer();
  }

  // Chromium re-requests the same module URL after connectivity returns.
  try {
    return await importer();
  } catch (error) {
    const specifier = extractImportSpecifier(importer);
    const url = resolveImportUrl(specifier, baseUrl);
    if (!url) throw error;
    // WebKit keeps failing the exact URL after a failed module import; a query bust recovers.
    return import(/* @vite-ignore */ cacheBustImportUrl(url, attempt));
  }
}

/**
 * Like React.lazy, but Retry can remount with a cache-busted dynamic import
 * instead of window.location.reload() (which does not re-fetch the chunk in WebKit).
 */
export function lazyRoute(importer) {
  const baseUrl = import.meta.url;
  const cache = new Map();

  function getLazy(attempt) {
    let component = cache.get(attempt);
    if (!component) {
      component = lazy(() => loadRouteModule(importer, attempt, baseUrl));
      cache.set(attempt, component);
    }
    return component;
  }

  function LazyRoute(props) {
    const attempt = useSyncExternalStore(
      subscribe,
      getLazyRouteGeneration,
      getLazyRouteGeneration,
    );
    return React.createElement(getLazy(attempt), props);
  }

  return LazyRoute;
}
