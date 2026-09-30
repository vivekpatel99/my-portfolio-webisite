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
  await page.getByLabel('Budget Range').selectOption(SELECTED_BUDGET);
  await page.getByLabel('Project Description *').fill('Synthetic transport lifecycle test.');
}

async function expectPreservedValues(page) {
  await expect(page.getByLabel('Full Name *')).toHaveValue('Synthetic QA Contact');
  await expect(page.getByLabel('Email Address *')).toHaveValue('qa-contact@example.invalid');
  await expect(page.getByLabel('Budget Range')).toHaveValue(SELECTED_BUDGET);
  await expect(page.getByLabel('Project Description *')).toHaveValue('Synthetic transport lifecycle test.');
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

test('holds one pending keyboard submit, blocks duplicates, shows safe failure guidance and focuses retry, then keeps a focused receipt', async ({ page, contactTransport: transport }) => {
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
  const receipt = form.getByRole('status', { name: 'Request received' });

  await page.getByLabel('Full Name *').press('Enter');
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
    budget: SELECTED_BUDGET,
    description: 'Synthetic transport lifecycle test.',
  });

  transport.releasePending('failure');
  const failureToast = failureToastLocator(page);
  await expect(failureToast).toBeVisible();
  await expect(failureToast).toContainText(SAFE_FAILURE_MESSAGE);
  await expectNoDiagnostics(page);
  await expectSettledToastFitsViewport(page, failureToast);
  await expect(submit).toBeEnabled();
  await expect(submit).toBeFocused();
  await expectPreservedValues(page);
  await expect(receipt).toHaveCount(0);
  await expect(failureToast).toBeVisible();

  await page.keyboard.press('Enter');
  await expect.poll(() => transport.state.mutations.length).toBe(2);
  expect(transport.state.mutations[1].args[0]).toMatchObject({ budget: SELECTED_BUDGET });

  await expect(receipt).toBeVisible();
  await expect(failureToast).toHaveCount(0, { timeout: 1_000 });
  await expect(receipt).toBeFocused();
  await expect(receipt).toContainText("Your details are saved. I'll get back to you within 24 hours.");
  const geometry = await receipt.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const formRect = element.closest('form').getBoundingClientRect();
    const style = getComputedStyle(element);
    return {
      fitsForm: rect.left >= formRect.left && rect.right <= formRect.right,
      inViewport: rect.top >= 0 && rect.bottom <= innerHeight,
      overflow: document.documentElement.scrollWidth > innerWidth,
      animation: style.animationName,
      transition: style.transitionDuration,
      transform: style.transform,
    };
  });
  expect(geometry).toEqual({
    fitsForm: true,
    inViewport: true,
    overflow: false,
    animation: 'none',
    transition: '0s',
    transform: 'none',
  });
  await expect(page.getByLabel('Full Name *')).toHaveValue('');
  await expect(page.getByLabel('Email Address *')).toHaveValue('');
  await expect(page.getByLabel('Budget Range')).toHaveValue('');
  await expect(page.getByLabel('Project Description *')).toHaveValue('');

  await page.waitForTimeout(10_500);
  await expect(receipt).toBeVisible();
  await expect(receipt).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(submit).toBeFocused();

  expect(transport.state.mutations).toHaveLength(2);
  expect(transport.state.connections).toBeGreaterThan(0);
  expect(mutationHttpRequests).toEqual([]);
});

test('invalid keyboard submission never reaches transport and focuses the first invalid field', async ({ page, contactTransport: transport }) => {
  await page.goto('/contact/');
  await expect(page.getByRole('heading', { name: /Request a Project Estimate/i })).toBeVisible();

  const name = page.getByLabel('Full Name *');
  await name.press('Enter');
  await expect(name).toBeFocused();
  await expect(name).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByRole('status', { name: 'Request received' })).toHaveCount(0);
  expect(transport.state.mutations).toHaveLength(0);
});

test('a valid send after invalid submission dismisses the stale validation toast and shows only the receipt', async ({ page, contactTransport: transport }) => {
  await page.goto('/contact/');
  await expect(page.getByRole('heading', { name: /Request a Project Estimate/i })).toBeVisible();

  const form = page.locator('form[data-sensitive-telemetry]');
  const receipt = form.getByRole('status', { name: 'Request received' });
  const validationToast = page.getByRole('status').filter({
    has: page.getByText('Uh oh! Missing fields.', { exact: true }),
  });

  await page.getByLabel('Full Name *').press('Enter');
  await expect(validationToast).toBeVisible();
  expect(transport.state.mutations).toHaveLength(0);

  await fillContactForm(page);
  await page.getByLabel('Full Name *').press('Enter');
  await expect.poll(() => transport.state.mutations.length).toBe(1);
  await expect(validationToast).toHaveCount(0, { timeout: 1_000 });

  transport.releasePending('success');
  await expect(receipt).toBeVisible();
  await expect(receipt).toBeFocused();
  await expect(validationToast).toHaveCount(0);
  expect(transport.state.mutations).toHaveLength(1);
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

    const form = page.locator('form[data-sensitive-telemetry]');
    const submit = form.locator('button[type="submit"]');
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
    await expect(submit).toBeFocused();
    await expectPreservedValues(page);
    await expect(form.getByRole('status', { name: 'Request received' })).toHaveCount(0);
    expect(transport.state.mutations).toHaveLength(1);
  });
}
