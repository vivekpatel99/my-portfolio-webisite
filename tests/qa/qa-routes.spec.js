import { caseStudyDisplaySrc, collectGalleryImages, galleryThumbnailSrc } from '../../src/components/CaseStudyGallery.js';
import { expect, test } from './qa-test.js';
import { caseStudies, featuredCaseStudies, ongoingCaseStudies } from '../../src/data/caseStudies.js';
import { containsCaseStudyCopyLeak } from '../case-study-copy.js';

const routes = [
  { path: '/', heading: /Computer Vision & AI Engineer/i },
  { path: '/contact', heading: /Request a Project Estimate/i },
  { path: '/legal', heading: 'Privacy Policy' },
  { path: '/data-policy', heading: 'Cookie Policy' },
  { path: '/case-studies', heading: /Selected Case Studies/i },
  ...caseStudies.map((caseStudy) => ({ path: `/project/${caseStudy.slug}`, heading: caseStudy.title })),
];

test.describe('Route rendering', () => {
  for (const { path, heading } of routes) {
    test(`renders ${path}`, async ({ page }) => {
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(path);
      await expect(page.locator('#main-content')).toBeVisible();
      await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible();
      expect(errors).toEqual([]);
    });
  }
});

const assetDigest = (src) => src.match(/-([a-f0-9]{64})\./)?.[1] ?? '';

const removedBorrowedN8nDigests = [
  'b11f57c86cd2e19c810cc72df7925d1ac3a65c0aabfcdf29a7298f78c5b6dc82',
  '7e992ce1c04c997787f1eb7790f0bc04e59ad3403e5f8c5e227b4d594db7829b',
  '3b3acaaa3beaef9b7c4e2c33ac9ff98b294a28be75d13abbac29af3292599b66',
  'ef68f8fb2060291419713daf3c385f923333fbe87869f5828ada20ba68d3f338',
  'f36fee637d46a13baffb79337b87cb4ac1f7a1a6d29a330be71e4217a1633275',
  'c69906586afbf78dadaadc2e23461c8427034f20808a862cd681cff7189521f9',
  'e542384f4f7532d230440cb9a68e0e7e66d951996959221225633fc5304b08b7',
];

for (const slug of ['depth-based-distance-estimation', 'yolo-computer-vision-optimization', 'n8n-python-ai-agents']) {
  test(`buyer-facing copy for ${slug}`, async ({ page }) => {
    await page.goto(`/project/${slug}/`);
    const main = page.locator('#main-content');
    await expect(main).toBeVisible();
    const copy = await main.innerText();
    const alts = await main.locator('img').evaluateAll((images) => images.map((image) => image.alt));
    const imageLabels = await main.locator('.case-gallery-thumbnail').evaluateAll((buttons) => buttons.map((button) => button.getAttribute('aria-label')));
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(containsCaseStudyCopyLeak([copy, description, ...alts, ...imageLabels].join(' '))).toBe(false);
    expect(containsCaseStudyCopyLeak(await page.content())).toBe(false);
    const staticHtml = await (await page.request.get(`/project/${slug}/`)).text();
    expect(containsCaseStudyCopyLeak(staticHtml)).toBe(false);
    if (slug === 'depth-based-distance-estimation') {
      expect(copy).toContain('A separate navigation module exists in the source but is not called by that loop.');
      expect(copy).toContain('stored reference scale');
      expect(copy).toContain('assumed camera geometry');
      expect(copy).toContain('not a validated measurement system');
      expect(copy).not.toMatch(/uncalibrated/i);
      expect(staticHtml).toContain('6cff31a07362f0483bf43298af0366ffb4c8f40137291202506a8924b0d24957');
      expect(staticHtml).not.toContain('6f27eac0ad723f3f4efd36a0ad81d7893a8410409f1cb841d61cc39c6c0f436e');
    }
    if (slug === 'n8n-python-ai-agents') {
      const images = collectGalleryImages(caseStudies.find((story) => story.slug === slug));
      expect(images.map((image) => assetDigest(image.src))).toEqual([
        '90b4eba309ed1497b89f6652c047139a008d69b03a203adfe3cf51d968325e35',
        '42fdda3bc3ef015e2a296edba808640ac9b0ea347f2e26e8903e1cb5c60ab0a0',
      ]);
      await expect(main.getByRole('button', { name: /^Show image \d+: Representative / })).toHaveCount(0);
      await expect(main.locator('.case-gallery-thumbnail')).toHaveCount(images.length);
      for (const [index, image] of images.entries()) {
        expect(image.alt.startsWith('Representative ')).toBe(false);
        await main.getByRole('button', { name: `Show image ${index + 1}: ${image.alt}`, exact: true }).click();
        await expect(main.locator('.case-gallery-open img')).toHaveAttribute('alt', image.alt);
      }
      expect(copy).toContain('fallback LIMIT 100');
      expect(copy).toContain('do not establish database-enforced read-only access or a maximum row count');
      for (const digest of removedBorrowedN8nDigests) expect(staticHtml).not.toContain(digest);
    }
    if (slug === 'yolo-computer-vision-optimization') {
      expect(copy).toContain('The consumer app and automatic exercise-form scoring require additional work.');
      expect(copy).toContain('it is not a project-wide accuracy score.');
    }
  });
}

