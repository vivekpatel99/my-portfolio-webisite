import { expect, test as base } from '@playwright/test';
import {
  guardLocalNavigation,
} from './qa-navigation-guard.js';
import { assertLoopbackWebSocketUrl } from './qa-local-only.js';
import { assertVisualLayout } from './visual-layout.js';

const CONVEX_MOCK_HOST = 'qa-contact-lifecycle.convex.cloud';
const SYNTHETIC_FAILURE = '[Request ID: synthetic-audit] Server Error\n    at syntheticStack (fixture.js:1:1)';
const SAFE_FAILURE_MESSAGE = "We couldn't send your request. Please try again, or use the email address on this page.";
const DIAGNOSTIC_FRAGMENTS = ['Request ID', 'synthetic-audit', 'CONVEX', 'Server Error', 'syntheticStack', 'fixture.js', 'Called by client'];
const CONTACT_LEAD_VALIDATION_ERROR = "We couldn't submit your request. Please check the form and try again.";
const GLOBAL_RATE_LIMIT_ERROR = 'The site is receiving too many requests. Please wait a few minutes and try again.';
const EMAIL_RATE_LIMIT_ERROR = 'This email already sent several messages recently. Please wait before submitting again.';
const SUBMIT_FAILURE_MESSAGES = [
  SAFE_FAILURE_MESSAGE,
  CONTACT_LEAD_VALIDATION_ERROR,
  GLOBAL_RATE_LIMIT_ERROR,
  EMAIL_RATE_LIMIT_ERROR,
];
const SELECTED_BUDGET = '€5k-€10k';

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

  function sendOutcome(webSocket, message, outcome, errorData) {
    if (outcome === 'failure') {
      webSocket.send(JSON.stringify({
        type: 'MutationResponse',
        requestId: message.requestId,
        success: false,
        result: SYNTHETIC_FAILURE,
        ...(errorData === undefined ? {} : { errorData }),
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
    releasePending(outcome, errorData) {
      const pending = [...state.pending.values()][0];
      if (!pending) throw new Error('No pending synthetic mutation to release');
      state.pending.delete(pending.message.requestId);
      sendOutcome(pending.webSocket, pending.message, outcome, errorData);
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

function failureToastLocator(page) {
  // Radix also copies the description to an off-screen live announcer.
  // The visible toast contains a distinct title element; the announcer does not.
  return page.getByRole('status').filter({
    has: page.getByText('Submission Failed', { exact: true }),
  });
}

async function expectNoDiagnostics(page) {
  for (const fragment of DIAGNOSTIC_FRAGMENTS) {
    await expect(page.locator('body')).not.toContainText(fragment);
  }
}

async function expectSettledToastFitsViewport(page, toast) {
  await toast.evaluate((element) => Promise.all(
    element.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => undefined)),
  ));
  const viewport = page.viewportSize();
  assertVisualLayout({
    label: 'Submission failure toast',
    box: await toast.boundingBox(),
    viewport: { x: 0, y: 0, width: viewport.width, height: viewport.height },
  });
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
}

test('holds one pending submit, blocks duplicates, shows safe failure guidance, then retries successfully', async ({ page, contactTransport: transport }) => {
  const mutationHttpRequests = [];
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().includes('/api/mutation')) {
      mutationHttpRequests.push(request.url());
    }
  });

  await page.goto('/contact/');
  await expect(page.getByRole('heading', { name: /Request a Project Estimate/i })).toBeVisible();
  await fillContactForm(page);
  const budget = page.getByLabel('Budget Range');
  await budget.selectOption(SELECTED_BUDGET);

  const form = page.locator('form[data-sensitive-telemetry]');
  const submit = form.locator('button[type="submit"]');
  await submit.click();
  await expect(submit).toBeDisabled();
  await expect(submit).toContainText(/sending/i);

  // requestSubmit exercises the duplicate guard even though the browser has
  // already disabled the visible button for the pending request.
  await form.evaluate((element) => element.requestSubmit());
  await expect.poll(() => transport.state.mutations.length).toBe(1);
  expect(mutationHttpRequests).toEqual([]);
  expect(transport.state.mutations[0].args[0]).toMatchObject({
    name: 'Synthetic QA Contact',
    email: 'qa-contact@example.invalid',
    description: 'Synthetic transport lifecycle test.',
    budget: SELECTED_BUDGET,
  });

  transport.releasePending('failure');
  const failureToast = failureToastLocator(page);
  await expect(failureToast).toBeVisible();
  await expect(failureToast).toContainText(SAFE_FAILURE_MESSAGE);
  await expectNoDiagnostics(page);
  await expectSettledToastFitsViewport(page, failureToast);
  await expect(submit).toBeEnabled();
  await expect(page.getByLabel('Full Name *')).toHaveValue('Synthetic QA Contact');
  await expect(page.getByLabel('Email Address *')).toHaveValue('qa-contact@example.invalid');
  await expect(page.getByLabel('Project Description *')).toHaveValue('Synthetic transport lifecycle test.');
  await expect(budget).toHaveValue(SELECTED_BUDGET);

  await page.getByLabel('Full Name *').press('Enter');
  await expect.poll(() => transport.state.mutations.length).toBe(2);
  expect(transport.state.mutations[1].args[0]).toMatchObject({ budget: SELECTED_BUDGET });
  await expect(page.getByText('Request received', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Full Name *')).toHaveValue('');
  await expect(page.getByLabel('Email Address *')).toHaveValue('');
  await expect(page.getByLabel('Project Description *')).toHaveValue('');
  await expect(budget).toHaveValue('');
  expect(transport.state.connections).toBeGreaterThan(0);
  expect(mutationHttpRequests).toEqual([]);
});

const structuredFailures = [
  {
    title: 'unknown structured errorData.message with request ID and stack',
    errorData: {
      message: SYNTHETIC_FAILURE,
      requestId: 'synthetic-audit',
      stack: 'at syntheticStack (fixture.js:1:1)',
    },
    expectedMessage: SAFE_FAILURE_MESSAGE,
  },
  {
    title: 'lead validation',
    errorData: CONTACT_LEAD_VALIDATION_ERROR,
    expectedMessage: CONTACT_LEAD_VALIDATION_ERROR,
  },
  {
    title: 'global rate limit',
    errorData: GLOBAL_RATE_LIMIT_ERROR,
    expectedMessage: GLOBAL_RATE_LIMIT_ERROR,
  },
  {
    title: 'per-email rate limit',
    errorData: EMAIL_RATE_LIMIT_ERROR,
    expectedMessage: EMAIL_RATE_LIMIT_ERROR,
  },
];

for (const { title, errorData, expectedMessage } of structuredFailures) {
  test(`decodes ${title} ConvexError data into a safe visible toast`, async ({ page, contactTransport: transport }) => {
    await page.goto('/contact/');
    await expect(page.getByRole('heading', { name: /Request a Project Estimate/i })).toBeVisible();
    await fillContactForm(page);

    const submit = page.locator('form[data-sensitive-telemetry] button[type="submit"]');
    await submit.click();
    await expect(submit).toBeDisabled();
    await expect.poll(() => transport.state.mutations.length).toBe(1);

    transport.releasePending('failure', errorData);
    const failureToast = failureToastLocator(page);
    await expect(failureToast).toBeVisible();
    await expect(failureToast.getByText(expectedMessage, { exact: true })).toBeVisible();
    for (const otherMessage of SUBMIT_FAILURE_MESSAGES.filter((message) => message !== expectedMessage)) {
      await expect(failureToast).not.toContainText(otherMessage);
    }
    await expectNoDiagnostics(page);
    await expectSettledToastFitsViewport(page, failureToast);
    await expect(submit).toBeEnabled();
    await expect(page.getByLabel('Full Name *')).toHaveValue('Synthetic QA Contact');
    await expect(page.getByLabel('Email Address *')).toHaveValue('qa-contact@example.invalid');
    await expect(page.getByLabel('Project Description *')).toHaveValue('Synthetic transport lifecycle test.');
    expect(transport.state.mutations).toHaveLength(1);
  });
}
