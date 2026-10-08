import { expect, test as base } from '@playwright/test';
import {
  guardLocalNavigation,
} from './qa-navigation-guard.js';
import { assertLoopbackWebSocketUrl } from './qa-local-only.js';
import { assertVisualLayout } from './visual-layout.js';
import { createConvexTransportMock, SYNTHETIC_FAILURE } from './qa-convex-transport-mock.js';

const CONVEX_MOCK_HOST = 'qa-contact-lifecycle.convex.cloud';
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
const closingContexts = new WeakSet();

async function installLocalGuardsAndTransport(context, transport) {
  await context.route('**/*', async (route) => {
    try {
      await guardLocalNavigation(route);
    } catch (error) {
      if (closingContexts.has(context) && error instanceof Error
        && error.message === 'route.fulfill: Fetch response has been disposed') return;
      throw error;
    }
  });
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

test.afterEach(async ({ context }) => {
  closingContexts.add(context);
  await context.close();
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

async function navigateToServicesByKeyboard(page) {
  let navigation = page.locator('header');
  if (page.viewportSize().width < 768) {
    const toggle = page.getByRole('button', { name: 'Toggle navigation menu' });
    await toggle.focus();
    await expect(toggle).toBeFocused();
    await toggle.press('Enter');
    navigation = page.getByRole('dialog', { name: 'Navigation menu', exact: true });
    await expect(navigation.getByRole('button', { name: 'Close navigation menu' })).toBeFocused();
  }
  const services = navigation.getByRole('link', { name: 'Services', exact: true });
  await services.focus();
  await expect(services).toBeFocused();
  await services.press('Enter');
  await expect(page).toHaveURL(/\/#services$/);
  await expect(page.locator('#services')).toBeFocused();
}

async function returnToContactByBack(page) {
  await page.goBack();
  // ScrollToTop focuses main on the next frame. Wait for that focus handoff
  // before the test focuses a form field or opens the mobile menu again.
  const receipt = page.getByRole('status', { name: 'Request received' });
  const error = page.locator('#contact-submit-error');
  await expect(page.getByLabel('Full Name *')).toBeVisible();
  if (await page.locator('[aria-labelledby="contact-receipt-title"][data-contact-outcome-focus]').count()) await expect(receipt).toBeFocused();
  else if (await error.count() && await page.locator('form button[data-contact-outcome-focus]').count()) await expect(page.locator('form button[type="submit"]')).toBeFocused();
  else await expect(page.locator('#main-content')).toBeFocused();
  await expect(page.getByLabel('Full Name *')).toBeVisible();
}

async function unloadIsPrevented(page) {
  return page.evaluate(() => {
    const event = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(event);
    return event.defaultPrevented;
  });
}

async function readBrowserStorage(page) {
  return page.evaluate(() => ({
    local: Object.entries(localStorage),
    session: Object.entries(sessionStorage),
  }));
}

async function expectEmptyContactForm(page) {
  for (const label of ['Full Name *', 'Email Address *', 'Budget Range', 'Project Description *']) {
    await expect(page.getByLabel(label)).toHaveValue('');
  }
}

const LENGTH_BOUNDARIES = [
  { field: 'name', label: 'Full Name *', value: 'n'.repeat(200), limit: 200, message: 'Full name' },
  { field: 'email', label: 'Email Address *', value: `${'a'.repeat(249)}@b.cd`, limit: 254, message: 'Email address' },
  { field: 'description', label: 'Project Description *', value: 'd'.repeat(5000), limit: 5000, message: 'Project description' },
];

for (const { field, label, value, limit, message } of LENGTH_BOUNDARIES) {
  test(`#325: rejects oversized ${field} locally, then sends its normalized boundary`, async ({ page, contactTransport: transport }) => {
    await page.goto('/contact/');
    await fillContactForm(page);
    const control = page.getByLabel(label);
    const draft = `  ${value}x  `;
    await control.fill(draft);
    const retainedValue = await control.inputValue();
    const form = page.locator('form[data-sensitive-telemetry]');
    await form.evaluate((element) => element.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    await expect(page.locator(`#${field}-error`)).toHaveText(`${message} must be ${limit} characters or fewer.`);
    await expect(control).toBeFocused();
    await expect(control).toHaveAttribute('aria-invalid', 'true');
    await expect(control).toHaveAttribute('aria-describedby', `${field}-error`);
    await expect(control).toHaveValue(retainedValue);
    expect(transport.state.mutations).toHaveLength(0);
    await expectNoDiagnostics(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

    await control.fill(`  ${value}  `);
    await expect(control).toHaveAttribute('aria-invalid', 'false');
    await expect(page.locator(`#${field}-error`)).toHaveCount(0);
    await form.evaluate((element) => element.requestSubmit());
    await expect.poll(() => transport.state.mutations.length).toBe(1);
    expect(transport.state.mutations[0].args[0][field]).toBe(value);
    transport.releasePending('success');
    await expectEmptyContactForm(page);
  });
}

test('#325: focuses the first invalid field and retains every overlong draft', async ({ page, contactTransport: transport }) => {
  await page.goto('/contact/');
  for (const { label, value } of LENGTH_BOUNDARIES) await page.getByLabel(label).fill(`${value}x`);
  await page.locator('form[data-sensitive-telemetry]').evaluate((element) => element.requestSubmit());
  await expect(page.getByLabel('Full Name *')).toBeFocused();
  for (const { field, label, value } of LENGTH_BOUNDARIES) {
    await expect(page.getByLabel(label)).toHaveValue(`${value}x`);
    await expect(page.getByLabel(label)).toHaveAttribute('aria-describedby', `${field}-error`);
  }
  expect(transport.state.mutations).toHaveLength(0);
});

for (const { scenario, name, email, title, description } of [
  { scenario: 'missing name and malformed email', name: '', email: 'bad@', title: 'Uh oh! Missing fields.', description: 'Name is required.' },
  { scenario: 'overlong name and missing email', name: 'n'.repeat(201), email: '', title: 'Check your project details.', description: 'Full name must be 200 characters or fewer.' },
]) {
  test(`#325: keeps toast and focus consistent for ${scenario}`, async ({ page, contactTransport: transport }) => {
    await page.goto('/contact/');
    await fillContactForm(page);
    await page.getByLabel('Full Name *').fill(name);
    await page.getByLabel('Email Address *').fill(email);
    await page.getByRole('button', { name: 'Send project request', exact: true }).click();
    const toast = page.getByRole('status').filter({ has: page.getByText(title, { exact: true }) });
    await expect(toast).toBeVisible();
    await expect(toast.getByText(description, { exact: true })).toBeVisible();
    await expect(page.getByLabel('Full Name *')).toBeFocused();
    await expect(page.getByLabel('Full Name *')).toHaveAttribute('aria-describedby', 'name-error');
    await expect(page.getByLabel('Full Name *')).toHaveValue(name);
    await expect(page.getByLabel('Email Address *')).toHaveValue(email);
    expect(transport.state.mutations).toHaveLength(0);
  });
}

test('preserves a dirty draft through featured and collection article navigation', async ({ page, contactTransport: transport }) => {
  await page.goto('/contact/');
  await fillContactForm(page);
  let unloadWarnings = 0;
  let documentRequests = 0;
  page.on('dialog', async (dialog) => {
    if (dialog.type() === 'beforeunload') unloadWarnings += 1;
    await dialog.accept();
  });
  page.on('request', (request) => {
    if (request.isNavigationRequest() && request.frame() === page.mainFrame()) documentRequests += 1;
  });

  await page.getByRole('link', { name: 'Vivek Patel home', exact: true }).click();
  await page.locator('#portfolio').getByRole('link', { name: /Read case study:/ }).first().click();
  await page.getByRole('link', { name: 'Discuss a similar project', exact: true }).click();
  await expectPreservedValues(page);

  await page.getByRole('link', { name: 'Vivek Patel home', exact: true }).click();
  await page.getByRole('link', { name: /View all case studies/ }).click();
  await page.getByRole('button', { name: 'Load more', exact: true }).click();
  const cards = page.locator('[id^="case-study-grid-"]').getByRole('link', { name: /Read case study:/ });
  await expect(cards).toHaveCount(12);
  const card = cards.last();
  await card.evaluate((element) => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
  const departureY = await page.evaluate(() => window.scrollY);
  await card.click();
  await page.getByRole('link', { name: /View case studies/ }).click();
  await expect(page).toHaveURL(/\/case-studies\/$/);
  await expect(cards).toHaveCount(12);
  await expect.poll(async () => Math.abs((await page.evaluate(() => window.scrollY)) - departureY)).toBeLessThanOrEqual(100);

  await cards.last().evaluate((element) => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
  const backDepartureY = await page.evaluate(() => window.scrollY);
  await cards.last().click();
  await page.goBack();
  await expect(cards).toHaveCount(12);
  await expect.poll(async () => Math.abs((await page.evaluate(() => window.scrollY)) - backDepartureY)).toBeLessThanOrEqual(100);
  await cards.first().click();
  await page.getByRole('navigation', { name: 'Case study navigation' }).getByRole('link', { name: 'Back to home', exact: true }).click();
  await expect(page).toHaveURL(new URL('/', page.url()).href);
  await expect(page.locator('#portfolio')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await page.getByRole('link', { name: /View all case studies/ }).click();
  await expect(page.locator('main').getByRole('link', { name: 'Back to home', exact: true })).toHaveCount(0);
  await page.getByRole('link', { name: 'Vivek Patel home', exact: true }).click();
  await page.getByRole('link', { name: 'Request a Project Estimate', exact: true }).first().click();
  await expectPreservedValues(page);
  expect(unloadWarnings).toBe(0);
  expect(documentRequests).toBe(0);
  expect(await unloadIsPrevented(page)).toBe(true);
  const serialized = await page.evaluate(() => JSON.stringify({ local: Object.entries(localStorage), session: Object.entries(sessionStorage), state: window.history.state }));
  for (const value of ['Synthetic QA Contact', 'qa-contact@example.invalid', SELECTED_BUDGET, 'Synthetic transport lifecycle test.']) {
    expect(serialized).not.toContain(value);
  }
  expect(transport.state.mutations).toHaveLength(0);
});

test('case study navigation leaves modified clicks unprevented', async ({ page }) => {
  for (const route of ['/project/ai-invoice-processing-automation/', '/case-studies/']) {
    await page.goto(route, { waitUntil: 'networkidle' });
    const links = route.startsWith('/project/')
      ? page.locator('.case-study-navigation a, .case-study-cta a')
      : page.getByRole('link', { name: 'Vivek Patel home', exact: true });
    await expect(links).toHaveCount(route.startsWith('/project/') ? 3 : 1);
    for (const link of await links.all()) {
      for (const options of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }]) {
        const prevented = await link.evaluate((element, clickOptions) => {
          const event = new MouseEvent('click', { bubbles: true, cancelable: true, ...clickOptions });
          let routerPrevented;
          document.addEventListener('click', (observed) => {
            routerPrevented = observed.defaultPrevented;
            observed.preventDefault();
          }, { once: true });
          element.dispatchEvent(event);
          return routerPrevented;
        }, options);
        expect(prevented).toBe(false);
      }
    }
  }
});

for (const activation of ['modified', 'middle']) {
  test(`case study navigation keeps native ${activation} tab-opening behavior`, async ({ page, context, browserName }) => {
    test.skip(browserName === 'webkit' && activation === 'middle', 'macOS headless WebKit navigates a plain anchor in the source tab on middle-click. Native middle-click needs Safari verification; unprevented click events are checked separately.');
    for (const route of ['/project/ai-invoice-processing-automation/', '/case-studies/']) {
      await page.goto(route);
      const links = route.startsWith('/project/')
        ? page.locator('.case-study-navigation a, .case-study-cta a')
        : page.getByRole('link', { name: 'Vivek Patel home', exact: true });
      await expect(links).toHaveCount(route.startsWith('/project/') ? 3 : 1);
      for (const link of await links.all()) {
        const href = await link.getAttribute('href');
        const options = activation === 'middle' ? { button: 'middle' } : { modifiers: ['ControlOrMeta'] };
        const opened = context.waitForEvent('page');
        await link.click(options);
        const popup = await opened;
        await expect(popup).toHaveURL(new URL(href, page.url()).href);
        await expect(page).toHaveURL(new RegExp(`${route}$`));
        await popup.close();
      }
    }
  });
}

test('restores all tab-memory draft fields after keyboard navigation and Back without storage writes', async ({ page, context, contactTransport: transport }) => {
  await page.goto('/contact/');
  await expect(page.getByLabel('Full Name *')).toBeVisible();
  const initialStorage = await readBrowserStorage(page);
  expect(await unloadIsPrevented(page)).toBe(false);
  await fillContactForm(page);
  await page.getByLabel('Project Description *').fill('Synthetic first line\nSynthetic second line');
  expect(await unloadIsPrevented(page)).toBe(true);
  await navigateToServicesByKeyboard(page);
  expect(await unloadIsPrevented(page)).toBe(true);
  await returnToContactByBack(page);

  await expect(page.getByLabel('Full Name *')).toHaveValue('Synthetic QA Contact');
  await expect(page.getByLabel('Email Address *')).toHaveValue('qa-contact@example.invalid');
  await expect(page.getByLabel('Budget Range')).toHaveValue(SELECTED_BUDGET);
  await expect(page.getByLabel('Project Description *')).toHaveValue('Synthetic first line\nSynthetic second line');
  expect(await readBrowserStorage(page)).toEqual(initialStorage);
  await page.getByLabel('Project Description *').focus();
  await expect(page.getByLabel('Project Description *')).toBeFocused();
  const focusedFrame = await page.getByLabel('Project Description *').evaluate((field) => {
    const frame = field.closest('.contact-detection-frame');
    const style = getComputedStyle(frame);
    return {
      focused: frame.matches(':focus-within'),
      cornerColor: style.getPropertyValue('--corner-color').trim(),
      cornerWidth: style.getPropertyValue('--corner-width').trim(),
      backgroundImage: style.backgroundImage,
    };
  });
  expect(focusedFrame.focused).toBe(true);
  expect(focusedFrame.cornerColor).toBe('#a78bfa');
  expect(focusedFrame.cornerWidth).toBe('2px');
  expect(focusedFrame.backgroundImage).toContain('rgb(167, 139, 250)');
  const viewport = page.viewportSize();
  assertVisualLayout({
    label: 'Restored contact form',
    box: await page.locator('form[data-sensitive-telemetry]').boundingBox(),
    viewport: { x: 0, y: 0, width: viewport.width, height: viewport.height },
    withinViewport: { horizontal: true, vertical: false },
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  const freshTab = await context.newPage();
  await freshTab.bringToFront();
  await freshTab.goto('/contact/');
  await expect(freshTab.getByRole('heading', { name: /Request a Project Estimate/i })).toBeVisible();
  await expectEmptyContactForm(freshTab);
  expect(await unloadIsPrevented(freshTab)).toBe(false);
  // Let the context fixture close this tab after the route-draining afterEach;
  // closing it here can cancel intercepted assets still being fulfilled.
  await page.bringToFront();

  for (const label of ['Full Name *', 'Email Address *', 'Project Description *']) {
    await page.getByLabel(label).fill('');
  }
  await page.getByLabel('Budget Range').selectOption('');
  expect(await unloadIsPrevented(page)).toBe(false);
  await navigateToServicesByKeyboard(page);
  await returnToContactByBack(page);
  await expectEmptyContactForm(page);
  expect(await readBrowserStorage(page)).toEqual(initialStorage);
  expect(transport.state.mutations).toHaveLength(0);
});

test('reload warns before discarding a dirty tab-memory draft and starts empty when confirmed', async ({ page, browserName, contactTransport: transport }) => {
  await page.goto('/contact/');
  await fillContactForm(page);
  const initialStorage = await readBrowserStorage(page);
  const dismissedDialog = page.waitForEvent('dialog', { timeout: 5_000 }).catch(() => null);
  const dismissHandler = (dialog) => dialog.dismiss();
  page.once('dialog', dismissHandler);
  await page.evaluate(() => {
    window.__qaContactReloadMarker = true;
    // Dismissing beforeunload cancels navigation, so awaiting page.reload's
    // load event would hang. Trigger a real reload after evaluation returns.
    setTimeout(() => window.location.reload(), 0);
  });
  const dialog = await dismissedDialog;
  if (!dialog) {
    page.off('dialog', dismissHandler);
    // Record the observed engine limit only when reload actually discarded the
    // draft without presenting a dialog; do not infer it from the engine name.
    await expectEmptyContactForm(page);
    expect(await page.evaluate(() => window.__qaContactReloadMarker)).toBeUndefined();
    expect(await unloadIsPrevented(page)).toBe(false);
    expect(await readBrowserStorage(page)).toEqual(initialStorage);
    expect(transport.state.mutations).toHaveLength(0);
    test.skip(browserName === 'webkit', 'Observed headless WebKit reload discard the draft without firing a beforeunload dialog; handler/memory checks pass.');
    expect(dialog, 'Chromium should offer reload confirmation after form interaction').not.toBeNull();
  }
  expect(dialog.type()).toBe('beforeunload');
  await expectPreservedValues(page);
  expect(await page.evaluate(() => window.__qaContactReloadMarker)).toBe(true);

  const acceptedDialog = page.waitForEvent('dialog');
  page.once('dialog', (dialog) => dialog.accept());
  await page.evaluate(() => {
    setTimeout(() => window.location.reload(), 0);
  });
  expect((await acceptedDialog).type()).toBe('beforeunload');
  await expectEmptyContactForm(page);
  expect(await page.evaluate(() => window.__qaContactReloadMarker)).toBeUndefined();
  expect(await unloadIsPrevented(page)).toBe(false);
  expect(await readBrowserStorage(page)).toEqual(initialStorage);
  expect(transport.state.mutations).toHaveLength(0);
});

for (const outcome of ['success', 'failure']) {
  test(`a pending send remains single across route remount and ${outcome} updates the retained draft`, async ({ page, contactTransport: transport }) => {
    await page.goto('/contact/');
    await fillContactForm(page);
    const initialStorage = await readBrowserStorage(page);
    await page.getByLabel('Full Name *').press('Enter');
    await expect.poll(() => transport.state.mutations.length).toBe(1);
    await navigateToServicesByKeyboard(page);
    expect(await unloadIsPrevented(page)).toBe(true);
    await returnToContactByBack(page);
    const form = page.locator('form[data-sensitive-telemetry]');
    await expect(form.locator('button[type="submit"]')).toBeDisabled();
    await expectPreservedValues(page);
    await form.evaluate((element) => element.requestSubmit());
    expect(transport.state.mutations).toHaveLength(1);

    await page.evaluate(() => {
      const form = document.querySelector('form[data-sensitive-telemetry]');
      window.__qaReceipt = { insertions: 0, focuses: 0 };
      new MutationObserver((changes) => {
        for (const change of changes) {
          for (const node of change.addedNodes) {
            if (node.nodeType === 1 && node.matches('[aria-labelledby="contact-receipt-title"]')) {
              window.__qaReceipt.insertions += 1;
            }
          }
        }
      }).observe(form, { childList: true, subtree: true });
      form.addEventListener('focusin', (event) => {
        if (event.target.matches('[aria-labelledby="contact-receipt-title"]')) window.__qaReceipt.focuses += 1;
      });
    });
    transport.releasePending(outcome);
    await expect(form.locator('button[type="submit"]')).toBeEnabled();
    if (outcome === 'success') {
      const receipt = form.getByRole('status', { name: 'Request received' });
      await expect(receipt).toHaveCount(1);
      await expect(receipt).toBeFocused();
      await expect(receipt).toHaveAttribute('aria-live', 'polite');
      expect(await page.evaluate(() => window.__qaReceipt)).toEqual({ insertions: 1, focuses: 1 });
      await expectEmptyContactForm(page);
      expect(await unloadIsPrevented(page)).toBe(false);
    } else {
      await expectPreservedValues(page);
      await expect(form.locator('button[type="submit"]')).toBeFocused();
      await expect(failureToastLocator(page)).toContainText(SAFE_FAILURE_MESSAGE);
      expect(await unloadIsPrevented(page)).toBe(true);
    }
    await navigateToServicesByKeyboard(page);
    await returnToContactByBack(page);
    if (outcome === 'success') await expectEmptyContactForm(page);
    else await expectPreservedValues(page);
    expect(await readBrowserStorage(page)).toEqual(initialStorage);
    expect(transport.state.mutations).toHaveLength(1);
  });
}

for (const outcome of ['success', 'failure']) {
  test(`a ${outcome} completed away from Contact is available on return and clears on a new draft`, async ({ page, contactTransport: transport }) => {
    await page.goto('/contact/');
    await fillContactForm(page);
    const initialStorage = await readBrowserStorage(page);
    await page.getByLabel('Full Name *').press('Enter');
    await expect.poll(() => transport.state.mutations.length).toBe(1);
    await navigateToServicesByKeyboard(page);
    transport.releasePending(outcome);
    if (outcome === 'failure') await expect(failureToastLocator(page)).toBeVisible();
    else await expect.poll(() => unloadIsPrevented(page)).toBe(false);
    await page.goBack();
    const form = page.locator('form[data-sensitive-telemetry]');
    const receipt = form.getByRole('status', { name: 'Request received' });
    const retry = form.locator('button[type="submit"]');
    if (outcome === 'success') {
      await expect(receipt).toHaveCount(1);
      await expect(receipt).toBeFocused();
      await expect(receipt).toHaveAttribute('aria-live', 'polite');
      await expectEmptyContactForm(page);
    } else {
      await expectPreservedValues(page);
      await expect(retry).toBeFocused();
      await expect(form.locator('#contact-submit-error')).toContainText(SAFE_FAILURE_MESSAGE);
    }
    await page.getByLabel('Full Name *').fill('Synthetic new draft');
    await expect(receipt).toHaveCount(0);
    await expect(form.locator('#contact-submit-error')).toHaveCount(0);
    if (outcome === 'failure') await expect(failureToastLocator(page)).toHaveCount(0, { timeout: 1000 });
    await navigateToServicesByKeyboard(page);
    await returnToContactByBack(page);
    await expect(page.getByLabel('Full Name *')).toHaveValue('Synthetic new draft');
    await expect(receipt).toHaveCount(0);
    expect(transport.state.mutations).toHaveLength(1);
    expect(await readBrowserStorage(page)).toEqual(initialStorage);
  });
}

for (const timing of ['before return', 'after return']) {
  test(`a failure ${timing} dismisses its toast on a successful remounted retry`, async ({ page, contactTransport: transport }) => {
    await page.goto('/contact/');
    await fillContactForm(page);
    await page.getByLabel('Full Name *').press('Enter');
    await expect.poll(() => transport.state.mutations.length).toBe(1);
    await navigateToServicesByKeyboard(page);
    if (timing === 'before return') {
      transport.releasePending('failure');
      await expect(failureToastLocator(page)).toBeVisible();
    }
    await returnToContactByBack(page);
    if (timing === 'after return') transport.releasePending('failure');
    await expect(failureToastLocator(page)).toBeVisible();
    await expectPreservedValues(page);
    const retry = page.locator('form button[type="submit"]');
    await expect(retry).toBeFocused();
    await retry.press('Enter');
    await expect.poll(() => transport.state.mutations.length).toBe(2);
    await expect(page.getByRole('status', { name: 'Request received' })).toBeFocused();
    await expect(failureToastLocator(page)).toHaveCount(0, { timeout: 1_000 });
  });
}

test('later Contact visits retain a completed receipt without repeating outcome focus or announcement', async ({ page, contactTransport: transport }) => {
  await page.goto('/contact/');
  await fillContactForm(page);
  await page.getByLabel('Full Name *').press('Enter');
  await expect.poll(() => transport.state.mutations.length).toBe(1);
  transport.releasePending('success');
  const receipt = page.getByRole('status', { name: 'Request received' });
  await expect(receipt).toBeFocused();
  await expect(receipt).toHaveAttribute('aria-live', 'polite');
  await navigateToServicesByKeyboard(page);
  await page.goBack();
  await expect(page.locator('#main-content')).toBeFocused();
  await expect(receipt).toHaveAttribute('aria-live', 'off');
  await navigateToServicesByKeyboard(page);
  let navigation = page.locator('header');
  if (page.viewportSize().width < 768) {
    await page.getByRole('button', { name: 'Toggle navigation menu' }).click();
    navigation = page.getByRole('dialog', { name: 'Navigation menu', exact: true });
  }
  await navigation.getByRole('link', { name: page.viewportSize().width < 768 ? 'Request a Project Estimate' : 'Request Estimate', exact: true }).click();
  await expect(page.locator('#main-content')).toBeFocused();
  await expect(receipt).toHaveAttribute('aria-live', 'off');
  expect(transport.state.mutations).toHaveLength(1);
});

function failureToastLocator(page) {
  // Radix also copies the description to an off-screen live announcer.
  // The visible toast contains a distinct title element; the announcer does not.
  return page.getByRole('region', { name: 'Notifications (F8)' }).getByRole('status').filter({
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
  // Install before app/Toast timers; let motion settle normally before the lifetime check.
  await page.clock.install();
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

  const idleSize = await submit.boundingBox();
  await page.getByLabel('Full Name *').press('Enter');
  await expect(submit).toBeDisabled();
  await expect(submit).toContainText(/sending/i);
  await expect(submit).toHaveAccessibleName('Sending…');
  const sendingSize = await submit.boundingBox();
  expect(sendingSize.width).toBeCloseTo(idleSize.width, 1);
  expect(sendingSize.height).toBeCloseTo(idleSize.height, 1);
  if (test.info().project.use.reducedMotion === 'reduce') {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(submit.locator('svg')).toHaveCSS('animation-name', 'none');
  }

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
      inViewport: rect.top >= 0 && rect.bottom <= window.innerHeight,
      overflow: document.documentElement.scrollWidth > window.innerWidth,
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

  await page.clock.runFor(10_500);
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
