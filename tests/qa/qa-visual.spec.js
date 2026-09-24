import { expect, test } from './qa-test.js';
import { assertVisualLayout } from './visual-layout.js';

const COOKIE_KEY = 'cookie_consent_preferences';

const viewportBox = (page) => {
  const viewport = page.viewportSize();
  return { x: 0, y: 0, width: viewport.width, height: viewport.height };
};

const reducedMotion = async (page) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
};

const settleLayout = async (page) => {
  await page.evaluate(async () => {
    await document.fonts?.ready;
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await new Promise((resolve) => requestAnimationFrame(resolve));
  });
};

test('home request CTA is visible, usable, and separated from its companion link', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await reducedMotion(page);
  await page.addInitScript((key) => {
    localStorage.setItem(key, JSON.stringify({ necessary: true, analytics: false }));
  }, COOKIE_KEY);
  await page.goto('/');
  await settleLayout(page);

  const viewport = viewportBox(page);
  const cta = page.getByRole('button', { name: /Request a Project Estimate/i }).first();
  const companion = page.getByRole('link', { name: 'View Case Studies' });
  await expect(cta).toBeVisible();
  await expect(companion).toBeVisible();
  const ctaBox = await cta.boundingBox();
  const companionBox = await companion.boundingBox();

  assertVisualLayout({
    label: 'home request estimate CTA',
    box: ctaBox,
    viewport,
    minWidth: 220,
    minHeight: 44,
    avoid: [{ label: 'home case studies link', box: companionBox }],
  });
  assertVisualLayout({
    label: 'home case studies link',
    box: companionBox,
    viewport,
    minWidth: 150,
    minHeight: 44,
  });
});

test('mobile cookie dialog and its controls remain visible and do not cover the hero CTA', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await reducedMotion(page);
  await page.addInitScript((key) => localStorage.removeItem(key), COOKIE_KEY);
  await page.goto('/');
  await settleLayout(page);

  const viewport = viewportBox(page);
  const dialog = page.getByRole('dialog', { name: /we value your privacy/i });
  await expect(dialog).toBeVisible({ timeout: 5000 });
  const dialogBox = await dialog.boundingBox();
  assertVisualLayout({
    label: 'mobile cookie dialog',
    box: dialogBox,
    viewport,
    minWidth: 320,
    minHeight: 100,
  });

  const close = dialog.getByRole('button', { name: /close cookie consent/i });
  const accept = dialog.getByRole('button', { name: 'Accept All', exact: true });
  const reject = dialog.getByRole('button', { name: 'Reject All', exact: true });
  const customize = dialog.getByRole('button', { name: 'Customize', exact: true });
  for (const [label, locator] of [
    ['cookie close control', close],
    ['cookie accept control', accept],
    ['cookie reject control', reject],
    ['cookie customize control', customize],
  ]) {
    await expect(locator).toBeVisible();
    assertVisualLayout({
      label,
      box: await locator.boundingBox(),
      containedBy: dialogBox,
      minWidth: 44,
      minHeight: 44,
    });
  }

  const cta = page.getByRole('button', { name: /Request a Project Estimate/i }).first();
  await expect(cta).toBeVisible();
  assertVisualLayout({
    label: 'hero request estimate CTA beside cookie dialog',
    box: await cta.boundingBox(),
    viewport,
    minWidth: 220,
    minHeight: 44,
    avoid: [{ label: 'mobile cookie dialog', box: dialogBox }],
  });
});

