/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  bindVitePreloadErrorListener,
  cacheBustImportUrl,
  collectRouteStylesheetUrls,
  extractImportSpecifier,
  getFailedPreloadCssUrlsForTests,
  getLazyRouteGeneration,
  isAssetRequestReachable,
  loadRouteModule,
  loadStylesheet,
  noteFailedPreloadCssUrlForTests,
  resetLazyRouteGenerationForTests,
  resolveImportUrl,
  retryLazyRoutes,
  retryRouteStylesheets,
  routeAssetPrefix,
} from './lazyRoute';

function importerWithSource(source, impl) {
  const importer = impl || (() => Promise.resolve({ default: () => null }));
  Object.defineProperty(importer, 'toString', {
    value: () => source,
  });
  return importer;
}

describe('lazyRoute helpers', () => {
  beforeEach(() => {
    resetLazyRouteGenerationForTests();
    document.head.innerHTML = '';
  });

  afterEach(() => {
    resetLazyRouteGenerationForTests();
    document.head.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('extracts the Vite production chunk specifier from a factory', () => {
    const factory = importerWithSource(
      '()=>Ze(()=>import("./ContactRoute-abc123.js"),__vite__mapDeps([0,1,2]))',
    );
    expect(extractImportSpecifier(factory)).toBe('./ContactRoute-abc123.js');
  });

  it('extracts absolute /src specifiers used in Vite dev', () => {
    const factory = importerWithSource('() => import("/src/pages/ContactRoute.jsx")');
    expect(extractImportSpecifier(factory)).toBe('/src/pages/ContactRoute.jsx');
  });

  it('returns null when the factory has no static import()', () => {
    expect(extractImportSpecifier(() => Promise.reject(new Error('nope')))).toBeNull();
  });

  it('resolves relative chunk specs against the module base URL', () => {
    expect(resolveImportUrl('./ContactRoute-abc.js', 'http://127.0.0.1:3000/assets/index.js'))
      .toBe('http://127.0.0.1:3000/assets/ContactRoute-abc.js');
  });

  it('resolves absolute paths against the page origin', () => {
    expect(resolveImportUrl('/src/pages/ContactRoute.jsx', 'http://127.0.0.1:3000/assets/x.js'))
      .toBe(`${window.location.origin}/src/pages/ContactRoute.jsx`);
  });

  it('appends a cache-busting retry query', () => {
    expect(cacheBustImportUrl('http://127.0.0.1:3000/assets/ContactRoute-abc.js', 2))
      .toBe('http://127.0.0.1:3000/assets/ContactRoute-abc.js?retry=2');
  });

  it('bumps the generation when Retry asks for another import attempt', () => {
    expect(getLazyRouteGeneration()).toBe(0);
    retryLazyRoutes();
    expect(getLazyRouteGeneration()).toBe(1);
    retryLazyRoutes();
    expect(getLazyRouteGeneration()).toBe(2);
  });

  it('derives the route asset prefix from a hashed chunk specifier', () => {
    expect(routeAssetPrefix('./ContactRoute-abc123.js')).toBe('ContactRoute');
    expect(routeAssetPrefix('/assets/Legal-XYZ.js')).toBe('Legal');
  });

  it('isAssetRequestReachable is true when fetch gets a response', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false, status: 404 }));
    await expect(isAssetRequestReachable('http://127.0.0.1/assets/x.js', fetchImpl)).resolves.toBe(true);
  });

  it('isAssetRequestReachable is false when fetch cannot connect', async () => {
    const fetchImpl = vi.fn(async () => { throw new TypeError('Failed to fetch'); });
    await expect(isAssetRequestReachable('http://127.0.0.1/assets/x.js', fetchImpl)).resolves.toBe(false);
  });
});

