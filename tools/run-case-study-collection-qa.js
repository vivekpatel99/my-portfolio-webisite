/**
 * Local-only integration QA for CB-10 (#88).
 *
 * The harness builds disposable synthetic publications and runs the actual
 * Vite production bundle in a loopback preview. It never changes the working
 * tree's publication manifest, starts a production server, or contacts a
 * non-loopback host.
 */
import { execFile, spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { cp, mkdir, mkdtemp, readdir, realpath, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { chromium, expect } from '@playwright/test';
import { digest } from '../publication/case-study-evidence.js';
import { guardLocalNavigation, guardLocalWebSocket } from '../tests/qa/qa-navigation-guard.js';

const execFileAsync = promisify(execFile);
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const COLLECTION_SCENARIOS = Object.freeze([3, 4, 6, 20, 30]);
export const COLLECTION_VIEWPORTS = Object.freeze({
  desktop: { width: 1280, height: 720 },
  tablet: { width: 768, height: 900 },
  mobile: { width: 390, height: 844 },
});

const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '[::1]']);
const fixtureImagePath = '/assets/case-studies/qa-fixture.png';
// A real 1x1 PNG. It is intentionally generated into each disposable fixture
// and its approval hash is derived from these exact bytes below.
const fixtureImageBytes = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);

export const assertLocalQaEnvironment = (environment = process.env) => {
  if (environment.CI || environment.NODE_ENV === 'production') {
    throw new Error('Collection QA harness is local-only and refused in CI or production');
  }
};

export const assertNoBlockedRequests = (blockedRequests) => {
  if (blockedRequests.length > 0) {
    throw new Error(`Collection QA recorded blocked external requests: ${blockedRequests.join(', ')}`);
  }
};

const buildInputs = Object.freeze([
  'src', 'public', 'publication', 'plugins', 'tools', 'convex',
  'index.html', 'package.json', 'vite.config.js',
  'postcss.config.js', 'tailwind.config.js',
]);

const copyBuildInputs = async (sourceRoot, destinationRoot) => {
  for (const relative of buildInputs) {
    await cp(path.join(sourceRoot, relative), path.join(destinationRoot, relative), { recursive: true });
  }
  // A symlink keeps the build fast and cannot copy private files into /tmp.
  await symlink(path.join(sourceRoot, 'node_modules'), path.join(destinationRoot, 'node_modules'), 'junction');
};

const fixtureApproval = (sha256) => ({
  kind: 'explicit', sha256, approvedBy: 'Local CB-10 QA fixture',
  approvedAt: '2026-09-10T00:00:00Z', evidence: 'https://example.invalid/cb-10-local-fixture',
});

const fixtureContent = (number, total) => {
  const id = `qa-story-${String(number).padStart(2, '0')}`;
  const title = number === 7
    ? `Synthetic case study ${number}: a deliberately long title that must wrap without clipping at desktop and mobile widths`
    : `Synthetic case study ${number}`;
  const summary = `Synthetic summary for ${id}; this text exercises the public collection card.`;
  return {
    title, cardTitle: title, category: 'Local QA fixture', summary,
    challenge: `Synthetic challenge for ${id}.`, solution: `Synthetic solution for ${id}.`,
    outcome: `Synthetic outcome for ${id}.`,
    stats: [{ value: number, suffix: '', label: 'Fixture item', description: `Synthetic fixture ${number} of ${total}.` }],
    image: { src: fixtureImagePath, alt: `Synthetic cover for ${id}` },
    gallery: [{ src: fixtureImagePath, alt: `Synthetic gallery image for ${id}` }],
    stack: ['Fixture'], externalLinks: [], projectStatus: 'completed',
    // Ascending IDs have ascending completion dates, so collection order is
    // unambiguously newest first while featured selection stays handpicked.
    completedAt: `${2024 + Math.floor((number - 1) / 12)}-${String(((number - 1) % 12) + 1).padStart(2, '0')}`,
  };
};

