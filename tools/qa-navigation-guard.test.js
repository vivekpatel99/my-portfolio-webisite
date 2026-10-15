import { describe, expect, it, vi } from 'vitest';
import {
  guardLocalNavigation,
  guardLocalWebSocket,
} from '../tests/qa/qa-navigation-guard.js';

function navigation({
  url = 'http://127.0.0.1:3000/',
  method = 'GET',
  location,
  navigation = true,
  fetchError,
  fulfillError,
  disposeError,
  pageClosed = false,
  isClosed,
  pageError,
} = {}) {
  const response = {
    status: () => location ? 302 : 200,
    headers: () => location ? { location } : {},
    dispose: disposeError ? vi.fn().mockRejectedValue(disposeError) : vi.fn(),
  };
  const route = {
    request: () => ({
      url: () => url,
      method: () => method,
      isNavigationRequest: () => navigation,
      frame: () => ({
        page: () => {
          if (pageError) throw pageError;
          return { isClosed: isClosed || (() => pageClosed) };
        },
      }),
    }),
    fetch: fetchError ? vi.fn().mockRejectedValue(fetchError) : vi.fn().mockResolvedValue(response),
    fulfill: fulfillError ? vi.fn().mockRejectedValue(fulfillError) : vi.fn(),
    abort: vi.fn(),
    continue: vi.fn(),
  };
  return { route, response };
}

