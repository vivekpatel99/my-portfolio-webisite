import { describe, expect, it, vi } from 'vitest';
import { guardLocalNavigation } from '../tests/qa/qa-navigation-guard.js';

function navigation({ url = 'http://127.0.0.1:3000/', location, navigation = true } = {}) {
  const response = {
    status: () => location ? 302 : 200,
    headers: () => location ? { location } : {},
    dispose: vi.fn(),
  };
  const route = {
    request: () => ({ url: () => url, isNavigationRequest: () => navigation }),
    fetch: vi.fn().mockResolvedValue(response),
    fulfill: vi.fn(),
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

  it('preserves intentional external subresources', async () => {
    const { route } = navigation({ url: 'https://external.invalid/image.png', navigation: false });
    await guardLocalNavigation(route);
    expect(route.continue).toHaveBeenCalled();
    expect(route.fetch).not.toHaveBeenCalled();
    expect(route.abort).not.toHaveBeenCalled();
  });
});