describe('lazyRoute reload fallback (obsolete chunk)', () => {
  beforeEach(() => {
    resetLazyRouteGenerationForTests();
  });

  afterEach(() => {
    resetLazyRouteGenerationForTests();
    vi.restoreAllMocks();
  });

  it('reloads when cache-bust fails but the asset URL is reachable (stale deploy / transitive map)', async () => {
    const reload = vi.fn();
    const fetchImpl = vi.fn(async () => ({ ok: false, status: 404 }));
    const importer = importerWithSource(
      '()=>import("./ContactRoute-oldhash.js")',
      () => Promise.reject(new Error('Failed to fetch dynamically imported module')),
    );
    const dynamicImport = vi.fn(() => Promise.reject(new Error('404 obsolete chunk')));

    await expect(
      loadRouteModule(importer, 1, 'http://127.0.0.1:3000/assets/index.js', dynamicImport, reload, fetchImpl),
    ).rejects.toThrow(/404 obsolete chunk/);

    expect(dynamicImport).toHaveBeenCalledWith(
      'http://127.0.0.1:3000/assets/ContactRoute-oldhash.js?retry=1',
    );
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('does not reload when cache-bust fails while offline (unreachable)', async () => {
    const reload = vi.fn();
    const fetchImpl = vi.fn(async () => { throw new TypeError('Failed to fetch'); });
    const importer = importerWithSource(
      '()=>import("./ContactRoute-oldhash.js")',
      () => Promise.reject(new Error('Failed to fetch dynamically imported module')),
    );
    const dynamicImport = vi.fn(() => Promise.reject(new Error('still offline')));

    await expect(
      loadRouteModule(importer, 1, 'http://127.0.0.1:3000/assets/index.js', dynamicImport, reload, fetchImpl),
    ).rejects.toThrow(/still offline/);

    expect(reload).not.toHaveBeenCalled();
  });

  it('does not reload when cache-bust import succeeds', async () => {
    const reload = vi.fn();
    const fetchImpl = vi.fn(async () => ({ ok: true, status: 200 }));
    const importer = importerWithSource(
      '()=>import("./ContactRoute-abc.js")',
      () => Promise.reject(new Error('webkit module map')),
    );
    const mod = { default: () => null };
    const dynamicImport = vi.fn(() => Promise.resolve(mod));

    await expect(
      loadRouteModule(importer, 1, 'http://127.0.0.1:3000/assets/index.js', dynamicImport, reload, fetchImpl),
    ).resolves.toBe(mod);

    expect(reload).not.toHaveBeenCalled();
  });
});

describe('lazyRoute CSS dependency retry', () => {
  beforeEach(() => {
    resetLazyRouteGenerationForTests();
    document.head.innerHTML = '';
    bindVitePreloadErrorListener();
  });

  afterEach(() => {
    resetLazyRouteGenerationForTests();
    document.head.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('records failed CSS preload URLs from vite:preloadError', () => {
    window.dispatchEvent(Object.assign(new Event('vite:preloadError'), {
      payload: new Error('Unable to preload CSS for /assets/ContactRoute-D4-jsGsd.css'),
    }));
    expect(getFailedPreloadCssUrlsForTests()).toContain('/assets/ContactRoute-D4-jsGsd.css');
  });

  it('collects failed and DOM stylesheet URLs for the route prefix', () => {
    noteFailedPreloadCssUrlForTests('/assets/ContactRoute-D4-jsGsd.css');
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `${window.location.origin}/assets/ContactRoute-D4-jsGsd.css`;
    document.head.appendChild(link);

    const urls = collectRouteStylesheetUrls('./ContactRoute-Dv4Ieurc.js');
    expect(urls.some((u) => u.includes('/assets/ContactRoute-D4-jsGsd.css'))).toBe(true);
  });

  it('cache-busts and loads route CSS on retry after a failed preload', async () => {
    noteFailedPreloadCssUrlForTests('/assets/ContactRoute-D4-jsGsd.css');

    const appendSpy = vi.spyOn(document.head, 'appendChild');
    appendSpy.mockImplementation((node) => {
      HTMLElement.prototype.appendChild.call(document.head, node);
      if (node.rel === 'stylesheet') {
        queueMicrotask(() => node.dispatchEvent(new Event('load')));
      }
      return node;
    });

    const importer = importerWithSource(
      '()=>Ze(()=>import("./ContactRoute-Dv4Ieurc.js"),__vite__mapDeps([0,1,2]))',
      () => Promise.resolve({ default: () => null }),
    );

    await retryRouteStylesheets(importer, 1);

    const busted = [...document.querySelectorAll('link[rel="stylesheet"]')]
      .map((l) => l.getAttribute('href') || l.href);
    expect(busted.some((href) => href.includes('ContactRoute-D4-jsGsd.css') && href.includes('retry=1'))).toBe(true);
    expect(getFailedPreloadCssUrlsForTests()).toHaveLength(0);
  });

  it('retries CSS deps before the JS import on attempt > 0', async () => {
    noteFailedPreloadCssUrlForTests(`${window.location.origin}/assets/ContactRoute-D4-jsGsd.css`);

    const loadOrder = [];
    const appendSpy = vi.spyOn(document.head, 'appendChild');
    appendSpy.mockImplementation((node) => {
      HTMLElement.prototype.appendChild.call(document.head, node);
      if (node.rel === 'stylesheet') {
        loadOrder.push('css');
        queueMicrotask(() => node.dispatchEvent(new Event('load')));
      }
      return node;
    });

    const importer = importerWithSource(
      '()=>import("./ContactRoute-Dv4Ieurc.js")',
      () => {
        loadOrder.push('js');
        return Promise.resolve({ default: () => null });
      },
    );

    await loadRouteModule(importer, 1, 'http://127.0.0.1:3000/assets/index.js');
    expect(loadOrder[0]).toBe('css');
    expect(loadOrder).toContain('js');
  });

  it('reloads when a reachable obsolete stylesheet still fails on retry', async () => {
    noteFailedPreloadCssUrlForTests('/assets/ContactRoute-old.css');
    const reload = vi.fn();
    const fetchImpl = vi.fn(async () => ({ ok: false, status: 404 }));

    const appendSpy = vi.spyOn(document.head, 'appendChild');
    appendSpy.mockImplementation((node) => {
      HTMLElement.prototype.appendChild.call(document.head, node);
      if (node.rel === 'stylesheet') {
        queueMicrotask(() => node.dispatchEvent(new Event('error')));
      }
      return node;
    });

    const importer = importerWithSource(
      '()=>import("./ContactRoute-old.js")',
      () => Promise.resolve({ default: () => null }),
    );

    await expect(
      loadRouteModule(
        importer,
        1,
        'http://127.0.0.1:3000/assets/index.js',
        (url) => import(/* @vite-ignore */ url),
        reload,
        fetchImpl,
      ),
    ).rejects.toThrow(/Stale route stylesheet/);

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('does not reload when stylesheet retry fails while offline', async () => {
    noteFailedPreloadCssUrlForTests('/assets/ContactRoute-x.css');
    const reload = vi.fn();
    const fetchImpl = vi.fn(async () => { throw new TypeError('Failed to fetch'); });

    const appendSpy = vi.spyOn(document.head, 'appendChild');
    appendSpy.mockImplementation((node) => {
      HTMLElement.prototype.appendChild.call(document.head, node);
      if (node.rel === 'stylesheet') {
        queueMicrotask(() => node.dispatchEvent(new Event('error')));
      }
      return node;
    });

    const mod = { default: () => null };
    const importer = importerWithSource(
      '()=>import("./ContactRoute-x.js")',
      () => Promise.resolve(mod),
    );

    await expect(
      loadRouteModule(
        importer,
        1,
        'http://127.0.0.1:3000/assets/index.js',
        (url) => import(/* @vite-ignore */ url),
        reload,
        fetchImpl,
      ),
    ).resolves.toBe(mod);

    expect(reload).not.toHaveBeenCalled();
  });

  it('loadStylesheet resolves when the link fires load', async () => {
    const pending = loadStylesheet(`${window.location.origin}/assets/ContactRoute-x.css?retry=1`);
    const link = document.querySelector('link[rel="stylesheet"]');
    expect(link).toBeTruthy();
    link.dispatchEvent(new Event('load'));
    await expect(pending).resolves.toBeUndefined();
  });
});
