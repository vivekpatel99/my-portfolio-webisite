import { expect, test } from './qa-test.js';

const convexMutationRequests = [];
const telemetryRequestBodies = [];
const fakeSentryHost = 'telemetry.invalid';

const isTelemetryRequest = (request) => /sentry|\/api\/\d+\/(?:envelope|store)/i.test(request.url());

async function captureBrowserTelemetry(page, marker, { initialize = false, telemetrySourceSelector } = {}) {
  await page.evaluate(async ({ eventMarker, shouldInitialize, sourceSelector }) => {
    const telemetryUrl = performance.getEntriesByType('resource')
      .map((entry) => entry.name)
      .find((url) => url.includes('/src/lib/sentryTelemetry.js'));
    if (!telemetryUrl) throw new Error('The app did not load the Sentry telemetry module');
    const telemetry = await import(telemetryUrl);
    if (shouldInitialize) await telemetry.initializeSentryTelemetry();
    const telemetrySource = sourceSelector ? document.querySelector(sourceSelector) : undefined;
    if (sourceSelector && !telemetrySource) throw new Error('The marked telemetry source is missing');
    telemetry.captureException(new Error(eventMarker), telemetrySource ? { telemetrySource } : undefined);
  }, { eventMarker: marker, shouldInitialize: initialize, sourceSelector: telemetrySourceSelector });
}

test.beforeEach(async ({ page }) => {
  convexMutationRequests.length = 0;
  telemetryRequestBodies.length = 0;
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().includes('/api/mutation')) {
      convexMutationRequests.push(request.url());
    }
    if (isTelemetryRequest(request)) {
      telemetryRequestBodies.push(request.postData() ?? '');
    }
  });

  await page.goto('/contact');
  await expect(page.getByLabel('Full Name *')).toBeVisible();
});

test('renders contact form without submitting a lead', async ({ page }) => {
  await expect(page.getByLabel('Email Address *')).toBeVisible();
  await expect(page.getByLabel('Budget Range (Optional)')).toBeVisible();
  await expect(page.getByLabel('Project Description *')).toBeVisible();
  await expect(page.getByRole('button', { name: /Request a Project Estimate/i })).toBeVisible();
  expect(convexMutationRequests).toEqual([]);
});

test('marks the form as a sensitive telemetry region without submitting a lead', async ({ page }) => {
  await expect(page.locator('form[data-sensitive-telemetry]')).toHaveCount(1);
  await expect(page.locator('form[data-sensitive-telemetry]').getByLabel('Email Address *')).toBeVisible();
  expect(convexMutationRequests).toEqual([]);
});

test('keeps synthetic contact values out of telemetry during client-side validation', async ({ page }) => {
  const sentinelName = 'SENTRY_SENTINEL_NAME';
  const sentinelEmail = 'sentry-sentinel@example.invalid';
  const sentinelDescription = 'SENTRY_SENTINEL_FREE_TEXT';

  await page.getByLabel('Full Name *').fill(sentinelName);
  await page.getByLabel('Email Address *').fill(sentinelEmail);
  await page.getByLabel('Project Description *').fill(sentinelDescription);
  await page.getByLabel('Email Address *').fill('not-an-email-SENTRY_SENTINEL');
  await page.getByRole('button', { name: /Request a Project Estimate/i }).click();

  await expect(page.getByText('Invalid email address.').first()).toBeVisible();
  expect(convexMutationRequests).toEqual([]);
  for (const body of telemetryRequestBodies) {
    expect(body).not.toContain(sentinelName);
    expect(body).not.toContain(sentinelEmail);
    expect(body).not.toContain(sentinelDescription);
    expect(body).not.toContain('SENTRY_SENTINEL');
  }
});

