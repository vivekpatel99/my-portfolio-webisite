import React, { lazy, useEffect, useSyncExternalStore } from 'react';

let generation = 0;
const subscribers = new Set();
/** Set by retryLazyRoutes; consumed by the recovering route on remount. */
let pendingRetryGeneration = null;

/** CSS URLs Vite marked seen but failed to preload (offline / abort). */
const failedPreloadCssUrls = new Set();
let preloadErrorListenerBound = false;

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
  pendingRetryGeneration = generation;
  subscribers.forEach((notify) => notify());
}

/** Drop an unconsumed pending Retry (e.g. render-throw recovery left it set). */
export function clearPendingRetryGeneration() {
  pendingRetryGeneration = null;
}

/** @visibleForTesting */
export function resetLazyRouteGenerationForTests() {
  generation = 0;
  pendingRetryGeneration = null;
  failedPreloadCssUrls.clear();
  subscribers.forEach((notify) => notify());
}

/**
 * Listen for Vite preload failures so Retry can re-fetch CSS that was marked
 * "seen" before it loaded (offline stylesheet preload).
 */
export function bindVitePreloadErrorListener() {
  if (preloadErrorListenerBound || typeof window === 'undefined') return;
  preloadErrorListenerBound = true;
  window.addEventListener('vite:preloadError', (event) => {
    const reason = event?.payload;
    const message = reason?.message ?? String(reason ?? '');
    const match = message.match(/Unable to preload CSS for (.+)$/);
    if (match?.[1]) failedPreloadCssUrls.add(match[1]);
  });
}

/** @visibleForTesting */
export function noteFailedPreloadCssUrlForTests(url) {
  failedPreloadCssUrls.add(url);
}

/** @visibleForTesting */
export function getFailedPreloadCssUrlsForTests() {
  return [...failedPreloadCssUrls];
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

/** Full document reload when an obsolete hashed chunk cannot be recovered in-page. */
export function reloadDocument() {
  if (typeof document !== 'undefined' && typeof document.location?.reload === 'function') {
    document.location.reload();
  }
}

/**
 * Classify whether a document reload can recover from a failed in-page retry.
 * - `missing`: 404/410 obsolete hash after deploy → reload
 * - `present`: 2xx/304 but import still failed (stuck module map / transitive) → reload
 * - `transient`: 5xx / other HTTP errors → stay on recovery UI
 * - `unreachable`: offline / aborted → stay on recovery UI
 */
export async function classifyAssetFailure(url, fetchImpl = fetch) {
  if (!url || typeof fetchImpl !== 'function') return 'unreachable';

  const classifyResponse = (res) => {
    if (res.status === 404 || res.status === 410) return 'missing';
    if (res.ok || res.status === 304) return 'present';
    return 'transient';
  };

  try {
    return classifyResponse(await fetchImpl(url, { method: 'HEAD', cache: 'no-store' }));
  } catch {
    try {
      return classifyResponse(await fetchImpl(url, { method: 'GET', cache: 'no-store' }));
    } catch {
      return 'unreachable';
    }
  }
}

/** True when a full document reload is the right recovery for this asset failure. */
export async function shouldReloadForAssetFailure(url, fetchImpl = fetch) {
  const kind = await classifyAssetFailure(url, fetchImpl);
  return kind === 'missing' || kind === 'present';
}

/**
 * Route name prefix from a Vite chunk specifier (`./ContactRoute-abc.js` → `ContactRoute`).
 * Used to find sibling stylesheets Vite already inserted during a failed preload.
 */
export function routeAssetPrefix(specifier) {
  if (!specifier) return null;
  const file = specifier.split('/').pop() || '';
  const withoutExt = file.replace(/\.[^/.]+$/, '');
  // Vite default content-hash is 8 base64url chars and may include "-" / "_".
  // Strip the full hash (`ContactRoute-CFpe8O-z` → `ContactRoute`), not only the
  // final hyphen segment.
  const prefix = withoutExt.replace(/-[A-Za-z0-9_-]{8}$/, '');
  return prefix || null;
}

function absoluteAssetUrl(url) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  if (typeof window !== 'undefined' && window.location?.origin) {
    return new URL(url, window.location.origin).href;
  }
  return url;
}

function stripRetryParam(url) {
  const parsed = new URL(url);
  parsed.searchParams.delete('retry');
  return parsed.href;
}

/**
 * Discover stylesheet hrefs for this route: failed Vite preloads plus any
 * matching `/assets/<prefix>-*.css` links already in the document.
 */
export function collectRouteStylesheetUrls(specifier) {
  const urls = new Set();
  const prefix = routeAssetPrefix(specifier);

  for (const failed of failedPreloadCssUrls) {
    const abs = absoluteAssetUrl(failed);
    if (!abs) continue;
    // Only retry stylesheets that belong to this route (Contact failure must not
    // block a later Legal retry).
    if (prefix && !abs.includes(`/${prefix}-`)) continue;
    urls.add(stripRetryParam(abs));
  }

  if (typeof document === 'undefined') return [...urls];

  if (prefix) {
    document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
      const href = link.href;
      if (!href) return;
      if (href.includes(`/${prefix}-`) && /\.css(?:\?|$)/.test(href)) {
        urls.add(stripRetryParam(href));
      }
    });
  }

  return [...urls];
}

