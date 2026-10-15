import {
  assertLoopbackPreviewUrl,
  assertLoopbackWebSocketUrl,
  resolveLoopbackRedirectUrl,
} from './qa-local-only.js';

function routeErrorMessage(error) {
  if (!(error instanceof Error)) return '';
  // Playwright can append request diagnostics to the same cancellation message.
  return error.message.split(/\r?\nCall log:\r?\n/, 1)[0];
}

function isBrowserCancelledRoute(error) {
  const message = routeErrorMessage(error);
  return (
    message === 'route.fulfill: Route is already handled!'
    || message === 'route.fetch: Target page, context or browser has been closed'
    || message === 'apiResponse.dispose: Target page, context or browser has been closed'
  );
}

function isDisposedFulfill(error) {
  return routeErrorMessage(error) === 'route.fulfill: Fetch response has been disposed';
}

function isTargetGone(error) {
  const message = routeErrorMessage(error);
  const parts = message.split(': ');
  // Playwright prefixes the reason with one API name. A longer suffix is a different error.
  const reason = parts.length === 2 ? parts[1] : message;
  return reason === 'Target page, context or browser has been closed'
    || reason === 'Frame was detached';
}

function pageIsClosed(request) {
  try {
    return request.frame().page().isClosed();
  } catch (error) {
    if (isTargetGone(error)) return true;
    throw error;
  }
}

// Playwright can drop a fetched body when the context closes before this handler
// sees the page close event. One turn is enough for that queued event.
// ponytail: one macrotask, not a timed poll; a still-open page must still fail.
async function disposedDuringClosure(request) {
  if (pageIsClosed(request)) return true;
  await new Promise((resolve) => setTimeout(resolve, 0));
  return pageIsClosed(request);
}

export async function guardLocalNavigation(route) {
  const request = route.request();

  try {
    assertLoopbackPreviewUrl(request.url());
  } catch {
    return route.abort('blockedbyclient');
  }

  // Route handlers alone do not inspect every hop followed by route.fetch.
  const method = request.method();
  let response;
  try {
    response = await route.fetch({ maxRedirects: 0, maxRetries: method === 'GET' || method === 'HEAD' ? 1 : 0 });
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
    // A page can cancel an already-fetched loopback subresource as the context closes.
    // Only that exact disposal is non-actionable, and only once the page is actually gone.
    const closed = isDisposedFulfill(error) && await disposedDuringClosure(request);
    if (!isBrowserCancelledRoute(error) && !closed) throw error;
  } finally {
    try {
      await response.dispose();
    } catch (error) {
      if (!isBrowserCancelledRoute(error)) throw error;
    }
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
