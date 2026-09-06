import { expect, test } from '@playwright/test';

test('home has exactly one main landmark', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('main')).toHaveCount(1);
});

test('credential links keep their visible credential and date in the accessible name', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: /top rated plus on upwork.*checked 6 september 2026/i }).first()).toBeVisible();
});

test('project page uses a single main landmark', async ({ page }) => {
  await page.goto('/project/n8n-openai-data-extraction');
  await expect(page.locator('main')).toHaveCount(1);
});

test('case-study main content does not reintroduce unsupported rates, outcomes, SLAs, or related benchmarks', async ({ page }) => {
  const forbiddenClaims = [
    /€\s*80\b|\bEUR\s*80\b|\b80\s*\/?\s*(?:hour|hr)/i,
    /\b94%(?!\w)|\b94 percent\b/i,
    /\b37\s*(?:seconds?|s)\b/i,
    /\b2\.5\s*(?:seconds?|s)\b/i,
    /\b40\+?\s*hours?\b/i,
    /\b100%\s*(?:reviewable|job success)\b/i,
    /\b(?:21|11|9)\+\s*(?:AI\s+)?(?:projects?|years?)\b/i,
    /\b300\+\s*hours?\b/i,
    /\b24\s*hours?\b|\b30\s*days?\b/i,
    /\b1\s*-\s*2\s+new projects?\b/i,
    /\b(?:5-star|5★)(?!\w)/i,
    /\breal[-\s]?time\b/i,
    /\bMAGNA\b/i,
    /\b(?:guaranteed|guarantee)\s+(?:accuracy|savings)\b/i,
    /\b(?:SLA|response\s+time|support\s+within)\b/i,
  ];

  const withheldExamples = [
    '€80 / hour', '94% Faster', '37s baseline', '2.5s optimized runtime',
    '40+ hours saved weekly', '100% Job Success', '21+ AI projects', '300+ hours',
    '11+ projects', '9+ years', '24 hours', '30 days', '1-2 new projects',
    '5-star feedback', 'Real-Time tracking', 'MAGNA performance', 'SLA response time',
  ];
  withheldExamples.forEach((example) => {
    expect(forbiddenClaims.some((pattern) => pattern.test(example)), `guard must catch: ${example}`).toBe(true);
  });

  for (const path of [
    '/project/n8n-openai-data-extraction',
    '/project/invoice-ocr-extraction',
    '/project/yolo-computer-vision-optimization',
  ]) {
    await page.goto(path);
    await expect(page.locator('main h1')).toBeVisible();
    const content = await page.locator('main').innerText();
    for (const forbiddenClaim of forbiddenClaims) {
      expect(content, `${path} exposes ${forbiddenClaim}`).not.toMatch(forbiddenClaim);
    }
  }
});

test('contact social icon links have accessible names', async ({ page }) => {
  await page.goto('/contact');
  const links = page.locator('a[href*="linkedin"], a[href*="github"]').filter({
    has: page.locator('svg'),
  });
  const count = await links.count();
  for (let i = 0; i < count; i++) {
    const link = links.nth(i);
    const ariaLabel = await link.getAttribute('aria-label');
    const text = await link.textContent();
    if (!text?.trim()) {
      expect(ariaLabel, `Icon link ${i} should have aria-label`).toBeTruthy();
    }
  }
});

test('mobile menu closes on Escape', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Toggle navigation menu' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('mobile menu isolates background content while open', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Toggle navigation menu' }).click();
  await expect(page.getByRole('dialog', { name: 'Navigation menu' })).toBeVisible();
  await expect(page.locator('#main-content')).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
});

test('client feedback links directly to the marketplace profile without quote cards', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: /view feedback on upwork/i })).toBeVisible();
  await expect(page.locator('.testimonial-card-link')).toHaveCount(0);
});

test('reduced motion disables custom cursor', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('html')).not.toHaveClass(/custom-cursor-enabled/);
});

test('form inputs have associated labels', async ({ page }) => {
  await page.goto('/contact');
  for (const id of ['name', 'email', 'description']) {
    const label = page.locator(`label[for="${id}"]`);
    await expect(label).toBeVisible();
  }
});

test('services section exists for anchor target', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#services')).toBeAttached();
  await expect(page.locator('#about')).toBeAttached();
  await expect(page.locator('#portfolio')).toBeAttached();
  await expect(page.locator('#testimonials')).toBeAttached();
});

test('section anchors include scroll-margin-top for fixed header navigation', async ({ page }) => {
  await page.goto('/');
  for (const id of ['services', 'about', 'portfolio', 'testimonials']) {
    const margin = await page.locator(`#${id}`).evaluate((el) =>
      getComputedStyle(el).scrollMarginTop
    );
    expect(margin === '0px' || margin === '', `#${id} scroll-margin-top is ${margin}`).toBeFalsy();
  }
});
