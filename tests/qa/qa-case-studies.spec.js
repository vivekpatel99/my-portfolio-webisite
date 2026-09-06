import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { caseStudies } from '../../src/data/caseStudies.js';

// Passive acceptance: no form submissions, marketplace navigation, or backend writes.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('cookie_consent_preferences', JSON.stringify({
    essential: true, analytics: false, sentry: false, decidedAt: new Date().toISOString(),
  })));
});

for (const study of caseStudies) {
  test(`${study.slug}: deep story, keyboard, accessibility, metadata and visual`, async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`/project/${study.slug}/`);
    await expect(page.locator('main h1')).toHaveText(study.title);
    await expect(page.locator('main')).toHaveCount(1);
    for (const heading of ['Situation', 'Constraints', 'Design decisions', 'Approach', 'Evidence', 'Result', 'Limitations', 'Related experience']) {
      await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
    }
    await expect(page.locator('main figure figcaption').first()).toBeVisible();
    await expect(page.locator('video, audio, [autoplay]')).toHaveCount(0);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://www.vivekapatel.com/project/${study.slug}/`);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', study.summary);
    const evidenceLink = page.locator('main nav').getByRole('link', { name: 'Evidence', exact: true });
    await evidenceLink.focus();
    await expect(evidenceLink).toBeFocused();
    await evidenceLink.press('Enter');
    await expect(page).toHaveURL(/#evidence$/);
    await expect.poll(async () => (await page.getByRole('heading', { name: 'Evidence', exact: true }).boundingBox())?.y).toBeGreaterThanOrEqual(0);
    const audit = await new AxeBuilder({ page }).include('main').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(audit.violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(errors).toEqual([]);
    await page.evaluate(() => window.scrollTo(0, 0));
    const screenshot = testInfo.outputPath(`${study.slug}.png`);
    await page.screenshot({ path: screenshot, fullPage: true, animations: 'disabled' });
    await testInfo.attach(`${study.slug} — ${testInfo.project.name}`, { path: screenshot, contentType: 'image/png' });
  });

  test(`${study.slug}: 320px reflow`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/project/${study.slug}/`);
    await expect(page.locator('main h1')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}

for (const slug of ['withheld-case-study', 'nonexistent-gate2-study']) {
  test(`${slug}: direct and client navigation stay unavailable and noindex`, async ({ page }) => {
    await page.goto(`/project/${slug}/`);
    await expect(page.getByRole('heading', { name: 'Page Not Found' })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
    await page.goto('/');
    await expect(page.locator(`a[href*="/project/${slug}"]`)).toHaveCount(0);
    await page.evaluate((nextSlug) => {
      window.history.pushState({}, '', `/project/${nextSlug}/`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, slug);
    await expect(page.getByRole('heading', { name: 'Page Not Found' })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  });
}