const fixtureRecord = (number, total) => {
  const id = `qa-story-${String(number).padStart(2, '0')}`;
  const content = fixtureContent(number, total);
  const claim = (placement, value) => {
    const claimId = `${id}.${placement}`;
    return {
      id: claimId, type: 'content', recordId: id, placement, value,
      approval: fixtureApproval(digest({ id: claimId, type: 'content', recordId: id, placement, value })),
    };
  };
  const summary = claim('summary', content.summary);
  const outcome = claim('outcome', content.outcome);
  const stat = claim('stats.0', content.stats[0]);
  return {
    id, slug: id, status: 'published',
    approval: fixtureApproval(digest({ id, slug: id, content })),
    claimRefs: { summary: summary.id, outcome: outcome.id, stats: [stat.id] }, content,
    claims: {
      [summary.id]: (({ id: _id, ...claimValue }) => claimValue)(summary),
      [outcome.id]: (({ id: _id, ...claimValue }) => claimValue)(outcome),
      [stat.id]: (({ id: _id, ...claimValue }) => claimValue)(stat),
    },
  };
};

const fixtureManifestSource = (eligibleCount) => {
  const records = [];
  const claims = {};
  for (let number = 1; number <= eligibleCount; number += 1) {
    const record = fixtureRecord(number, eligibleCount);
    Object.assign(claims, record.claims);
    delete record.claims;
    records.push(record);
  }

  // Published ongoing content must be absent from the eligible collection.
  const ongoingId = 'qa-ongoing-project';
  const ongoingContent = {
    title: 'Ongoing fixture', summary: 'Should never appear in the collection.', projectStatus: 'ongoing',
    sections: ['problem', 'built', 'outcome'].map((key) => ({
    key, heading: { problem: 'The problem', built: 'What I built', outcome: 'The outcome' }[key],
    nodes: [{ type: 'paragraph', children: [{ type: 'text', value: 'Ongoing fixture.' }] }],
    })),
  };
  const ongoingSummary = { id: `${ongoingId}.summary`, type: 'content', recordId: ongoingId, placement: 'summary', value: ongoingContent.summary };
  const ongoingOutcome = { id: `${ongoingId}.outcome`, type: 'content', recordId: ongoingId, placement: 'outcome', value: ongoingContent.sections[2] };
  records.push({
    id: ongoingId, slug: ongoingId, status: 'published', variant: 'article',
    approval: fixtureApproval(digest({ id: ongoingId, slug: ongoingId, content: ongoingContent })),
    claimRefs: { summary: ongoingSummary.id, outcome: ongoingOutcome.id }, content: ongoingContent,
  });
  for (const claim of [ongoingSummary, ongoingOutcome]) {
    claims[claim.id] = { ...claim, approval: fixtureApproval(digest(claim)) };
    delete claims[claim.id].id;
  }
  // Drafts intentionally contain only their identity/status and are ignored by
  // the compiler, which proves private metadata never reaches browser code.
  records.push({ id: 'qa-draft-private', slug: 'qa-draft-private', status: 'draft' });

  const manifest = {
    schemaVersion: 1, claims,
    assets: { [fixtureImagePath]: { file: `public${fixtureImagePath}`, approval: fixtureApproval(digest(fixtureImageBytes)) } },
    records,
  };
  return `export const caseStudyPublicationManifest = ${JSON.stringify(manifest)};\nexport const caseStudyPublicationBaseline = caseStudyPublicationManifest;\n`;
};

const featuredFixtureSource = `// Local CB-10 fixture: deliberately non-newest handpicked order.\nexport const featuredCaseStudySlugs = ['qa-story-03', 'qa-story-01', 'qa-story-02'];\n`;

export async function createFixtureWorkspace({ sourceRoot = repositoryRoot, eligibleCount } = {}) {
  assertLocalQaEnvironment();
  if (!COLLECTION_SCENARIOS.includes(eligibleCount)) throw new Error(`Unsupported fixture count: ${eligibleCount}`);
  const directory = await mkdtemp(path.join(await realpath(os.tmpdir()), 'case-study-collection-qa-'));
  try {
    await copyBuildInputs(sourceRoot, directory);
    await writeFile(path.join(directory, 'public/assets/case-studies/qa-fixture.png'), fixtureImageBytes);
    await writeFile(path.join(directory, 'publication/case-study-manifest.js'), fixtureManifestSource(eligibleCount));
    await writeFile(path.join(directory, 'publication/case-study-featured.js'), featuredFixtureSource);
    return directory;
  } catch (error) {
    await rm(directory, { recursive: true, force: true });
    throw error;
  }
}

export async function withFixtureWorkspace(callback, options) {
  const directory = await createFixtureWorkspace(options);
  try { return await callback(directory); } finally { await rm(directory, { recursive: true, force: true }); }
}

