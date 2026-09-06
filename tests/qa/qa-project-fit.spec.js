import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const screenshotDirectory = path.join(process.cwd(), 'docs', 'reviews', 'gate-3-screenshots');
const viewports = [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 1280, height: 720 },
];
const motionPreferences = ['reduce', 'no-preference'];

const reviewedAnswers = [
  'Yes, usable source material or access is available',
  'Yes, the needed information and where it should go are clear',
  'A practical assessment and workflow that can be tested and reviewed',
  'A person will review exceptions and business decisions',
];

const outcomes = [
  {
    name: 'strong document extraction',
    projectType: 'Document or web data extraction',
    decision: 'Strong Fit',
    proofSlugs: ['n8n-openai-data-extraction', 'invoice-ocr-extraction'],
  },
  {
    name: 'possible computer vision',
    projectType: 'Computer vision, including a slow or unreliable pipeline',
    decision: 'Possible Fit',
    proofSlugs: ['yolo-computer-vision-optimization'],
  },
  {
    name: 'not recommended out of scope',
    projectType: 'Something outside these published areas',
    decision: 'Not Recommended',
    proofSlugs: [],
  },
];

function assertLocalPreviewURL(url) {
  const parsed = new URL(url);
  if (!['127.0.0.1', 'localhost', '::1', '[::1]'].includes(parsed.hostname)) {
    throw new Error(`Gate 3 browser checks require a local preview, not ${parsed.origin}`);
  }
  return parsed;
}

function storageAndLocation(page) {
  return page.evaluate(() => ({
    location: `${location.pathname}${location.search}${location.hash}`,
    localStorage: Object.fromEntries(Object.entries(localStorage)),
    sessionStorage: Object.fromEntries(Object.entries(sessionStorage)),
  }));
}

async function selectAndNext(diagnostic, label) {
  await diagnostic.getByLabel(label, { exact: true }).check();
  await diagnostic.getByRole('button', { name: /next|see result/i }).click();
}

async function auditDiagnostic(page) {
  const audit = await new AxeBuilder({ page })
    .include('#project-fit-diagnostic')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(audit.violations).toEqual([]);
}

async function settlePageAssets(page, diagnostic) {
  // The existing About portrait is lazy-loaded as questionnaire height changes.
  // Load that page asset before asserting that answers cause no requests.
  const portrait = page.locator('img[src*="vivek-black-and-white.webp"]');
  await portrait.scrollIntoViewIfNeeded();
  await portrait.evaluate((image) => image.decode());
  await diagnostic.scrollIntoViewIfNeeded();
  await page.waitForLoadState('networkidle');
}

async function maybeScreenshot(page, name) {
  if (process.env.GATE3_SCREENSHOTS !== '1') return;
  mkdirSync(screenshotDirectory, { recursive: true });
  await page.locator('#project-fit-diagnostic').screenshot({
    path: path.join(screenshotDirectory, `${name}.png`),
    // Fixed page chrome otherwise crosses this tall element crop mid-content.
    style: 'header { visibility: hidden !important; }',
  });
}

for (const viewport of viewports) {
  for (const motion of motionPreferences) {
    for (const outcome of outcomes) {
      test(`project fit: ${outcome.name} at ${viewport.width}px with ${motion} motion`, async ({ page, baseURL }) => {
        const localOrigin = assertLocalPreviewURL(baseURL);
        const requests = [];
        page.on('request', (request) => requests.push({ method: request.method(), url: request.url() }));
        await page.setViewportSize(viewport);
        await page.emulateMedia({ reducedMotion: motion });
        await page.goto(`${localOrigin.origin}/`);
        const rejectCookies = page.getByRole('button', { name: 'Reject All', exact: true });
        await rejectCookies.click();
        await expect(rejectCookies).toBeHidden();

        const diagnostic = page.locator('#project-fit-diagnostic');
        await expect(diagnostic).toBeVisible();
        await settlePageAssets(page, diagnostic);
        const baseline = await storageAndLocation(page);
        const requestsBeforeInteractions = requests.length;
        await diagnostic.getByRole('button', { name: 'Start diagnostic' }).click();

        for (let questionNumber = 1; questionNumber <= 5; questionNumber += 1) {
          await expect(diagnostic.getByRole('progressbar', { name: `Question ${questionNumber} of 5` })).toHaveAttribute('aria-valuetext', `Question ${questionNumber} of 5`);
          await auditDiagnostic(page);
          const answer = questionNumber === 1 ? outcome.projectType : reviewedAnswers[questionNumber - 2];
          await selectAndNext(diagnostic, answer);
        }

        await expect(diagnostic.getByRole('heading', { name: outcome.decision })).toBeVisible();
        for (const heading of ['Why this result', 'Limits and risks to review', 'Next step']) {
          await expect(diagnostic.getByRole('heading', { name: heading })).toBeVisible();
        }
        await auditDiagnostic(page);

        const proofLinks = diagnostic.getByRole('link');
        await expect(proofLinks).toHaveCount(outcome.proofSlugs.length);
        for (const slug of outcome.proofSlugs) {
          await expect(diagnostic.locator(`a[href="/project/${slug}/"]`)).toHaveCount(1);
        }
        if (outcome.proofSlugs.length > 0) {
          const proofTitles = await proofLinks.allTextContents();
          expect(proofTitles.every((title) => title.trim().length > 0)).toBe(true);
          expect(new Set(proofTitles).size).toBe(outcome.proofSlugs.length);
        }
        if (outcome.decision === 'Not Recommended') {
          await expect(diagnostic.getByText(/Seek a specialist/)).toBeVisible();
        }

        await maybeScreenshot(page, `${outcome.decision.toLowerCase().replaceAll(' ', '-')}-${viewport.width}-${motion}`);
        expect(await storageAndLocation(page)).toEqual(baseline);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
        expect(requests.slice(requestsBeforeInteractions)).toEqual([]);
        expect(requests.filter(({ method }) => !['GET', 'HEAD'].includes(method))).toEqual([]);
      });
    }
  }
}

