import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const caseStudies = [
  ['n8n-openai-data-extraction', 'n8n + OpenAI Data Extraction'],
  ['invoice-ocr-extraction', 'Invoice OCR Client-Field Extraction'],
  ['yolo-computer-vision-optimization', 'YOLO Pose Estimation on Still Images'],
];
const fitOutcomes = [
  ['Document or web data extraction', 'Strong Fit', 'document-web-extraction'],
  ['Computer vision, including a slow or unreliable pipeline', 'Possible Fit', 'computer-vision'],
  ['Something outside these published areas', 'Not Recommended', null],
];
const reviewedAnswers = [
  'Yes, usable source material or access is available',
  'Yes, the needed information and where it should go are clear',
  'A practical assessment and workflow that can be tested and reviewed',
  'A person will review exceptions and business decisions',
];

async function blockWrites(page) {
  const nonReadRequests = [];
  await page.routeWebSocket('**/*', (socket) => socket.close());
  await page.route('**/*', async (route) => {
    const request = route.request();
    if (!['GET', 'HEAD'].includes(request.method())) {
      nonReadRequests.push({ method: request.method(), url: request.url() });
      await route.abort();
      return;
    }
    await route.continue();
  });
  return nonReadRequests;
}

async function completeDiagnostic(page, projectType) {
  await page.goto('/');
  const reject = page.getByRole('button', { name: 'Reject All', exact: true });
  if (await reject.isVisible()) await reject.click();
  const diagnostic = page.locator('#project-fit-diagnostic');
  await diagnostic.getByRole('button', { name: 'Start diagnostic' }).click();
  for (const answer of [projectType, ...reviewedAnswers]) {
    await diagnostic.getByLabel(answer, { exact: true }).check();
    await diagnostic.getByRole('button', { name: /Next|See result/ }).click();
  }
  return diagnostic;
}

for (const [width, motion] of [[320, 'reduce'], [390, 'no-preference'], [1280, 'reduce']]) {
  test(`direct estimate context stays bounded at ${width}px with ${motion} motion`, async ({ page }) => {
    const nonReadRequests = await blockWrites(page);
    await page.setViewportSize({ width, height: width === 320 ? 568 : 844 });
    await page.emulateMedia({ reducedMotion: motion });
    await page.goto('/contact');
    if (process.env.GATE4_SCREENSHOTS === '1') {
      const rejectCookies = page.getByRole('button', { name: 'Reject All', exact: true });
      await rejectCookies.waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {});
      if (await rejectCookies.isVisible()) {
        await rejectCookies.click();
        await expect(rejectCookies).toBeHidden();
      }
    }
    const baseline = await page.evaluate(() => ({
      localStorage: Object.fromEntries(Object.entries(localStorage)),
      sessionStorage: Object.fromEntries(Object.entries(sessionStorage)),
      url: location.href,
    }));
    await page.getByLabel('Project type').selectOption('workflow-automation');
    await page.getByLabel('Timeline').selectOption('within-one-month');
    await page.getByLabel('Current blocker').selectOption('workflow-reliability');
    await page.getByLabel('Full Name *').fill('RAW_DIAGNOSTIC_MARKER Name');
    await page.getByLabel('Project Description *').fill('RAW_DIAGNOSTIC_MARKER must remain only in this unsent field.');
    const preview = page.locator('#estimate-context-preview');
    await expect(preview).toContainText('Workflow automation');
    await expect(preview).toContainText('Within one month');
    if (motion === 'reduce') {
      const motionStates = await page.locator('main [style]').evaluateAll((elements) => elements.map((element) => ({
        opacity: getComputedStyle(element).opacity,
        transform: getComputedStyle(element).transform,
      })));
      expect(motionStates.length).toBeGreaterThanOrEqual(5);
      expect(motionStates.every(({ opacity, transform }) => opacity === '1' && transform === 'none')).toBe(true);
    }
    expect(await page.evaluate(() => ({ localStorage: Object.fromEntries(Object.entries(localStorage)), sessionStorage: Object.fromEntries(Object.entries(sessionStorage)), url: location.href }))).toEqual(baseline);
    expect(await page.evaluate(() => `${location.href} ${JSON.stringify(history.state)} ${JSON.stringify(localStorage)} ${JSON.stringify(sessionStorage)}`)).not.toContain('RAW_DIAGNOSTIC_MARKER');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const audit = await new AxeBuilder({ page }).include('#contact-inquiry').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(audit.violations).toEqual([]);
    if (process.env.GATE4_SCREENSHOTS === '1') {
      const directory = path.join(process.cwd(), 'docs', 'reviews', 'gate-4-screenshots');
      mkdirSync(directory, { recursive: true });
      const header = page.locator('header');
      await expect(header).toBeVisible();
      await header.evaluate((element) => { element.style.visibility = 'hidden'; });
      await page.locator('#contact-inquiry').screenshot({ path: path.join(directory, `context-${width}.png`) });
      await header.evaluate((element) => { element.style.visibility = ''; });
    }
    await page.getByRole('button', { name: 'Remove estimate context' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByText('Estimate context (optional)')).toBeFocused();
    expect(nonReadRequests).toEqual([]);
  });
}