test('hero invoice proof fold design (#176): proofs visible, CTA routes correctly, no viewport clip', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await reducedMotion(page);
  await page.addInitScript((key) => localStorage.removeItem(key), COOKIE_KEY);
  await page.goto('/');
  await settleLayout(page);

  const h1 = page.getByRole('heading', { level: 1, name: 'Computer Vision & AI Engineer' });
  await expect(h1).toBeVisible();
  
  const proofsGroup = page.locator('[role="group"][aria-label="Detected credentials"]');
  await expect(proofsGroup).toBeVisible();
  
  await expect(page.getByText('Top Rated Plus', { exact: true })).toBeVisible();
  await expect(page.getByText('100% Job Success', { exact: true })).toBeVisible();
  
  await expect(page.getByText('Detected total')).not.toBeVisible();
  
  await expect(page.getByText('PROOF ·')).not.toBeVisible();
  await expect(page.getByText('fields · 2')).not.toBeVisible();
  
  const viewport = viewportBox(page);
  const dialog = page.getByRole('dialog', { name: /we value your privacy/i });
  await expect(dialog).toBeVisible({ timeout: 5000 });
  const dialogBox = await dialog.boundingBox();
  
  const cta = page.getByRole('button', { name: 'Request a Project Estimate' }).first();
  await expect(cta).toBeVisible();
  const ctaBox = await cta.boundingBox();
  
  assertVisualLayout({
    label: 'hero CTA with cookie dialog and proof fold',
    box: ctaBox,
    viewport,
    minWidth: 220,
    minHeight: 44,
    avoid: [{ label: 'cookie dialog', box: dialogBox }],
  });
  
  await cta.click();
  await expect(page).toHaveURL(/\/contact\/?$/);
  await expect(page.getByRole('heading', { name: /Request a Project Estimate/i })).toBeVisible();
});

test('desktop hero invoice proof fold: all elements visible, no clip', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await reducedMotion(page);
  await page.addInitScript((key) => localStorage.removeItem(key), COOKIE_KEY);
  await page.goto('/');
  await settleLayout(page);
  
  const h1 = page.getByRole('heading', { level: 1, name: 'Computer Vision & AI Engineer' });
  await expect(h1).toBeVisible();
  
  const proofsGroup = page.locator('[role="group"][aria-label="Detected credentials"]');
  await expect(proofsGroup).toBeVisible();
  
  await expect(page.getByText('Top Rated Plus', { exact: true })).toBeVisible();
  await expect(page.getByText('100% Job Success', { exact: true })).toBeVisible();
  await expect(page.getByText('Upwork freelancer')).toBeVisible();
  await expect(page.getByText('Client delivery record')).toBeVisible();
  
  await expect(page.getByText('€45/hour', { exact: true })).toBeVisible();
  await expect(page.getByText('Linz, Austria', { exact: true })).toBeVisible();
  
  await expect(page.getByText('Detected total')).not.toBeVisible();
  
  const viewport = viewportBox(page);
  const dialog = page.getByRole('dialog', { name: /we value your privacy/i });
  await expect(dialog).toBeVisible({ timeout: 5000 });
  const dialogBox = await dialog.boundingBox();
  
  const cta = page.getByRole('button', { name: 'Request a Project Estimate' }).first();
  await expect(cta).toBeVisible();
  const ctaBox = await cta.boundingBox();
  
  assertVisualLayout({
    label: 'desktop hero CTA with cookie dialog and proof fold',
    box: ctaBox,
    viewport,
    minWidth: 220,
    minHeight: 44,
    avoid: [{ label: 'desktop cookie dialog', box: dialogBox }],
  });
  
  await cta.click();
  await expect(page).toHaveURL(/\/contact\/?$/);
});

test('case study gallery keeps its stage, selected media, and thumbnails in usable geometry', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await reducedMotion(page);
  await page.goto('/project/yolo-computer-vision-optimization');
  await settleLayout(page);

  const gallery = page.getByRole('region', { name: 'Case study images' });
  const stage = gallery.locator('.case-gallery-stage').first();
  await stage.scrollIntoViewIfNeeded();
  await expect(stage).toBeVisible();
  const stageBox = await stage.boundingBox();
  const galleryBox = await gallery.boundingBox();
  const viewport = viewportBox(page);
  assertVisualLayout({
    label: 'case study gallery region',
    box: galleryBox,
    viewport,
    withinViewport: { horizontal: true, vertical: false },
    minWidth: 300,
    minHeight: 220,
  });
  assertVisualLayout({
    label: 'case study gallery stage',
    box: stageBox,
    viewport,
    minWidth: 300,
    minHeight: 220,
  });

  const selectedMedia = stage.locator('img').first();
  await expect(selectedMedia).toBeVisible();
  assertVisualLayout({
    label: 'case study selected media',
    box: await selectedMedia.boundingBox(),
    containedBy: stageBox,
    minWidth: 100,
    minHeight: 60,
  });

  const thumbnails = gallery.locator('.case-gallery-thumbnails').first();
  const selectedThumbnail = thumbnails.locator('[aria-pressed="true"]').first();
  await expect(thumbnails).toBeVisible();
  await expect(selectedThumbnail).toBeVisible();
  const thumbnailsBox = await thumbnails.boundingBox();
  assertVisualLayout({
    label: 'case study thumbnail strip',
    box: thumbnailsBox,
    containedBy: galleryBox,
    minWidth: 200,
    minHeight: 50,
  });
  assertVisualLayout({
    label: 'selected case study thumbnail',
    box: await selectedThumbnail.boundingBox(),
    containedBy: thumbnailsBox,
    minWidth: 44,
    minHeight: 44,
  });
});