export function loadStylesheet(url) {
  if (typeof document === 'undefined') return Promise.resolve();

  // Avoid `href="..."` in source — public-route-integrity treats that as a route link.
  const existing = [...document.querySelectorAll('link[rel="stylesheet"]')]
    .find((link) => link.href === url || link.getAttribute('href') === url);
  if (existing) {
    try {
      if (existing.sheet) return Promise.resolve();
    } catch {
      // Cross-origin sheet access can throw; still treat as present.
      return Promise.resolve();
    }
  }

  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    link.addEventListener('load', () => resolve());
    link.addEventListener('error', () => reject(new Error(`Unable to load CSS for ${url}`)));
    document.head.appendChild(link);
  });
}

function staleStylesheetError(url) {
  const error = new Error(`Stale route stylesheet: ${url}`);
  error.staleAsset = true;
  return error;
}

/**
 * Vite skips stylesheets it already marked "seen" after an offline preload failure.
 * Cache-bust and re-insert those CSS deps so Contact.css (etc.) load on Retry.
 * Failures are not swallowed: missing/present → staleAsset (reload); otherwise rethrow
 * so the route error fallback stays up instead of rendering unstyled content.
 */
export async function retryRouteStylesheets(importer, attempt, fetchImpl = fetch) {
  const specifier = extractImportSpecifier(importer);
  const urls = collectRouteStylesheetUrls(specifier);
  if (urls.length === 0) return;

  await Promise.all(urls.map(async (url) => {
    const busted = cacheBustImportUrl(url, attempt);
    try {
      await loadStylesheet(busted);
      for (const failed of [...failedPreloadCssUrls]) {
        const abs = absoluteAssetUrl(failed);
        if (abs && stripRetryParam(abs) === url) failedPreloadCssUrls.delete(failed);
      }
    } catch (error) {
      // Probe the URL that actually failed (with ?retry=), not the bare asset.
      if (await shouldReloadForAssetFailure(busted, fetchImpl)) {
        throw staleStylesheetError(url);
      }
      // Transient HTTP or offline — keep the recovery UI; do not render without CSS.
      throw error;
    }
  }));
}

/** @visibleForTesting */
export async function loadRouteModule(
  importer,
  attempt,
  baseUrl,
  dynamicImport = (url) => import(/* @vite-ignore */ url),
  reload = reloadDocument,
  fetchImpl = fetch,
) {
  if (attempt === 0) {
    return importer();
  }

  // After a prior offline CSS preload failure, Vite skips the stylesheet on the
  // next importer() call; re-fetch CSS deps with a cache-bust before JS retry.
  try {
    await retryRouteStylesheets(importer, attempt, fetchImpl);
  } catch (cssError) {
    if (cssError?.staleAsset) {
      reload();
    }
    throw cssError;
  }

  // Chromium re-requests the same module URL after connectivity returns.
  try {
    return await importer();
  } catch (error) {
    const specifier = extractImportSpecifier(importer);
    const url = resolveImportUrl(specifier, baseUrl);
    if (!url) throw error;
    // WebKit keeps failing the exact URL after a failed module import; a query bust recovers.
    // Transitive deps may still be stuck in WebKit's module map when the entry URL is present.
    const busted = cacheBustImportUrl(url, attempt);
    try {
      return await dynamicImport(busted);
    } catch (bustError) {
      // Probe the URL that actually failed (with ?retry=), not the bare asset.
      if (await shouldReloadForAssetFailure(busted, fetchImpl)) {
        reload();
      }
      throw bustError;
    }
  }
}

/**
 * Like React.lazy, but Retry can remount with a cache-busted dynamic import
 * instead of window.location.reload() (which does not re-fetch the chunk in WebKit).
 *
 * Each mount captures a generation baseline so a prior Retry on another route does
 * not make a newly visited route start on attempt > 0 (cache-bust / reload) by default.
 */
export function lazyRoute(importer) {
  bindVitePreloadErrorListener();
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

  // Per-factory retry epoch. Each user Retry bumps epoch and clears this
  // factory's lazy cache so a second Retry cannot reuse a rejected React.lazy.
  // Fresh visits (no pending retry) start at epoch 0.
  let mountBaseline = null;
  let retryEpoch = 0;

  function LazyRoute(props) {
    const currentGeneration = useSyncExternalStore(
      subscribe,
      getLazyRouteGeneration,
      getLazyRouteGeneration,
    );
    // Consume pending Retry even when mountBaseline was set during a Suspense
    // render that rejected before useEffect committed (cleanup never ran).
    if (pendingRetryGeneration != null && pendingRetryGeneration === currentGeneration) {
      pendingRetryGeneration = null;
      retryEpoch += 1;
      cache.clear();
      if (mountBaseline === null) {
        mountBaseline = currentGeneration - retryEpoch;
      }
    } else if (mountBaseline === null) {
      mountBaseline = currentGeneration;
      retryEpoch = 0;
    }
    const localAttempt = retryEpoch;

    useEffect(() => () => {
      mountBaseline = null;
      retryEpoch = 0;
    }, []);

    return React.createElement(getLazy(localAttempt), props);
  }

  return LazyRoute;
}