const run = async (command, args, cwd, timeout = 120_000) => {
  const result = await execFileAsync(command, args, { cwd, timeout, maxBuffer: 16 * 1024 * 1024 });
  return result.stdout;
};

const generatedOutputFiles = async (directory) => {
  const output = [];
  const visit = async (current) => {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const file = path.join(current, entry.name);
      if (entry.isDirectory()) await visit(file);
      else if (entry.isFile()) output.push(file);
    }
  };
  await visit(path.join(directory, 'dist'));
  return output;
};

const assertGeneratedOutputSafe = async (directory, removedSlugs = []) => {
  const files = await generatedOutputFiles(directory);
  let scannedBytes = 0;
  for (const file of files) {
    const bytes = await readFile(file);
    scannedBytes += bytes.byteLength;
    if (scannedBytes > 64 * 1024 * 1024) throw new Error('Generated-output sentinel scan exceeded its 64 MiB bound');
    const text = bytes.toString('utf8');
    expect(text).not.toContain('qa-draft-private');
    for (const slug of removedSlugs) expect(text).not.toContain(slug);
  }
};

const getFreePort = async () => new Promise((resolve, reject) => {
  const server = createServer();
  server.once('error', reject);
  server.listen(0, '127.0.0.1', () => {
    const { port } = server.address();
    server.close(() => resolve(port));
  });
});

