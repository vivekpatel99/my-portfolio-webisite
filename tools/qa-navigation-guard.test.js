import { describe, expect, it, vi } from 'vitest';
import {
  guardLocalNavigation,
  guardLocalWebSocket,
} from '../tests/qa/qa-navigation-guard.js';

function navigation({
  url = 'http://127.0.0.1:3000/',
  location,
  navigation = true,
  fetchError,
  fulfillError,
} = {}) {
  const response = {
    status: () => location ? 302 : 200,
    headers: () => location ? { location } : {},
    dispose: vi.fn(),
  };
  const route = {
    request: () => ({ url: () => url, isNavigationRequest: () => navigation }),
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
    expect(route.fetch).toHaveBeenCalledWith({ maxRedirects: 0 });
    expect(route.abort).toHaveBeenCalledWith('blockedbyclient');
    expect(route.fulfill).not.toHaveBeenCalled();
    expect(response.dispose).toHaveBeenCalled();
  });

  it.each([undefined, '/contact/'])('serves local navigation and relative redirects (%s)', async (location) => {
    const { route, response } = navigation({ location });
    await guardLocalNavigation(route);
    expect(route.fetch).toHaveBeenCalledWith({ maxRedirects: 0 });
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
    expect(route.fetch).toHaveBeenCalledWith({ maxRedirects: 0 });
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

  it('preserves unexpected fulfillment errors', async () => {
    const { route, response } = navigation({ fulfillError: new Error('network write failed') });
    await expect(guardLocalNavigation(route)).rejects.toThrow('network write failed');
    expect(response.dispose).toHaveBeenCalled();
  });

  it('preserves unexpected fetch errors', async () => {
    const { route } = navigation({ fetchError: new Error('network read failed') });
    await expect(guardLocalNavigation(route)).rejects.toThrow('network read failed');
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