describe('local-only browser navigation', () => {
  it('blocks external navigation before making a request', async () => {
    const { route } = navigation({ url: 'https://external.invalid/' });
    await guardLocalNavigation(route);
    expect(route.abort).toHaveBeenCalledWith('blockedbyclient');
    expect(route.fetch).not.toHaveBeenCalled();
  });

  it('blocks external redirects before the browser follows them', async () => {
    const { route, response } = navigation({ location: 'https://external.invalid/' });
    await guardLocalNavigation(route);
    expect(route.fetch).toHaveBeenCalledWith({ maxRedirects: 0, maxRetries: 1 });
    expect(route.abort).toHaveBeenCalledWith('blockedbyclient');
    expect(route.fulfill).not.toHaveBeenCalled();
    expect(response.dispose).toHaveBeenCalled();
  });

  it.each([undefined, '/contact/'])('serves local navigation and relative redirects (%s)', async (location) => {
    const { route, response } = navigation({ location });
    await guardLocalNavigation(route);
    expect(route.fetch).toHaveBeenCalledWith({ maxRedirects: 0, maxRetries: 1 });
    expect(route.fulfill).toHaveBeenCalledWith({ response });
    expect(route.abort).not.toHaveBeenCalled();
  });

  it('blocks external subresources before making a request', async () => {
    const { route } = navigation({ url: 'https://external.invalid/image.png', navigation: false });
    await guardLocalNavigation(route);
    expect(route.abort).toHaveBeenCalledWith('blockedbyclient');
    expect(route.fetch).not.toHaveBeenCalled();
    expect(route.continue).not.toHaveBeenCalled();
  });

  it('blocks external redirects from loopback subresources before the browser follows them', async () => {
    const { route, response } = navigation({
      url: 'http://127.0.0.1:3000/image.png',
      location: 'https://external.invalid/image.png',
      navigation: false,
    });
    await guardLocalNavigation(route);
    expect(route.fetch).toHaveBeenCalledWith({ maxRedirects: 0, maxRetries: 1 });
    expect(route.abort).toHaveBeenCalledWith('blockedbyclient');
    expect(response.dispose).toHaveBeenCalled();
  });

  it('allows a browser-cancelled loopback resource to finish cleanup during rapid navigation', async () => {
    const { route, response } = navigation({
      navigation: false,
      fulfillError: new Error('route.fulfill: Route is already handled!'),
    });
    await expect(guardLocalNavigation(route)).resolves.toBeUndefined();
    expect(response.dispose).toHaveBeenCalled();
  });

  it('allows a browser-cancelled loopback fetch during page closure', async () => {
    const { route, response } = navigation({
      navigation: false,
      fetchError: new Error('route.fetch: Target page, context or browser has been closed'),
    });
    await expect(guardLocalNavigation(route)).resolves.toBeUndefined();
    expect(response.dispose).not.toHaveBeenCalled();
  });

  it.each(['\n', '\r\n'])('allows an exact browser cancellation followed by a Playwright call log (%j)', async (newline) => {
    const { route } = navigation({
      fetchError: new Error(`route.fetch: Target page, context or browser has been closed${newline}Call log:${newline}  - GET http://127.0.0.1:3000/image.png`),
    });
    await expect(guardLocalNavigation(route)).resolves.toBeUndefined();
  });

  it('still rejects a different error that only starts with a cancellation message', async () => {
    const message = 'route.fetch: Target page, context or browser has been closed unexpectedly by a transport failure';
    const { route } = navigation({ fetchError: new Error(message) });
    await expect(guardLocalNavigation(route)).rejects.toThrow(message);
  });

  it('preserves unexpected fulfillment errors', async () => {
    const { route, response } = navigation({ fulfillError: new Error('network write failed') });
    await expect(guardLocalNavigation(route)).rejects.toThrow('network write failed');
    expect(response.dispose).toHaveBeenCalled();
  });

  it('allows response disposal after browser context closure', async () => {
    const { route } = navigation({ disposeError: new Error('apiResponse.dispose: Target page, context or browser has been closed') });
    await expect(guardLocalNavigation(route)).resolves.toBeUndefined();
  });

  it('preserves unexpected response disposal errors', async () => {
    const { route } = navigation({ disposeError: new Error('response cleanup failed') });
    await expect(guardLocalNavigation(route)).rejects.toThrow('response cleanup failed');
  });

  it('allows fulfillment cancellation when context closure disposed its response', async () => {
    const { route } = navigation({ pageClosed: true, fulfillError: new Error('route.fulfill: Fetch response has been disposed') });
    await expect(guardLocalNavigation(route)).resolves.toBeUndefined();
  });

  it('allows a disposed fulfillment once context closure reaches the page', async () => {
    let closed = false;
    const { route, response } = navigation({
      isClosed: () => closed,
      fulfillError: new Error('route.fulfill: Fetch response has been disposed'),
    });
    setTimeout(() => { closed = true; }, 0);
    await expect(guardLocalNavigation(route)).resolves.toBeUndefined();
    expect(response.dispose).toHaveBeenCalled();
    expect(route.abort).not.toHaveBeenCalled();
  });

  it.each(['\n', '\r\n'])('allows a disposed fulfillment with a Playwright call log once the page closes (%j)', async (newline) => {
    let closed = false;
    const { route } = navigation({
      isClosed: () => closed,
      fulfillError: new Error(`route.fulfill: Fetch response has been disposed${newline}Call log:${newline}  - GET http://127.0.0.1:3000/image.png`),
    });
    setTimeout(() => { closed = true; }, 0);
    await expect(guardLocalNavigation(route)).resolves.toBeUndefined();
  });

  it.each(['Frame was detached', 'frame.page: Frame was detached'])(
    'allows a disposed fulfillment when the frame is already gone (%j)',
    async (pageMessage) => {
      const { route } = navigation({
        pageError: new Error(pageMessage),
        fulfillError: new Error('route.fulfill: Fetch response has been disposed'),
      });
      await expect(guardLocalNavigation(route)).resolves.toBeUndefined();
    },
  );

  it('does not treat a page probe that only ends with a closure message as closure', async () => {
    const message = 'sensor offline Target page, context or browser has been closed';
    const { route } = navigation({
      pageError: new Error(message),
      fulfillError: new Error('route.fulfill: Fetch response has been disposed'),
    });
    await expect(guardLocalNavigation(route)).rejects.toThrow(message);
  });

  it('rejects a disposed fulfillment message that is not exact, even if the page is closed', async () => {
    const { route } = navigation({
      pageClosed: true,
      fulfillError: new Error('route.fulfill: Fetch response has been disposed unexpectedly'),
    });
    await expect(guardLocalNavigation(route)).rejects.toThrow('route.fulfill: Fetch response has been disposed unexpectedly');
  });

  it('does not treat an unexpected page probe error as context closure', async () => {
    const { route } = navigation({
      pageError: new Error('sensor offline'),
      fulfillError: new Error('route.fulfill: Fetch response has been disposed'),
    });
    await expect(guardLocalNavigation(route)).rejects.toThrow('sensor offline');
  });

  it('rejects a non-error fulfillment failure', async () => {
    const { route } = navigation({
      pageClosed: true,
      fulfillError: 'route.fulfill: Fetch response has been disposed',
    });
    await expect(guardLocalNavigation(route)).rejects.toBe('route.fulfill: Fetch response has been disposed');
  });

  it('still reports cleanup failures after a closed-page disposal', async () => {
    const { route } = navigation({
      pageClosed: true,
      fulfillError: new Error('route.fulfill: Fetch response has been disposed'),
      disposeError: new Error('response cleanup failed'),
    });
    await expect(guardLocalNavigation(route)).rejects.toThrow('response cleanup failed');
  });

  it('blocks external navigation even when the page is already closed', async () => {
    const { route } = navigation({ url: 'https://external.invalid/', pageClosed: true });
    await guardLocalNavigation(route);
    expect(route.abort).toHaveBeenCalledWith('blockedbyclient');
    expect(route.fetch).not.toHaveBeenCalled();
  });

  it('rejects disposed fulfillment responses while the page is open', async () => {
    const { route } = navigation({ fulfillError: new Error('route.fulfill: Fetch response has been disposed') });
    await expect(guardLocalNavigation(route)).rejects.toThrow('route.fulfill: Fetch response has been disposed');
  });

  it('preserves unexpected fetch errors', async () => {
    const { route } = navigation({ fetchError: new Error('network read failed') });
    await expect(guardLocalNavigation(route)).rejects.toThrow('network read failed');
  });

  it.each([['HEAD', 1], ['POST', 0]])('limits connection-reset retries for %s to %s', async (method, maxRetries) => {
    const { route } = navigation({ method });
    await guardLocalNavigation(route);
    expect(route.fetch).toHaveBeenCalledWith({ maxRedirects: 0, maxRetries });
  });
});

function webSocket(url) {
  const route = {
    url: () => url,
    close: vi.fn(),
    connectToServer: vi.fn(),
  };
  return { route };
}

describe('local-only browser WebSockets', () => {
  it('blocks external WebSockets before connecting', async () => {
    const { route } = webSocket('wss://external.invalid/qa-websocket-sentinel');
    await guardLocalWebSocket(route);
    expect(route.close).toHaveBeenCalledWith({
      code: 1008,
      reason: 'QA_LOCAL_ONLY permits loopback WebSockets only',
    });
    expect(route.connectToServer).not.toHaveBeenCalled();
  });

  it('preserves loopback WebSockets', async () => {
    const { route } = webSocket('ws://127.0.0.1:3000/qa-websocket-sentinel');
    await guardLocalWebSocket(route);
    expect(route.connectToServer).toHaveBeenCalled();
    expect(route.close).not.toHaveBeenCalled();
  });
});