const startPreview = async (directory, requestedPort) => {
  const port = requestedPort ?? await getFreePort();
  const child = spawn(path.join(directory, 'node_modules/.bin/vite'), ['preview', '--host', '127.0.0.1', '--strictPort', '--port', String(port)], {
    cwd: directory, stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  let startupError = null;
  child.once('error', (error) => { startupError = error; });
  child.stdout.on('data', (chunk) => { output += chunk.toString(); });
  child.stderr.on('data', (chunk) => { output += chunk.toString(); });
  const origin = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    if (startupError) throw startupError;
    if (child.exitCode !== null) throw new Error(`Preview exited before startup (code ${child.exitCode}). Output:\n${output}`);
    try { if ((await fetch(`${origin}/`)).ok) return { child, origin }; } catch { /* starting */ }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  child.kill('SIGTERM');
  throw new Error(`Preview did not start. Output:\n${output}`);
};

const stopPreview = async ({ child }) => {
  if (child.exitCode !== null) return;
  child.kill('SIGTERM');
  await new Promise((resolve) => {
    const timer = setTimeout(() => { child.kill('SIGKILL'); resolve(); }, 3_000);
    child.once('exit', () => { clearTimeout(timer); resolve(); });
  });
};

const installLoopbackGuard = async (context, blockedRequests) => {
  // This route is registered before any page is created or navigated.
  await context.route('**/*', async (route) => {
    const requestUrl = route.request().url();
    const url = new URL(requestUrl);
    if (!LOOPBACK_HOSTS.has(url.hostname)) {
      blockedRequests.push(requestUrl);
    }
    return guardLocalNavigation(route);
  });
  await context.routeWebSocket('**/*', async (webSocketRoute) => {
    if (!LOOPBACK_HOSTS.has(new URL(webSocketRoute.url()).hostname)) blockedRequests.push(webSocketRoute.url());
    return guardLocalWebSocket(webSocketRoute);
  });
};

const closeContext = async (context, blockedRequests) => {
  // Playwright route callbacks may still be inside route.fetch when a page
  // assertion fails. Wait for them before closing so TargetClosedError cannot
  // hide the original QA failure.
  try { assertNoBlockedRequests(blockedRequests); }
  finally {
    try { await context.unrouteAll({ behavior: 'wait' }); } catch { /* context is already closing */ }
    try { await context.close(); } catch { /* preserve the original assertion */ }
  }
};

const cardLinks = (page) => page.getByRole('link', { name: /^Read case study:/i });
const collectionCount = (page) => page.getByRole('status').filter({ hasText: /Showing \d+ of \d+ case studies/i }).first();

const waitForBrowsingSnapshot = async (page) => {
  await expect.poll(
    () => page.evaluate(() => Boolean(window.history.state?.caseStudyCollection)),
    { timeout: 3_000 },
  ).toBe(true);
};

const assertNoHorizontalOverflow = async (page) => {
  const overflow = await page.evaluate(() => ({ documentWidth: document.documentElement.scrollWidth, viewportWidth: window.innerWidth }));
  expect(overflow.documentWidth).toBeLessThanOrEqual(overflow.viewportWidth);
};

const assertCardFooter = async (page) => {
  const cards = page.locator('article').filter({ has: page.getByRole('link', { name: /^Read case study:/i }) });
  await expect(cards.first().getByRole('time')).toBeVisible();
  for (let index = 0; index < await cards.count(); index += 1) {
    const card = cards.nth(index);
    const [cardBox, timeBox, readBox] = await Promise.all([
      card.boundingBox(), card.getByRole('time').boundingBox(), card.getByText('Read case study →', { exact: true }).boundingBox(),
    ]);
    if (!cardBox || !timeBox || !readBox) throw new Error(`Missing card geometry at index ${index}`);
    expect(Math.abs(cardBox.x + cardBox.width - (timeBox.x + timeBox.width))).toBeLessThanOrEqual(24);
    expect(Math.abs(cardBox.x - readBox.x)).toBeLessThanOrEqual(24);
    expect(Math.abs(cardBox.y + cardBox.height - (timeBox.y + timeBox.height))).toBeLessThanOrEqual(24);
    expect(await card.getByRole('heading').evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(false);
  }
};

const assertColumns = async (page, viewportName) => {
  const cards = page.locator('article').filter({ has: page.getByRole('link', { name: /^Read case study:/i }) });
  const positions = await cards.evaluateAll((elements) => elements.map((element) => Math.round(element.getBoundingClientRect().x)));
  const columns = new Set(positions).size;
  if (viewportName === 'mobile') expect(columns).toBe(1);
  if (viewportName === 'tablet') expect(columns).toBe(2);
  if (viewportName === 'desktop') expect(columns).toBe(3);
};

const assertSixCardLoading = async (page, total) => {
  let displayed = Math.min(6, total);
  await expect(cardLinks(page)).toHaveCount(displayed);
  while (displayed < total) {
    await expect(page.getByRole('button', { name: /^Load more$/i })).toBeVisible();
    await page.getByRole('button', { name: /^Load more$/i }).click();
    displayed = Math.min(displayed + 6, total);
    await expect(cardLinks(page)).toHaveCount(displayed);
    await expect(collectionCount(page)).toHaveText(new RegExp(`Showing ${displayed} of ${total} case studies`, 'i'));
  }
  await expect(page.getByRole('button', { name: /^Load more$/i })).toHaveCount(0);
};

const assertKeyboardReachability = async (page) => {
  const cards = cardLinks(page);
  const cardCount = await cards.count();
  const first = cards.first();
  expect(await first.evaluate((element) => element.tabIndex)).toBeGreaterThanOrEqual(0);
  await first.focus();
  await expect(first).toBeFocused();
  for (let index = 1; index < cardCount; index += 1) {
    await page.keyboard.press('Tab');
    await expect(cards.nth(index)).toBeFocused();
  }
};

const assertHomepage = async (page, total) => {
  await page.goto('/');
  const portfolio = page.locator('#portfolio');
  await expect(portfolio).toBeVisible();
  const links = portfolio.getByRole('link', { name: /^Read case study:/i });
  await expect(links).toHaveCount(Math.min(3, total));
  if (total >= 3) {
    await expect(portfolio.locator('article').getByRole('heading')).toHaveText([
      'Synthetic case study 3', 'Synthetic case study 1', 'Synthetic case study 2',
    ]);
  }
  await expect(portfolio.getByRole('link', { name: new RegExp(`View all case studies \\(${total}\\)`, 'i') })).toBeVisible();
};

const assertCollection = async (page, total, viewportName) => {
  await page.goto('/case-studies/');
  await expect(page.getByRole('heading', { name: /selected case studies/i })).toBeVisible();
  await expect(collectionCount(page)).toHaveText(new RegExp(`Showing ${Math.min(6, total)} of ${total} case studies`, 'i'));
  const initialCards = page.locator('article').filter({ has: cardLinks(page) });
  await expect(initialCards.getByRole('heading')).toHaveText(
    Array.from({ length: Math.min(6, total) }, (_, index) => `Synthetic case study ${total - index}`),
  );
  await assertColumns(page, viewportName);
  await assertSixCardLoading(page, total);
  // Run geometry after every card is loaded so the deliberately long story 7
  // is covered in the 20- and 30-story scenarios.
  await assertCardFooter(page);
  await assertNoHorizontalOverflow(page);
  await assertKeyboardReachability(page);
};

const captureScaleScreenshot = async (page, eligibleCount, viewportName) => {
  if (eligibleCount !== 20 || !['desktop', 'mobile'].includes(viewportName)) return;
  const screenshotDirectory = path.join(repositoryRoot, '.scratch/case-study-collection-qa');
  await mkdir(screenshotDirectory, { recursive: true });
  await page.screenshot({
    path: path.join(screenshotDirectory, `${viewportName}-20-loaded.png`),
    fullPage: true,
  });
};

const assertArticleReturnAndBack = async (page, total) => {
  await page.goto('/case-studies/');
  if (total > 6) await page.getByRole('button', { name: /^Load more$/i }).click();
  const expectedDisplayed = Math.min(12, total);
  await expect(cardLinks(page)).toHaveCount(expectedDisplayed);
  const target = cardLinks(page).nth(Math.min(7, expectedDisplayed - 1));
  await target.scrollIntoViewIfNeeded();
  const beforeScroll = await page.evaluate(() => window.scrollY);
  await target.click();
  await expect(page).toHaveURL(/\/project\/qa-story-\d+\/?$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const returnLink = page.getByRole('link', { name: /view case studies/i }).first();
  await expect(returnLink).toBeVisible();
  await returnLink.click();
  await expect(page).toHaveURL(/\/case-studies\/?/);
  await expect(cardLinks(page)).toHaveCount(expectedDisplayed);
  await waitForBrowsingSnapshot(page);
  await expect.poll(
    () => page.evaluate(() => window.scrollY).then((scrollY) => Math.abs(scrollY - beforeScroll)),
    { timeout: 3_000 },
  ).toBeLessThanOrEqual(100);

  await page.goto('/case-studies/');
  if (total > 6) await page.getByRole('button', { name: /^Load more$/i }).click();
  const backDisplayed = Math.min(12, total);
  await expect(cardLinks(page)).toHaveCount(backDisplayed);
  const backTarget = cardLinks(page).nth(Math.min(7, backDisplayed - 1));
  await backTarget.scrollIntoViewIfNeeded();
  const backScroll = await page.evaluate(() => window.scrollY);
  await backTarget.click();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/case-studies\/?/);
  await expect(cardLinks(page)).toHaveCount(backDisplayed);
  await waitForBrowsingSnapshot(page);
  await expect.poll(
    () => page.evaluate(() => window.scrollY).then((scrollY) => Math.abs(scrollY - backScroll)),
    { timeout: 3_000 },
  ).toBeLessThanOrEqual(100);
};

const assertDirectArticleDefault = async (browser, origin, total) => {
  const blockedRequests = [];
  const context = await browser.newContext({ baseURL: origin, viewport: COLLECTION_VIEWPORTS.desktop, serviceWorkers: 'block' });
  try {
    await installLoopbackGuard(context, blockedRequests);
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.goto('/project/qa-story-01/');
    await expect(page.getByRole('heading', { level: 1, name: 'Synthetic case study 1' })).toBeVisible();
    await page.getByRole('link', { name: /view case studies/i }).first().click();
    await expect(page).toHaveURL(/\/case-studies\/?/);
    await expect(cardLinks(page)).toHaveCount(Math.min(6, total));
    await expect(collectionCount(page)).toHaveText(new RegExp(`Showing ${Math.min(6, total)} of ${total} case studies`, 'i'));
    expect(pageErrors).toEqual([]);
  } finally { await closeContext(context, blockedRequests); }
};

const assertRemovedPublication = async ({ browser, directory, preview }) => {
  if (!directory || !preview) return preview;
  const port = Number(new URL(preview.origin).port);
  const blockedRequests = [];
  const context = await browser.newContext({ baseURL: preview.origin, viewport: COLLECTION_VIEWPORTS.desktop, serviceWorkers: 'block' });
  let updatedPreview = null;
  let transferredPreview = false;
  try {
    await installLoopbackGuard(context, blockedRequests);
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.goto('/case-studies/');
    await assertSixCardLoading(page, 30);
    await page.getByRole('link', { name: /Synthetic case study 30/i }).click();
    await expect(page).toHaveURL(/\/project\/qa-story-30\/?$/);
    await expect(page.getByRole('heading', { level: 1, name: /Synthetic case study 30/i })).toBeVisible();

    // Keep the article open while rebuilding the same disposable preview from
    // a manifest containing only three eligible stories. The return anchor is
    // then a real hard navigation against the new publication projection.
    await stopPreview(preview);
    await writeFile(path.join(directory, 'publication/case-study-manifest.js'), fixtureManifestSource(3));
    await run('npm', ['run', 'build'], directory);
    updatedPreview = await startPreview(directory, port);
    await assertGeneratedOutputSafe(directory, ['qa-story-30']);
    await page.getByRole('link', { name: /view case studies/i }).first().click();
    await expect(page).toHaveURL(/\/case-studies\/?/);
    await page.reload();
    await expect(cardLinks(page)).toHaveCount(3);
    await expect(collectionCount(page)).toHaveText(/Showing 3 of 3 case studies/i);
    await expect(page.getByText(/Synthetic case study 30/i)).toHaveCount(0);

    await page.goto('/project/qa-story-30/');
    await expect(page.getByRole('heading', { level: 1, name: 'Page Not Found' })).toBeVisible();
    expect(pageErrors).toEqual([]);
    transferredPreview = true;
    return updatedPreview;
  } finally {
    await closeContext(context, blockedRequests);
    if (updatedPreview && !transferredPreview) await stopPreview(updatedPreview);
  }
};

const assertTouchReachability = async (browser, origin, total) => {
  const blockedRequests = [];
  const context = await browser.newContext({ baseURL: origin, viewport: COLLECTION_VIEWPORTS.mobile, hasTouch: true, serviceWorkers: 'block' });
  try {
    await installLoopbackGuard(context, blockedRequests);
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.goto(`${origin}/case-studies/`);
    await assertSixCardLoading(page, total);
    const hrefs = await cardLinks(page).evaluateAll((elements) => elements.map((element) => element.getAttribute('href')));
    for (let index = 0; index < hrefs.length; index += 1) {
      await page.goto(`${origin}/case-studies/`);
      await assertSixCardLoading(page, total);
      const link = cardLinks(page).nth(index);
      await link.scrollIntoViewIfNeeded();
      await link.tap();
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page).toHaveURL(new URL(hrefs[index], origin).href);
    }
    expect(pageErrors).toEqual([]);
  } finally { await closeContext(context, blockedRequests); }
};

export async function runScenario({ eligibleCount, browser }) {
  return withFixtureWorkspace(async (directory) => {
    await run('npm', ['run', 'build'], directory);
    await assertGeneratedOutputSafe(directory);
    let preview = await startPreview(directory);
    try {
      for (const [viewportName, viewport] of Object.entries(COLLECTION_VIEWPORTS)) {
        const blockedRequests = [];
        const context = await browser.newContext({ baseURL: preview.origin, viewport, serviceWorkers: 'block' });
        try {
          await installLoopbackGuard(context, blockedRequests);
          const page = await context.newPage();
          const pageErrors = [];
          page.on('pageerror', (error) => pageErrors.push(error.message));
          await assertHomepage(page, eligibleCount);
          await assertCollection(page, eligibleCount, viewportName);
          await captureScaleScreenshot(page, eligibleCount, viewportName);
          await assertArticleReturnAndBack(page, eligibleCount);
          expect(pageErrors).toEqual([]);
        } finally { await closeContext(context, blockedRequests); }
      }
      await assertDirectArticleDefault(browser, preview.origin, eligibleCount);
      await assertTouchReachability(browser, preview.origin, eligibleCount);
      if (eligibleCount === 30) preview = await assertRemovedPublication({ browser, directory, preview });
    } finally { await stopPreview(preview); }
  }, { eligibleCount });
}

export async function main() {
  assertLocalQaEnvironment();
  const browser = await chromium.launch({ headless: true });
  try {
    for (const eligibleCount of COLLECTION_SCENARIOS) {
      console.log(`CB-10 QA: building and testing ${eligibleCount} eligible stories`);
      await runScenario({ eligibleCount, browser });
    }
    console.log(`CB-10 QA passed for ${COLLECTION_SCENARIOS.join(', ')} eligible stories on desktop, tablet, and mobile.`);
  } finally { await browser.close(); }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => { console.error(error.stack || error); process.exitCode = 1; });
}
