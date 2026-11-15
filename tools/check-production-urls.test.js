import { expect, it } from 'vitest';
import { findUnsafeProductionUrls } from './check-production-urls.js';

it.each(['http://localhost', 'http://localhost:3000', 'https://127.0.0.1', 'ws://0.0.0.0:80', 'http://[::1]:3000', 'https://example.convex.cloud', 'https://yourserver.io', 'https:\\/\\/placeholder.convex.cloud'])('rejects backend URL %s', (url) => {
  expect(findUnsafeProductionUrls(`fetch("${url}")`)).not.toHaveLength(0);
});

it('allows only the router URL parsing bases while still detecting adjacent backend URLs', () => {
  const router = 'let r="http://localhost";e&&(r="null"!==e.location.origin?e.location.origin:e.location.href);var ve=new URL("http://localhost");function xe(e){if(e.createURL)return e.createURL("/");try{return new URL(e.createHref("/"),ve)}catch{}}';
  expect(findUnsafeProductionUrls(router)).toEqual([]);
  expect(findUnsafeProductionUrls(`${router};fetch("http://localhost")`)).toEqual(['http://localhost']);
});

it('rejects a changed fallback pattern until reviewed', () => {
  expect(findUnsafeProductionUrls('let base="http://localhost";fetch(base)')).toEqual(['http://localhost']);
});