test('fake Sentry transport delivers allowed errors, blocks marked errors, and stays silent after revocation', async ({ page }) => {
  test.skip(process.env.QA_FAKE_SENTRY !== '1', 'requires the local fake-Sentry QA server mode');

  const envelopeBodies = [];
  const allowedMarker = 'QA_ALLOWED_TELEMETRY_EVENT';
  const sensitiveMarker = 'QA_SENSITIVE_TELEMETRY_EVENT';
  const revokedMarker = 'QA_REVOKED_TELEMETRY_EVENT';
  const sentinelName = 'SENTRY_SENTINEL_NAME';
  const sentinelEmail = 'sentry-sentinel@example.invalid';
  const sentinelDescription = 'SENTRY_SENTINEL_FREE_TEXT';

  await page.route(`https://${fakeSentryHost}/**`, async (route) => {
    envelopeBodies.push(route.request().postData() ?? '');
    await route.fulfill({ status: 200, contentType: 'text/plain', body: '' });
  });
  await page.evaluate(() => {
    localStorage.setItem('cookie_consent_preferences', JSON.stringify({ necessary: true, analytics: true }));
  });
  await page.reload();
  await expect(page.getByLabel('Full Name *')).toBeVisible();

  await captureBrowserTelemetry(page, allowedMarker, { initialize: true });
  await expect.poll(() => envelopeBodies.join('\n')).toContain(allowedMarker);

  await page.getByLabel('Full Name *').fill(sentinelName);
  await page.getByLabel('Email Address *').fill(sentinelEmail);
  await page.getByLabel('Project Description *').fill(sentinelDescription);
  await captureBrowserTelemetry(page, sensitiveMarker, {
    telemetrySourceSelector: 'form[data-sensitive-telemetry]',
  });
  await page.waitForTimeout(500);

  expect(envelopeBodies.join('\n')).not.toContain(sensitiveMarker);
  expect(envelopeBodies.join('\n')).not.toContain(sentinelName);
  expect(envelopeBodies.join('\n')).not.toContain(sentinelEmail);
  expect(envelopeBodies.join('\n')).not.toContain(sentinelDescription);
  expect(convexMutationRequests).toEqual([]);

  await page.evaluate(() => {
    localStorage.setItem('cookie_consent_preferences', JSON.stringify({ necessary: true, analytics: false }));
    window.dispatchEvent(new StorageEvent('storage', { key: 'cookie_consent_preferences' }));
  });
  await page.waitForTimeout(200);
  const envelopeCountAfterRevocation = envelopeBodies.length;
  await captureBrowserTelemetry(page, revokedMarker);
  await page.waitForTimeout(500);

  expect(envelopeBodies).toHaveLength(envelopeCountAfterRevocation);
  expect(envelopeBodies.join('\n')).not.toContain(revokedMarker);
  expect(convexMutationRequests).toEqual([]);
});

test('empty submit shows custom missing-fields validation without Convex mutation', async ({ page }) => {
  await page.getByRole('button', { name: /Request a Project Estimate/i }).click();
  await expect(page.getByText('Uh oh! Missing fields.').first()).toBeVisible();
  expect(convexMutationRequests).toEqual([]);
});

test('whitespace-only required fields are rejected before Convex mutation', async ({ page }) => {
  await page.getByLabel('Full Name *').fill('   ');
  await page.getByLabel('Email Address *').fill('   ');
  await page.getByLabel('Project Description *').fill('   ');
  await page.getByRole('button', { name: /Request a Project Estimate/i }).click();
  await expect(page.getByText('Uh oh! Missing fields.').first()).toBeVisible();
  await expect(page.getByText('Request received')).toBeHidden();
  expect(convexMutationRequests).toEqual([]);
});

test('invalid email is rejected before Convex mutation', async ({ page }) => {
  await page.getByLabel('Full Name *').fill('QA Invalid Email');
  await page.getByLabel('Email Address *').fill('not-an-email');
  await page.getByLabel('Project Description *').fill('This should never reach Convex.');
  await page.getByRole('button', { name: /Request a Project Estimate/i }).click();
  await expect(page.getByText('Invalid email address.').first()).toBeVisible();
  expect(convexMutationRequests).toEqual([]);
});

test.skip('live contact submit creates a Convex lead/email; run qa-contact-live.spec.js with QA_LIVE_CONTACT_SUBMIT=1', async () => {
  // Intentionally skipped in the passive suite.
});