const measureGalleryStage = async (page) => page.evaluate(() => {
  const stage = document.querySelector('.case-gallery-stage');
  const img = stage?.querySelector('img');
  if (!stage || !img) return null;
  const stageBox = stage.getBoundingClientRect();
  const imageBox = img.getBoundingClientRect();
  return {
    stageRatio: stageBox.width / stageBox.height,
    fill: imageBox.height / stageBox.height,
    natural: img.naturalWidth / img.naturalHeight,
    complete: img.complete && img.naturalWidth > 0,
  };
});

test('wide case-study galleries fill the stage without a 4:3 empty band', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await reducedMotion(page);
  const cases = [
    { slug: 'n8n-openai-data-extraction', ratio: 2984 / 874 },
    { slug: 'ai-invoice-processing-automation', ratio: 2448 / 684 },
    { slug: 'yolo-computer-vision-optimization', ratio: 4 / 3 },
    { slug: 'invoice-ocr-extraction', ratio: 4 / 3 },
  ];
  for (const { slug, ratio } of cases) {
    await page.goto(`/project/${slug}/`);
    await settleLayout(page);
    const gallery = page.getByRole('region', { name: 'Case study images' });
    const stage = gallery.locator('.case-gallery-stage').first();
    await stage.scrollIntoViewIfNeeded();
    await expect(stage.locator('img').first()).toBeVisible();
    await expect.poll(async () => (await measureGalleryStage(page))?.complete).toBe(true);
    const metrics = await measureGalleryStage(page);
    expect(metrics.stageRatio, slug).toBeCloseTo(ratio, 1);
    expect(metrics.fill, slug).toBeGreaterThan(0.65);
  }

  await page.goto('/project/ai-invoice-processing-automation/');
  await settleLayout(page);
  const invoiceGallery = page.getByRole('region', { name: 'Case study images' });
  await invoiceGallery.locator('.case-gallery-stage').first().scrollIntoViewIfNeeded();
  await invoiceGallery.getByRole('button', { name: /Show image 3:/ }).click();
  await expect.poll(async () => (await measureGalleryStage(page))?.complete).toBe(true);
  const shortWide = await measureGalleryStage(page);
  expect(shortWide.stageRatio).toBeCloseTo(2140 / 458, 1);
  expect(shortWide.fill).toBeGreaterThan(0.65);

  await invoiceGallery.getByRole('button', { name: /Enlarge image:/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Enlarged case study images' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Close enlarged image' }).click();
  await expect(dialog).toHaveCount(0);
});

test('contact form stays horizontally contained with visible fields and submit control', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await reducedMotion(page);
  await page.addInitScript((key) => {
    localStorage.setItem(key, JSON.stringify({ necessary: true, analytics: false }));
  }, COOKIE_KEY);
  await page.goto('/contact/');
  await settleLayout(page);

  const form = page.locator('form').first();
  await expect(form).toBeVisible();
  const formBox = await form.boundingBox();
  const viewport = viewportBox(page);
  assertVisualLayout({
    label: 'contact form',
    box: formBox,
    viewport,
    withinViewport: { horizontal: true, vertical: false },
    minWidth: 300,
    minHeight: 400,
  });

  for (const [label, locator] of [
    ['contact name field', page.getByLabel('Full Name *', { exact: true })],
    ['contact email field', page.getByLabel('Email Address *', { exact: true })],
    ['contact budget field', page.getByLabel('Budget Range (Optional)', { exact: true })],
    ['contact description field', page.getByLabel('Project Description *', { exact: true })],
    ['contact submit control', page.getByRole('button', { name: /Request a Project Estimate/i })],
  ]) {
    await expect(locator).toBeVisible();
    assertVisualLayout({
      label,
      box: await locator.boundingBox(),
      containedBy: formBox,
      minWidth: 44,
      minHeight: 44,
    });
  }
});

