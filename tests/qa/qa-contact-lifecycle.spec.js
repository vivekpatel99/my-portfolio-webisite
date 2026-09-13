import { expect, test as base } from '@playwright/test';
import {
  guardLocalNavigation,
} from './qa-navigation-guard.js';
import { assertLoopbackWebSocketUrl } from './qa-local-only.js';

const CONVEX_MOCK_HOST = 'qa-contact-lifecycle.convex.cloud';
const SYNTHETIC_FAILURE = 'Synthetic transport failure.';

function encodedTimestamp(value) {
  // Convex encodes its unsigned little-endian timestamps as base64 strings.
  const bytes = Buffer.alloc(8);
  bytes.writeBigUInt64LE(BigInt(value));
  return bytes.toString('base64');
}

function createConvexTransportMock() {
  const state = {
    connections: 0,
    mutations: [],
    pending: new Map(),
    nextTimestamp: 0,
  };

  function sendOutcome(webSocket, message, outcome) {
    if (outcome === 'failure') {
      webSocket.send(JSON.stringify({
        type: 'MutationResponse',
        requestId: message.requestId,
        success: false,
        result: SYNTHETIC_FAILURE,
        logLines: [],
      }));
      return;
    }

    const startTimestamp = encodedTimestamp(state.nextTimestamp);
    state.nextTimestamp += 1;
    const timestamp = encodedTimestamp(state.nextTimestamp);
    webSocket.send(JSON.stringify({
      type: 'MutationResponse',
      requestId: message.requestId,
      success: true,
      result: { success: true },
      ts: timestamp,
      logLines: [],
    }));
    // A successful Convex mutation is resolved after the client observes a
    // transition at or beyond the mutation response timestamp.
    webSocket.send(JSON.stringify({
      type: 'Transition',
      startVersion: { querySet: 0, ts: startTimestamp, identity: 0 },
      endVersion: { querySet: 0, ts: timestamp, identity: 0 },
      modifications: [],
    }));
  }

  return {
    state,
    connect(webSocket) {
      state.connections += 1;
      webSocket.onMessage((rawMessage) => {
        const message = JSON.parse(String(rawMessage));
        if (message.type !== 'Mutation') return;

        state.mutations.push(message);
        // The first request is held to make the pending and duplicate-submit
        // states observable. Later requests complete successfully unless the
        // test explicitly releases the held request as a failure.
        if (state.mutations.length === 1) {
          state.pending.set(message.requestId, { webSocket, message });
          return;
        }
        sendOutcome(webSocket, message, 'success');
      });
    },
    releasePending(outcome) {
      const pending = [...state.pending.values()][0];
      if (!pending) throw new Error('No pending synthetic mutation to release');
      state.pending.delete(pending.message.requestId);
      sendOutcome(pending.webSocket, pending.message, outcome);
    },
  };
}

async function installLocalGuardsAndTransport(context, transport) {
  await context.route('**/*', guardLocalNavigation);
  await context.routeWebSocket('**/*', (webSocket) => {
    const url = new URL(webSocket.url());
    if (url.protocol === 'wss:' && url.hostname === CONVEX_MOCK_HOST) {
      transport.connect(webSocket);
      return;
    }

    let reason;
    try {
      assertLoopbackWebSocketUrl(webSocket.url());
      reason = 'Contact lifecycle QA blocks the local Vite HMR WebSocket';
    } catch {
      reason = 'Contact lifecycle QA blocks non-loopback WebSockets';
    }
    webSocket.close({
      code: 1008,
      reason,
    });
  });
}

const test = base.extend({
  contactTransport: [async ({ context }, use) => {
    const transport = createConvexTransportMock();
    await installLocalGuardsAndTransport(context, transport);
    await use(transport);
  }, { auto: true }],
});

async function fillContactForm(page) {
  await page.getByLabel('Full Name *').fill('Synthetic QA Contact');
  await page.getByLabel('Email Address *').fill('qa-contact@example.invalid');
  await page.getByLabel('Project Description *').fill('Synthetic transport lifecycle test.');
}

test('holds one pending submit, blocks duplicates, exposes failure, then retries successfully', async ({ page, contactTransport: transport }) => {
  const mutationHttpRequests = [];
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().includes('/api/mutation')) {
      mutationHttpRequests.push(request.url());
    }
  });

  await page.goto('/contact/');
  await expect(page.getByRole('heading', { name: /Request a Project Estimate/i })).toBeVisible();
  await fillContactForm(page);

  const form = page.locator('form[data-sensitive-telemetry]');
  const submit = form.locator('button[type="submit"]');
  await submit.click();
  await expect(submit).toBeDisabled();
  await expect(submit).toContainText('Sending');

  // requestSubmit exercises the duplicate guard even though the browser has
  // already disabled the visible button for the pending request.
  await form.evaluate((element) => element.requestSubmit());
  await expect.poll(() => transport.state.mutations.length).toBe(1);
  expect(mutationHttpRequests).toEqual([]);
  expect(transport.state.mutations[0].args[0]).toMatchObject({
    name: 'Synthetic QA Contact',
    email: 'qa-contact@example.invalid',
    description: 'Synthetic transport lifecycle test.',
  });

  transport.releasePending('failure');
  // Radix also copies the description to an off-screen live announcer.
  // The visible toast contains a distinct title element; the announcer does not.
  const failureToast = page.getByRole('status').filter({
    has: page.getByText('Submission Failed', { exact: true }),
  });
  await expect(failureToast).toBeVisible();
  await expect(failureToast).toContainText(SYNTHETIC_FAILURE);
  await expect(submit).toBeEnabled();
  await expect(page.getByLabel('Full Name *')).toHaveValue('Synthetic QA Contact');
  await expect(page.getByLabel('Email Address *')).toHaveValue('qa-contact@example.invalid');
  await expect(page.getByLabel('Project Description *')).toHaveValue('Synthetic transport lifecycle test.');

  await submit.click();
  await expect.poll(() => transport.state.mutations.length).toBe(2);
  await expect(page.getByText('Request received', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Full Name *')).toHaveValue('');
  await expect(page.getByLabel('Email Address *')).toHaveValue('');
  await expect(page.getByLabel('Project Description *')).toHaveValue('');
  expect(transport.state.connections).toBeGreaterThan(0);
  expect(mutationHttpRequests).toEqual([]);
});
