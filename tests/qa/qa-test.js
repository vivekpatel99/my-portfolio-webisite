import { test as base, expect } from '@playwright/test';
import { guardLocalNavigation, guardLocalWebSocket } from './qa-navigation-guard.js';

async function drainActiveRouteHandlers(activeHandlers, timeout = 250) {
  const deadline = Date.now() + timeout;
  while (activeHandlers.size > 0) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) return;
    await Promise.race([
      Promise.all([...activeHandlers]),
      new Promise((resolve) => setTimeout(resolve, remaining)),
    ]);
  }
}

export const test = base.extend({
  localWebSocketGuard: [async ({ context }, use) => {
    if (process.env.QA_LOCAL_ONLY !== '1') return use();
    // Playwright installs WebSocket interception into pages created after this call.
    await context.routeWebSocket('**/*', guardLocalWebSocket);
    await use();
  }, { auto: true }],
  localNavigationGuard: [async ({ context, page: _page }, use) => {
    if (process.env.QA_LOCAL_ONLY !== '1') return use();
    const activeHandlers = new Set();
    const handler = async (route) => {
      const task = guardLocalNavigation(route);
      activeHandlers.add(task);
      try {
        await task;
      } finally {
        activeHandlers.delete(task);
      }
    };
    await context.route('**/*', handler);
    await use();
    // Depend on page so this teardown runs before Playwright closes the page/context.
    // Give ordinary in-flight loopback responses a bounded chance to finish, but keep
    // the guard installed until context teardown so there is no unguarded egress window.
    await drainActiveRouteHandlers(activeHandlers);
  }, { auto: true }],
});

export { expect };
