import { expect, test } from '@playwright/test';

const liveSubmitEnabled = process.env.QA_LIVE_CONTACT_SUBMIT === '1';
const senderEmail = process.env.QA_LIVE_CONTACT_EMAIL;

test.describe('live contact submission', () => {
  test.skip(!liveSubmitEnabled, 'Set QA_LIVE_CONTACT_SUBMIT=1 to create a real Convex lead/email.');
  test.skip(!senderEmail, 'Set QA_LIVE_CONTACT_EMAIL to a controlled sender address before live submit.');

  test('submits one clearly marked QA lead through the live contact form', async ({ page }) => {
    const ts = new Date().toISOString();
    await page.goto('/contact');
    await page.getByLabel('Full Name *').fill(`QA Live Smoke ${ts}`);
    await page.getByLabel('Email Address *').fill(senderEmail);
    await page
      .getByLabel('Project Description *')
      .fill(`Automated live QA smoke at ${ts}. Please ignore. Marker: QA_LIVE_CONTACT_SUBMIT.`);

    await page.getByRole('button', { name: /Request a Project Estimate/i }).click();

    await expect(page.getByText('Request received')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByLabel('Full Name *')).toHaveValue('');
  });
});