test('project fit: touch selection is available in the mobile project', async ({ page, baseURL }, testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'), 'Touch input is covered by the mobile project only.');
  const localOrigin = assertLocalPreviewURL(baseURL);
  const requests = [];
  page.on('request', (request) => requests.push({ method: request.method(), url: request.url() }));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${localOrigin.origin}/`);
  const diagnostic = page.locator('#project-fit-diagnostic');
  await expect(diagnostic).toBeVisible();
  await settlePageAssets(page, diagnostic);
  const requestsBeforeInteractions = requests.length;

  await diagnostic.getByRole('button', { name: 'Start diagnostic' }).tap();
  await diagnostic.getByLabel('Workflow automation, including fragile n8n or AI workflows', { exact: true }).tap();
  await expect(diagnostic.getByLabel('Workflow automation, including fragile n8n or AI workflows', { exact: true })).toBeChecked();
  await diagnostic.getByRole('button', { name: 'Next' }).tap();
  expect(requests.slice(requestsBeforeInteractions)).toEqual([]);
});

test('project fit: keyboard journey, result edit, restart, reload and route return', async ({ page, baseURL }) => {
  const localOrigin = assertLocalPreviewURL(baseURL);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => localStorage.setItem('cookie_consent_preferences', JSON.stringify({
    essential: true, analytics: false, sentry: false, decidedAt: '2026-09-06T00:00:00Z',
  })));
  await page.goto(localOrigin.origin);
  const diagnostic = page.locator('#project-fit-diagnostic');
  const start = diagnostic.getByRole('button', { name: 'Start diagnostic' });
  for (let tab = 0; tab < 80 && !await start.evaluate((el) => el === document.activeElement); tab += 1) {
    await page.keyboard.press('Tab');
  }
  await expect(start).toBeFocused();
  await page.keyboard.press('Enter');
  for (let step = 0; step < 5; step += 1) {
    await expect(diagnostic.locator('legend')).toBeFocused();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Space');
    if (step > 0) await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(diagnostic.getByRole('button', { name: /next|see result/i })).toBeFocused();
    await page.keyboard.press('Enter');
  }
  await expect(diagnostic.getByRole('heading', { name: 'Strong Fit' })).toBeFocused();
  await diagnostic.getByRole('button', { name: 'Back to last question' }).click();
  await selectAndNext(diagnostic, 'No person will review them before a decision is made');
  await expect(diagnostic.getByRole('heading', { name: 'Not Recommended' })).toBeFocused();
  await diagnostic.getByRole('button', { name: 'Back to last question' }).click();
  await selectAndNext(diagnostic, reviewedAnswers[3]);
  await expect(diagnostic.getByRole('heading', { name: 'Strong Fit' })).toBeFocused();
  await diagnostic.getByRole('button', { name: 'Restart' }).click();
  await expect(start).toBeFocused();
  await start.click();
  await expect(diagnostic.locator('input:checked')).toHaveCount(0);
  await diagnostic.getByLabel('Document or web data extraction', { exact: true }).check();
  await page.reload();
  await expect(start).toBeVisible();
  await start.click();
  await selectAndNext(diagnostic, 'Document or web data extraction');
  for (const answer of reviewedAnswers) await selectAndNext(diagnostic, answer);
  await diagnostic.getByRole('link').first().click();
  await expect(page).toHaveURL(/\/project\/n8n-openai-data-extraction\/$/);
  await expect(page.getByRole('heading', { level: 1, name: 'n8n + OpenAI Data Extraction' })).toBeVisible();
  await page.goBack();
  await expect(start).toBeVisible();
});
