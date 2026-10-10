import { expect, test } from './qa-test.js';
import { getCaseStudyBySlug } from '../../src/data/caseStudies.js';
import { caseStudyDisplaySrc, collectGalleryImages } from '../../src/components/CaseStudyGallery.js';

const viewports = [{ width: 1440, height: 900 }, { width: 980, height: 1324 }, { width: 390, height: 844 }, { width: 320, height: 740 }];
const covers = ['depth-based-distance-estimation', 'ai-project-planning-assistant', 'healthcare-document-intelligence', 'browser-search-to-spreadsheet', 'python-ci-workflow-automation', 'resumable-listing-data-extraction'];

async function expectClearLabel(stage, media) {
  const label = stage.locator(':scope > .detection-label');
  const labelBox = await label.boundingBox();
  const mediaBox = await media.boundingBox();
  const stageBox = await stage.boundingBox();
  expect(labelBox.y + labelBox.height, 'the whole edge label clears the media').toBeLessThanOrEqual(mediaBox.y);
  expect(labelBox.x).toBeGreaterThanOrEqual(stageBox.x);
  expect(labelBox.x + labelBox.width).toBeLessThanOrEqual(stageBox.x + stageBox.width);
  await expect(label).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
}

for (const viewport of viewports) {
  for (const slug of covers) {
    test(`cover evidence label clears ${slug} at ${viewport.width}x${viewport.height}`, async ({ page }, testInfo) => {
      await page.setViewportSize(viewport);
      await page.goto(`/project/${slug}/`);
      const images = collectGalleryImages(getCaseStudyBySlug(slug));
      const [source] = images;
      const singleImage = images.length === 1;
      const cover = singleImage ? page.locator('.case-study-cover') : page.getByRole('region', { name: 'Case study images' });
      const stage = cover.locator(singleImage ? '.case-study-cover-stage' : '.case-gallery-stage').first();
      const opener = stage.locator(singleImage ? 'a' : '.case-gallery-open');
      const image = opener.locator('img');
      await expect(image).toHaveAttribute('src', caseStudyDisplaySrc(source));
      await expect(image).toHaveAttribute('alt', source.alt);
      if (singleImage) await expect(opener).toHaveAttribute('href', source.src);
      await expect.poll(() => image.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
      if (source.caption) await expect(cover.locator(singleImage ? 'figcaption' : '.case-gallery-caption')).toHaveText(source.caption);
      await image.scrollIntoViewIfNeeded();
      await opener.focus();
      await expect(opener).toBeFocused();
      if (slug === 'depth-based-distance-estimation') {
        if (process.env.QA_ARTIFACT_SAFE_MODE !== '1') {
          await page.screenshot({ path: testInfo.outputPath(`depth-${viewport.width}x${viewport.height}.png`) });
        }
        expect(await page.evaluate(() => ({ width: innerWidth, height: innerHeight }))).toEqual(viewport);
      }
      await expectClearLabel(stage, image);
      const ratio = await image.evaluate(img => {
        const box = img.getBoundingClientRect();
        return { rendered: box.width / box.height, natural: img.naturalWidth / img.naturalHeight };
      });
      if (singleImage) {
        expect(ratio.rendered).toBeCloseTo(ratio.natural, 2);
      } else {
        await expect(image).toHaveCSS('object-fit', 'contain');
        const bounds = await stage.boundingBox();
        expect(bounds.width / bounds.height).toBeCloseTo(Math.max(4 / 3, source.width / source.height), 1);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await opener.press('Enter');
      if (singleImage) {
        await expect(page).toHaveURL(new URL(source.src, page.url()).href);
        await expect.poll(() => page.locator('img').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
      } else {
        const dialog = page.getByRole('dialog', { name: 'Enlarged case study images' });
        await expect(dialog).toBeVisible();
        const original = dialog.locator('.case-gallery-viewport img');
        await expect(original).toHaveAttribute('src', source.src);
        await expect.poll(() => original.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
        await page.keyboard.press('Escape');
        await expect(dialog).toHaveCount(0);
        await expect(opener).toBeFocused();
      }
    });
  }

  test(`multi-image evidence and keyboard controls stay clear at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/project/invoice-ocr-extraction/');
    const stage = page.locator('.case-gallery-stage').first();
    const opener = stage.locator('.case-gallery-open');
    await expectClearLabel(stage, opener.locator('img'));
    const labelBox = await stage.locator('.detection-label').boundingBox();
    for (const control of await stage.locator('button.case-gallery-arrow').all()) {
      const box = await control.boundingBox();
      expect(box.y).toBeGreaterThan(labelBox.y + labelBox.height);
    }
    await opener.focus();
    await opener.press('ArrowRight');
    await expect(page.locator('.case-gallery-count').first()).toHaveText(`2 of ${collectGalleryImages(getCaseStudyBySlug('invoice-ocr-extraction')).length}`);
    await opener.press('Enter');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expectClearLabel(dialog, dialog.locator('.case-gallery-stage'));
    const dialogLabel = await dialog.locator(':scope > .detection-label').boundingBox();
    const closeButton = await dialog.getByRole('button', { name: 'Close enlarged image' }).boundingBox();
    expect(closeButton.y).toBeGreaterThanOrEqual(dialogLabel.y + dialogLabel.height);
    await expect.poll(() => dialog.locator('.case-gallery-viewport img').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(opener).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
