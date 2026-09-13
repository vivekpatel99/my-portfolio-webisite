import { expect, test } from './qa-test.js';
import { caseStudies, featuredCaseStudies } from '../../src/data/caseStudies.js';

const routes = [
  { path: '/', heading: /Vivek Patel/i },
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

test('multi-image gallery uses bounded previews and loads selected originals on demand', async ({ page }) => {
  const requests = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/project/n8n-openai-data-extraction/');

  const gallery = page.getByRole('region', { name: 'Case study images' });
  const thumbnails = gallery.locator('.case-gallery-thumbnail img');
  await expect(thumbnails).toHaveCount(6);
  for (let i = 0; i < await thumbnails.count(); i++) await thumbnails.nth(i).scrollIntoViewIfNeeded();
  await expect.poll(() => thumbnails.evaluateAll((elements) => elements.every((element) => element.complete && element.naturalWidth > 0))).toBe(true);
  const thumbnailSources = await thumbnails.evaluateAll((elements) => elements.map((element) => element.currentSrc || element.src));
  const thumbnailWidths = await thumbnails.evaluateAll((elements) => elements.map((element) => element.naturalWidth));
  expect(thumbnailWidths.every((width) => width > 0 && width <= 320)).toBe(true);
  expect(thumbnailSources).toEqual([
    '/assets/case-studies/n8n-data-extraction-thumb-bd1dc61ef269.jpg',
    '/assets/case-studies/n8n-data-processor-thumb-a9dbf544caf7.jpg',
    '/assets/case-studies/n8n-excel-to-json-thumb-7d0eae27bff6.jpg',
    '/assets/case-studies/n8n-table-to-json-thumb-a03edc14e212.jpg',
    '/assets/case-studies/n8n-error-handler-thumb-b29fc255b513.jpg',
    '/assets/case-studies/n8n-error-notifier-thumb-8d6d52ea7b4e.jpg',
  ].map((source) => new URL(source, page.url()).href));

  const originals = [
    'n8n-data-extraction.png', 'n8n-data-processor.png', 'n8n-excel-to-json.png',
    'n8n-table-to-json.png', 'n8n-error-handler.png', 'n8n-error-notifier.png',
  ].map((name) => new URL(`/assets/case-studies/${name}`, page.url()).href);
  const requestedOriginals = () => [...new Set(requests.filter((url) => originals.includes(url)))];
  await expect.poll(requestedOriginals).toEqual([originals[0]]);

  await gallery.getByRole('button', { name: 'Show image 2: Data processor routing Excel, CSV and HTML tables' }).click();
  await expect(gallery.locator('.case-gallery-open img')).toHaveAttribute('src', '/assets/case-studies/n8n-data-processor.png');
  await expect.poll(requestedOriginals).toEqual([originals[0], originals[1]]);
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
  await page.getByRole('banner').getByRole('button', { name: /Request Estimate/i }).click();
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
