import { expect, test } from '@playwright/test';

const convexMutationRequests = [];

test.beforeEach(async ({ page }) => {
  convexMutationRequests.length = 0;
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().includes('/api/mutation')) {
      convexMutationRequests.push(request.url());
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