test('multi-image gallery uses bounded previews and loads originals only when expanded', async ({ page }) => {
  const requests = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/project/n8n-openai-data-extraction/');

  const gallery = page.getByRole('region', { name: 'Case study images' });
  const images = collectGalleryImages(caseStudies.find((story) => story.slug === 'n8n-openai-data-extraction'));
  const thumbnails = gallery.locator('.case-gallery-thumbnail img');
  await expect(thumbnails).toHaveCount(images.length);
  for (let i = 0; i < await thumbnails.count(); i++) await thumbnails.nth(i).scrollIntoViewIfNeeded();
  await expect.poll(() => thumbnails.evaluateAll((elements) => elements.every((element) => element.complete && element.naturalWidth > 0))).toBe(true);
  const thumbnailSources = await thumbnails.evaluateAll((elements) => elements.map((element) => element.currentSrc || element.src));
  const thumbnailWidths = await thumbnails.evaluateAll((elements) => elements.map((element) => element.naturalWidth));
  expect(thumbnailWidths.every((width) => width > 0 && width <= 320)).toBe(true);
  expect(thumbnailSources).toEqual(images.map((image) => new URL(galleryThumbnailSrc(image), page.url()).href));
  const originals = images.map((image) => new URL(image.src, page.url()).href);
  const requestedOriginals = () => [...new Set(requests.filter((url) => originals.includes(url)))];
  await expect.poll(requestedOriginals).toEqual([]);
  await expect(gallery.locator('.case-gallery-open img')).toHaveAttribute('src', caseStudyDisplaySrc(images[0]));

  await gallery.getByRole('button', { name: `Show image 2: ${images[1].alt}` }).click();
  await expect(gallery.locator('.case-gallery-open img')).toHaveAttribute('src', caseStudyDisplaySrc(images[1]));
  await expect.poll(requestedOriginals).toEqual([]);
  await gallery.getByRole('button', { name: `Enlarge image: ${images[1].alt}` }).click();
  await expect(page.getByRole('dialog').locator('.case-gallery-viewport img')).toHaveAttribute('src', images[1].src);
  await expect.poll(requestedOriginals).toEqual([originals[1]]);
});

test('unknown route renders a noindex 404 page', async ({ page }) => {
  await page.goto('/foo-bar-baz');
  await expect(page).toHaveURL(/\/foo-bar-baz$/);
  await expect(page.getByRole('heading', { name: 'Page Not Found' })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
});

test('invalid project slug renders the 404 page', async ({ page }) => {
  await page.goto('/project/nonexistent-slug');
  await expect(page).toHaveURL(/\/project\/nonexistent-slug/);
  await expect(page.getByRole('heading', { name: 'Page Not Found' })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  await expect(page.getByText(/redirect|message sent/i)).toHaveCount(0);
});

test('uppercase project slug is treated as unknown', async ({ page }) => {
  await page.goto('/project/N8N-OPENAI-DATA-EXTRACTION');
  await expect(page).toHaveURL(/\/project\/N8N-OPENAI-DATA-EXTRACTION/);
  await expect(page.getByRole('heading', { name: 'Page Not Found' })).toBeVisible();
});

test('unknown project slug with a trailing slash is 404', async ({ page }) => {
  await page.goto('/project/nonexistent-slug/');
  await expect(page.getByRole('heading', { name: 'Page Not Found' })).toBeVisible();
});

test('client navigation to an unknown project slug stays on 404', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => window.history.pushState({}, '', '/project/nonexistent-slug'));
  await page.evaluate(() => window.dispatchEvent(new PopStateEvent('popstate')));
  await expect(page).toHaveURL(/\/project\/nonexistent-slug/);
  await expect(page.getByRole('heading', { name: 'Page Not Found' })).toBeVisible();
});

test('bare /project paths render 404', async ({ page }) => {
  for (const path of ['/project', '/project/']) {
    await page.goto(path);
    await expect(page.getByRole('heading', { name: 'Page Not Found' })).toBeVisible();
  }
});

