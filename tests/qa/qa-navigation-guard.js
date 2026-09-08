import {
  assertLoopbackPreviewUrl,
  assertLoopbackWebSocketUrl,
  resolveLoopbackRedirectUrl,
} from './qa-local-only.js';

function isBrowserCancelledRoute(error) {
  return error instanceof Error && (
    error.message === 'route.fulfill: Route is already handled!'
    || error.message === 'route.fetch: Target page, context or browser has been closed'
  );
}

export async function guardLocalNavigation(route) {
  const request = route.request();

  try {
    assertLoopbackPreviewUrl(request.url());
  } catch {
    return route.abort('blockedbyclient');
  }

  // Route handlers alone do not inspect every hop followed by route.fetch.
  let response;
  try {
    response = await route.fetch({ maxRedirects: 0 });
  } catch (error) {
    // Chromium can cancel an intercepted subresource as a page closes.
    // There is no response to clean up, and this exact cancellation is non-actionable.
    if (isBrowserCancelledRoute(error)) return;
    throw error;
  }
  const location = response.headers().location;
  if (response.status() >= 300 && response.status() < 400 && location) {
    try {
      resolveLoopbackRedirectUrl(request.url(), location);
    } catch {
      await response.dispose();
      return route.abort('blockedbyclient');
    }
  }
  try {
    await route.fulfill({ response });
  } catch (error) {
    // A page can cancel an already-fetched loopback subresource during client navigation.
    // The route was handled by Chromium's cancellation, so only this exact race is non-actionable.
    if (!isBrowserCancelledRoute(error)) throw error;
  } finally {
    await response.dispose();
  }
}

export async function guardLocalWebSocket(webSocketRoute) {
  try {
    assertLoopbackWebSocketUrl(webSocketRoute.url());
  } catch {
    return webSocketRoute.close({
      code: 1008,
      reason: 'QA_LOCAL_ONLY permits loopback WebSockets only',
    });
  }

  return webSocketRoute.connectToServer();
}
