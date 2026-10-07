import { expect, test } from './qa-test.js';
import { getCaseStudyBySlug } from '../../src/data/caseStudies.js';
import { caseStudyDisplaySrc, collectGalleryImages } from '../../src/components/CaseStudyGallery.js';

const viewports = [{ width: 1440, height: 900 }, { width: 980, height: 1324 }, { width: 390, height: 844 }, { width: 320, height: 740 }];
const covers = ['depth-based-distance-estimation', 'ai-project-planning-assistant', 'healthcare-document-intelligence'];

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
    test(`standalone evidence label clears ${slug} at ${viewport.width}x${viewport.height}`, async ({ page }, testInfo) => {
      await page.setViewportSize(viewport);
      await page.goto(`/project/${slug}/`);
      const cover = page.locator('.case-study-cover');
      const stage = cover.locator('.case-study-cover-stage');
      const image = cover.locator('img');
      const [source] = collectGalleryImages(getCaseStudyBySlug(slug));
      await expect(image).toHaveAttribute('src', caseStudyDisplaySrc(source));
      await expect(image).toHaveAttribute('alt', source.alt);
      await expect(cover.locator('a')).toHaveAttribute('href', source.src);
      await expect.poll(() => image.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
      if (source.caption) await expect(cover.locator('figcaption')).toHaveText(source.caption);
      await image.scrollIntoViewIfNeeded();
      await cover.locator('a').focus();
      await expect(cover.locator('a')).toBeFocused();
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
      expect(ratio.rendered).toBeCloseTo(ratio.natural, 2);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await cover.locator('a').press('Enter');
      await expect(page).toHaveURL(new URL(source.src, page.url()).href);
      await expect.poll(() => page.locator('img').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
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
    await expect(page.locator('.case-gallery-count').first()).toHaveText('2 of 2');
    await opener.press('Enter');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expectClearLabel(dialog, dialog.locator('.case-gallery-stage'));
    await expect.poll(() => dialog.locator('.case-gallery-viewport img').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(opener).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