test('header hash nav on same page scrolls to section', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await page.getByRole('navigation').getByRole('link', { name: 'Services', exact: true }).click();
  await expect
    .poll(async () => {
      const el = page.locator('#services');
      const box = await el.boundingBox();
      return box && box.y >= -100 && box.y < 200;
    })
    .toBeTruthy();
});

test('header hash nav from contact page lands on services', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/contact');
  await page.getByRole('navigation').getByRole('link', { name: 'Services', exact: true }).click();
  await expect(page).toHaveURL(/\/(#services)?$/);
  await expect
    .poll(async () => {
      const el = page.locator('#services');
      const box = await el.boundingBox();
      return box && box.y < 300;
    }, { timeout: 5000 })
    .toBeTruthy();
});

test('primary estimate CTA navigates to contact', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await page.getByRole('banner').getByRole('link', { name: /Request Estimate/i }).click();
  await expect(page).toHaveURL(/\/contact/);
});

test('portfolio cards navigate to internal case studies', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/#portfolio');
  await page.locator('#portfolio').scrollIntoViewIfNeeded();
  await expect(page.getByRole('link', { name: /Read case study:/i })).toHaveCount(featuredCaseStudies.length);
  if (featuredCaseStudies.length > 0) {
    const firstFeaturedCard = page.getByRole('link', { name: `Read case study: ${featuredCaseStudies[0].cardTitle || featuredCaseStudies[0].title}`, exact: true });
    await expect(firstFeaturedCard).toBeVisible();
    await firstFeaturedCard.click();
    await expect(page).toHaveURL(new RegExp(`/project/${featuredCaseStudies[0].slug}/?$`));
    await expect(page.getByRole('heading', { name: featuredCaseStudies[0].title, exact: true })).toBeVisible();
  }
});

test('header links to the case studies collection', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await page.getByRole('navigation').getByRole('link', { name: 'Case Studies', exact: true }).click();
  await expect(page).toHaveURL(/\/case-studies\/?$/);
  await expect(page.getByRole('heading', { name: /Selected Case Studies/i })).toBeVisible();
});

test('case studies collection reload preserves route and canonical metadata', async ({ page }) => {
  await page.goto('/case-studies/');
  await expect(page.getByRole('heading', { name: /Selected Case Studies/i })).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://www.vivekapatel.com/case-studies/');
  await page.reload();
  await expect(page).toHaveURL(/\/case-studies\/?$/);
  await expect(page.getByRole('heading', { name: /Selected Case Studies/i })).toBeVisible();
});

test('back navigation restores contact page', async ({ page }) => {
  await page.goto('/');
  await page.goto('/contact');
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
});

test('lazy route shows content after load', async ({ page }) => {
  await page.goto('/contact');
  await expect(page.getByLabel('Full Name *')).toBeVisible();
});


test('ongoing work is discoverable separately from completed delivery', async ({ page }) => {
  await page.goto('/case-studies/');
  await expect(page.getByRole('status')).toHaveText('Showing 6 of 12 case studies');
  await expect(page.locator('article')).toHaveCount(6);
  await page.getByRole('link', { name: '3 prototypes in progress', exact: true }).click();
  await expect(page).toHaveURL(/#in-progress$/);
  const region = page.getByRole('region', { name: 'In progress', exact: true });
  await expect(region).toBeVisible();
  await expect(region.locator('a')).toHaveCount(3);
  await expect(region.locator('time')).toHaveCount(0);
  for (const story of ongoingCaseStudies) {
    await expect(region.locator(`a[href="/project/${story.slug}/"]`)).toContainText(story.title);
    await expect(region.locator(`a[href="/project/${story.slug}/"]`)).toContainText('In progress');
  }
});

for (const story of ongoingCaseStudies) {
  test(`prototype status and return path for ${story.slug}`, async ({ page }) => {
    await page.goto(`/project/${story.slug}/?from=collection`);
    await expect(page.locator('.case-study-status')).toHaveText('In progress');
    await expect(page.locator('.case-study-article time')).toHaveCount(0);
    const back = page.locator('a[href="/case-studies/#in-progress"]').first();
    await expect(back).toBeVisible();
    await back.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/case-studies\/#in-progress$/);
    const region = page.getByRole('region', { name: 'In progress', exact: true });
    await expect(region).toBeVisible();
    await expect.poll(async () => (await region.boundingBox())?.y).toBeGreaterThanOrEqual(60);
    await expect.poll(async () => (await region.boundingBox())?.y).toBeLessThan(180);
    await expect(region).toBeFocused();
    const staticHtml = await (await page.request.get(`/project/${story.slug}/`)).text();
    expect(staticHtml).toContain('href="/case-studies/#in-progress"');
  });
}