test('invalid direct entry focuses the first error without a write', async ({ page }) => {
  const nonReadRequests = await blockWrites(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/contact');
  await page.getByLabel('Full Name *').focus();
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Email Address *')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Budget Range (Optional)')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Project type')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Timeline')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Current blocker')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Project Description *')).toBeFocused();
  await page.getByRole('button', { name: /Request a Project Estimate/i }).click();
  await expect(page.getByLabel('Full Name *')).toBeFocused();
  expect(nonReadRequests).toEqual([]);
});

test('every service CTA carries only its allowlisted service context', async ({ page }) => {
  const nonReadRequests = await blockWrites(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const expected = ['Document and web-data extraction', 'Workflow automation', 'Computer vision with supplied still images'];
  for (let index = 0; index < expected.length; index += 1) {
    await page.goto('/#services');
    if (index > 0) await page.getByRole('button', { name: /DOCUMENT & WEB DATA EXTRACTION|WORKFLOW AUTOMATION|COMPUTER VISION SUPPORT/ }).nth(index).click();
    await page.locator(`#service-content-${index}`).getByRole('link', { name: 'Ask about this service' }).click();
    await expect(page.getByText(`Published service area: ${expected[index]}`)).toBeVisible();
    await expect.poll(() => page.evaluate(() => JSON.stringify(history.state))).not.toContain('serviceId');
  }
  expect(nonReadRequests).toEqual([]);
});

test('all published case-study CTAs preserve bounded provenance across an edit and do not revive after refresh', async ({ page }) => {
  const nonReadRequests = await blockWrites(page);
  for (const [slug, title] of caseStudies) {
    await page.goto(`/project/${slug}`);
    await page.getByRole('link', { name: /Request a Project Estimate/i }).click();
    await expect(page.getByText(`Case study viewed: ${title}`)).toBeVisible();
    await page.getByLabel('Timeline').selectOption('exploring');
    await expect(page.getByText(`Case study viewed: ${title}`)).toBeVisible();
  }
  await page.reload();
  await expect(page.locator('#contact-inquiry')).toBeVisible();
  await expect(page.locator('#estimate-context-preview')).toBeHidden();
  expect(nonReadRequests).toEqual([]);
});

test('all diagnostic outcomes carry a bounded projection and retain the safer poor-fit alternative', async ({ page }) => {
  const nonReadRequests = await blockWrites(page);
  for (const [projectType, decision, expectedProjectType] of fitOutcomes) {
    const diagnostic = await completeDiagnostic(page, projectType);
    await expect(diagnostic.getByRole('heading', { name: decision })).toBeVisible();
    if (decision === 'Not Recommended') await expect(diagnostic.getByText(/A safer alternative/)).toBeVisible();
    await diagnostic.getByRole('link', { name: 'Ask about next steps' }).click();
    await expect(page.getByText(`Scope-check result: ${decision} (scope check)`)).toBeVisible();
    if (expectedProjectType) await expect(page.locator('#estimate-context-preview')).toContainText('Project type:');
    if (!expectedProjectType) await expect(page.locator('#estimate-context-preview').getByText(/Project type:/)).toHaveCount(0);
    await page.getByLabel('Timeline').selectOption('exploring');
    await expect(page.getByText(`Scope-check result: ${decision} (scope check)`)).toBeVisible();
  }
  expect(nonReadRequests).toEqual([]);
});

test('back and forward do not restore consumed context or raw route-state markers', async ({ page }) => {
  const nonReadRequests = await blockWrites(page);
  await page.goto('/project/invoice-ocr-extraction');
  await page.getByRole('link', { name: /Request a Project Estimate/i }).click();
  await expect(page.locator('#estimate-context-preview')).toBeVisible();
  await page.goBack();
  await page.goForward();
  await expect(page.locator('#contact-inquiry')).toBeVisible();
  await expect(page.locator('#estimate-context-preview')).toBeHidden();
  expect(await page.evaluate(() => `${location.href} ${JSON.stringify(history.state)}`)).not.toContain('RAW_DIAGNOSTIC_MARKER');
  expect(nonReadRequests).toEqual([]);
});

test('malformed incoming route state is discarded without retaining a raw marker', async ({ page }) => {
  const nonReadRequests = await blockWrites(page);
  await page.goto('/contact');
  await expect(page.locator('#contact-inquiry')).toBeVisible();
  await page.evaluate(() => {
    history.replaceState({ usr: { inquiryContext: { origin: 'fit-diagnostic', fitDecision: 'not-recommended', rawDiagnosticAnswer: 'RAW_DIAGNOSTIC_MARKER' } }, key: 'raw', idx: 1 }, '', '/contact');
  });
  await page.reload();
  await expect(page.locator('#contact-inquiry')).toBeVisible();
  await expect(page.locator('#estimate-context-preview')).toBeHidden();
  await expect.poll(() => page.evaluate(() => `${location.href} ${JSON.stringify(history.state)} ${JSON.stringify(localStorage)} ${JSON.stringify(sessionStorage)}`)).not.toContain('RAW_DIAGNOSTIC_MARKER');
  expect(nonReadRequests).toEqual([]);
});
