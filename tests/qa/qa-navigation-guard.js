import { assertLoopbackPreviewUrl, resolveLoopbackRedirectUrl } from './qa-local-only.js';

export async function guardLocalNavigation(route) {
  const request = route.request();
  if (!request.isNavigationRequest()) return route.continue();

  try {
    assertLoopbackPreviewUrl(request.url());
  } catch {
    return route.abort('blockedbyclient');
  }

  // Route handlers alone do not inspect every hop followed by route.fetch.
  const response = await route.fetch({ maxRedirects: 0 });
  const location = response.headers().location;
  if (response.status() >= 300 && response.status() < 400 && location) {
    try {
      resolveLoopbackRedirectUrl(request.url(), location);
    } catch {
      await response.dispose();
      return route.abort('blockedbyclient');
    }
  }
  await route.fulfill({ response });
  await response.dispose();
}
