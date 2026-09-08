import { createServer } from 'node:http';
import { test, expect } from './qa-test.js';

test('local-only mode stops an external redirect before a browser request', async ({ page }) => {
  test.skip(process.env.QA_LOCAL_ONLY !== '1', 'The navigation guard is an explicit local-only control.');
  const server = createServer((_request, response) => {
    response.writeHead(302, { location: 'https://external.invalid/qa-redirect-sentinel' });
    response.end();
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const externalRequests = [];
  page.on('request', (request) => {
    if (request.url().startsWith('https://external.invalid/')) externalRequests.push(request.url());
  });
  try {
    await expect(page.goto(`http://127.0.0.1:${server.address().port}/`)).rejects.toThrow();
    expect(externalRequests).toEqual([]);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('local-only mode blocks external subresources, fetches, and beacons in the browser', async ({ page }) => {
  test.skip(process.env.QA_LOCAL_ONLY !== '1', 'The navigation guard is an explicit local-only control.');
  const server = createServer((request, response) => {
    if (request.url === '/qa-local-redirect-image') {
      response.writeHead(302, { location: 'https://external.invalid/qa-redirected-image-sentinel' });
      response.end();
      return;
    }
    response.writeHead(200, { 'content-type': 'text/html' });
    response.end([
      '<img src="https://external.invalid/qa-image-sentinel" alt="">',
      '<img src="/qa-local-redirect-image" alt="">',
    ].join(''));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const redirectURL = `http://127.0.0.1:${server.address().port}/qa-local-redirect-image`;
  const externalRequests = [];
  const blockedRequests = [];
  page.on('request', (request) => {
    if (request.url().startsWith('https://external.invalid/')) externalRequests.push(request.url());
  });
  page.on('requestfailed', (request) => {
    if (request.url().startsWith('https://external.invalid/') || request.url() === redirectURL) {
      blockedRequests.push({
        url: request.url(),
        errorText: request.failure()?.errorText,
      });
    }
  });
  try {
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    await page.evaluate(() => {
      void fetch('https://external.invalid/qa-fetch-sentinel', { mode: 'no-cors' }).catch(() => {});
      navigator.sendBeacon('https://external.invalid/qa-beacon-sentinel', 'qa-sentinel');
    });
    await expect.poll(() => blockedRequests.map(({ url }) => url).sort()).toEqual([
      redirectURL,
      'https://external.invalid/qa-beacon-sentinel',
      'https://external.invalid/qa-fetch-sentinel',
      'https://external.invalid/qa-image-sentinel',
    ]);
    expect(externalRequests.sort()).toEqual([
      'https://external.invalid/qa-beacon-sentinel',
      'https://external.invalid/qa-fetch-sentinel',
      'https://external.invalid/qa-image-sentinel',
    ]);
    expect(externalRequests).not.toContain('https://external.invalid/qa-redirected-image-sentinel');
    for (const { errorText } of blockedRequests) {
      expect(errorText).toMatch(/ERR_BLOCKED_BY_CLIENT|blockedbyclient/i);
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('local-only mode closes non-allowlisted WebSockets before transport', async ({ page }) => {
  test.skip(process.env.QA_LOCAL_ONLY !== '1', 'The navigation guard is an explicit local-only control.');
  let upgradeRequests = 0;
  const server = createServer();
  server.on('upgrade', (_request, socket) => {
    upgradeRequests += 1;
    socket.destroy();
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Expected a TCP address for the WebSocket sentinel');
  try {
    const result = await page.evaluate(async (port) => new Promise((resolve) => {
      // localhost. resolves to loopback but is intentionally outside the strict hostname allowlist.
      const socket = new WebSocket(`ws://localhost.:${port}/qa-websocket-sentinel`);
      socket.addEventListener('close', (event) => resolve({ code: event.code, reason: event.reason }));
      socket.addEventListener('error', () => {});
    }), address.port);
    expect(result).toEqual({
      code: 1008,
      reason: 'QA_LOCAL_ONLY permits loopback WebSockets only',
    });
    expect(upgradeRequests).toBe(0);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('local-only mode settles an in-flight loopback subresource during fixture cleanup', async ({ page }) => {
  test.skip(process.env.QA_LOCAL_ONLY !== '1', 'The navigation guard is an explicit local-only control.');
  let releaseResponse;
  let requestStarted;
  let fallback;
  const started = new Promise((resolve) => { requestStarted = resolve; });
  const server = createServer(async (request, response) => {
    if (request.url === '/qa-slow-subresource') {
      requestStarted();
      await new Promise((resolve) => { releaseResponse = resolve; });
      response.writeHead(200, { 'content-type': 'image/svg+xml' });
      response.end('<svg xmlns="http://www.w3.org/2000/svg"/>', () => {
        clearTimeout(fallback);
        server.close();
        server.closeAllConnections();
      });
      return;
    }
    response.writeHead(200, { 'content-type': 'text/html' });
    response.end('<img src="/qa-slow-subresource" alt="">');
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  server.unref();
  fallback = setTimeout(() => releaseResponse?.(), 1_000);
  try {
    await page.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: 'commit' });
    await started;
    setTimeout(() => releaseResponse(), 50);
  } catch (error) {
    clearTimeout(fallback);
    releaseResponse?.();
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    throw error;
  }
});
