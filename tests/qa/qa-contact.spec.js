import { expect, test } from './qa-test.js';

const convexMutationRequests = [];
const telemetryRequestBodies = [];

const isTelemetryRequest = (request) => /sentry|\/api\/\d+\/(?:envelope|store)/i.test(request.url());

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