test('visual layout helper rejects hidden, clipped, and overlapping DOM mutations', async ({ page }) => {
  await page.setContent(`
    <style>html, body { margin: 0; } #subject, #other { position: absolute; width: 342px; height: 160px; } #subject { left: 24px; top: 120px; } #other { left: 24px; top: 320px; }</style>
    <div id="subject"></div><div id="other"></div>
  `);
  const viewport = viewportBox(page);
  const subject = page.locator('#subject');
  const other = page.locator('#other');

  const normalBox = await subject.boundingBox();
  assertVisualLayout({ label: 'normal fixture', box: normalBox, viewport, avoid: [{ label: 'other fixture', box: await other.boundingBox() }] });

  await subject.evaluate((element) => { element.style.visibility = 'hidden'; });
  const hiddenBox = await subject.boundingBox();
  const hiddenVisible = await subject.isVisible();
  expect(() => assertVisualLayout({ label: 'hidden fixture', box: hiddenBox, visible: hiddenVisible, viewport })).toThrow(/hidden/i);

  await subject.evaluate((element) => {
    element.style.visibility = 'visible';
    element.style.top = '-8px';
  });
  const clippedBox = await subject.boundingBox();
  expect(() => assertVisualLayout({ label: 'clipped fixture', box: clippedBox, viewport })).toThrow(/clipped/i);

  await subject.evaluate((element) => { element.style.top = '120px'; });
  await other.evaluate((element) => { element.style.top = '220px'; });
  const overlapBox = await subject.boundingBox();
  const mutatedOtherBox = await other.boundingBox();
  expect(() => assertVisualLayout({
    label: 'overlap fixture',
    box: overlapBox,
    viewport,
    avoid: [{ label: 'mutated other fixture', box: mutatedOtherBox }],
  })).toThrow(/overlap/i);
});

test('custom cursor mounts on desktop fine pointer', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes('mobile'), 'Desktop fine pointer assertion is covered by the desktop project.');
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await page.mouse.move(400, 400);
  await expect(page.locator('html')).toHaveClass(/custom-cursor-enabled/);
});

test('cookie customize panel expands', async ({ page }) => {
  await page.addInitScript((key) => localStorage.removeItem(key), COOKIE_KEY);
  await page.goto('/');
  await page.getByRole('button', { name: /Customize/i }).click({ timeout: 5000 });
  await expect(page.getByLabel(/Analytics and Diagnostics Cookies/i)).toBeVisible();
});

test('case-study article renders sober sections without legacy stats panels', async ({ page }) => {
  await page.goto('/project/yolo-computer-vision-optimization');
  await expect(page.getByRole('heading', { name: 'The problem' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'What I built' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'The outcome' })).toBeVisible();
  await expect(page.locator('#stats-section')).toHaveCount(0);
});

test('contact validation notice leaves cookie controls visible on tablet and desktop', async ({ page }) => {
  await reducedMotion(page);
  for (const width of [640, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/contact/');
    await page.addStyleTag({ content: '*, *::before, *::after { animation: none !important; transition: none !important; }' });
    const cookie = page.getByRole('dialog', { name: 'We value your privacy' });
    await expect(cookie).toBeVisible();
    await page.getByRole('button', { name: 'Request a Project Estimate', exact: true }).click();
    const message = page.getByText('Uh oh! Missing fields.', { exact: true }).first();
    await expect(message).toBeVisible();
    const notice = message.locator('xpath=ancestor::li[1]');
    await settleLayout(page);
    assertVisualLayout({
      label: 'contact validation notice',
      box: await notice.boundingBox(),
      viewport: viewportBox(page),
      avoid: [{ label: 'cookie consent controls', box: await cookie.boundingBox() }],
    });
  }
});
