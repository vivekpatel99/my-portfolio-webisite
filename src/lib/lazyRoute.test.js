/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  cacheBustImportUrl,
  extractImportSpecifier,
  getLazyRouteGeneration,
  resetLazyRouteGenerationForTests,
  resolveImportUrl,
  retryLazyRoutes,
} from './lazyRoute';

function importerWithSource(source) {
  const importer = () => Promise.resolve({ default: () => null });
  Object.defineProperty(importer, 'toString', {
    value: () => source,
  });
  return importer;
}

describe('lazyRoute helpers', () => {
  beforeEach(() => {
    resetLazyRouteGenerationForTests();
  });

  afterEach(() => {
    resetLazyRouteGenerationForTests();
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
});
