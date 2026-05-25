import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/contact');
  await expect(page.getByLabel('Full Name *')).toBeVisible();
});

test('empty submit blocked by HTML5 validation', async ({ page }) => {
  await page.getByRole('button', { name: /Send My Project Details/i }).click();
  const invalid = await page.getByLabel('Full Name *').evaluate((el) => !el.validity.valid);
  expect(invalid).toBe(true);
});

test('partial success when email function fails', async ({ page }) => {
  await page.route('**/rest/v1/leads*', (route) =>
    route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify([{}]) })
  );
  await page.route('**/functions/v1/contact-form-email*', (route) =>
    route.fulfill({ status: 500, body: '{"error":"fail"}' })
  );
  await page.getByLabel('Full Name *').fill('QA Test');
  await page.getByLabel('Email Address *').fill('qa-test@example.com');
  await page.getByLabel('Project Description *').fill('Test');
  await page.getByRole('button', { name: /Send My Project Details/i }).click();
  await expect(page.getByText('Saved, Email Delayed').first()).toBeVisible({ timeout: 10000 });
  await expect(page.getByLabel('Full Name *')).toHaveValue('', { timeout: 10000 });
});

test('db failure shows error toast', async ({ page }) => {
  await page.route('**/rest/v1/leads*', (route) =>
    route.fulfill({ status: 500, body: '{"message":"error"}' })
  );
  await page.getByLabel('Full Name *').fill('QA Test');
  await page.getByLabel('Email Address *').fill('qa-test@example.com');
  await page.getByLabel('Project Description *').fill('Test');
  await page.getByRole('button', { name: /Send My Project Details/i }).click();
  await expect(page.getByText('Submission Failed').first()).toBeVisible();
  await expect(page.getByLabel('Full Name *')).toHaveValue('QA Test');
});

test('successful db and email submission clears the form', async ({ page }) => {
  await page.route('**/rest/v1/leads*', (route) =>
    route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify([{}]) })
  );
  await page.route('**/functions/v1/contact-form-email*', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) })
  );
  await page.getByLabel('Full Name *').fill(' QA Test ');
  await page.getByLabel('Email Address *').fill(' qa-test@example.com ');
  await page.getByLabel('Project Description *').fill(' Test project ');
  await page.getByRole('button', { name: /Send My Project Details/i }).click();
  await expect(page.getByText('Message Sent!').first()).toBeVisible({ timeout: 10000 });
  await expect(page.getByLabel('Full Name *')).toHaveValue('');
});

test('whitespace-only required fields are rejected before submission', async ({ page }) => {
  let dbRequestCount = 0;
  await page.route('**/rest/v1/leads*', (route) => {
    dbRequestCount += 1;
    route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify([{}]) });
  });
  await page.getByLabel('Full Name *').fill('   ');
  await page.getByLabel('Email Address *').fill('qa-test@example.com');
  await page.getByLabel('Project Description *').fill('   ');
  await page.getByRole('button', { name: /Send My Project Details/i }).click();
  await expect(page.getByText('Uh oh! Missing fields.').first()).toBeVisible();
  expect(dbRequestCount).toBe(0);
});
