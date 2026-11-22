import { expect, test } from './qa-test.js';
import { translatedRoutePairs } from '../../src/lib/localizedRoutes.js';
import { absoluteUrl } from '../../src/lib/seoConfig.js';
import { caseStudySlugs } from '../../src/data/caseStudies.js';

test.skip(process.env.QA_LOCAL_ONLY !== '1', 'Language acceptance requires a loopback build preview.');

const withSlash = (route) => route === '/' ? route : `${route}/`;

test('all translated pairs have reciprocal static metadata, headings, and switch links', async ({ request }) => {
  const sitemap = await (await request.get('/sitemap.xml')).text();
  for (const pair of translatedRoutePairs) {
    for (const locale of ['en', 'de']) {
      const path = pair[locale];
      const counterpart = locale === 'en' ? 'de' : 'en';
      const response = await request.get(withSlash(path));
      expect(response.status(), path).toBe(200);
      const html = await response.text();
      expect(html).toContain(`<html lang="${locale}">`);
      expect(html).toContain(`rel="canonical" href="${absoluteUrl(path)}"`);
      const head = html.split('</head>')[0];
      for (const language of ['en', 'de', 'x-default']) {
        const url = absoluteUrl(pair[language === 'x-default' ? 'en' : language]);
        expect(head).toContain(`rel="alternate" hreflang="${language}" href="${url}"`);
        expect(head.match(new RegExp(`hreflang="${language}"`, 'g'))).toHaveLength(1);
      }
      expect(html.match(/<h1\b/g)).toHaveLength(1);
      const target = withSlash(pair[counterpart]);
      expect(html).toMatch(new RegExp(`<a\\b(?=[^>]*href="${target}")(?=[^>]*lang="${counterpart}")[^>]*>`));
      expect(sitemap).toContain(`<loc>${absoluteUrl(path)}</loc>`);
    }
  }
  for (const slug of caseStudySlugs) expect(sitemap).not.toContain(`/de/project/${slug}/`);
});

test('mobile keyboard switching preserves a query and section anchor through Back', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    localStorage.setItem('cookie_consent_preferences', JSON.stringify({ necessary: true, analytics: false }));
  });
  await page.goto('/?utm_source=qa#services');
  const toggle = page.locator('header button[aria-controls="mobile-menu"]');
  await toggle.focus();
  await page.keyboard.press('Enter');
  const menu = page.getByRole('dialog', { name: 'Navigation menu' });
  await expect(menu.getByRole('button', { name: 'Close navigation menu' })).toBeFocused();
  const germanLink = menu.getByRole('link', { name: 'Deutsch' });
  for (let step = 0; step < 5; step += 1) await page.keyboard.press('Tab');
  await expect(germanLink).toBeFocused();
  await expect(germanLink).toHaveAttribute('href', '/de/?utm_source=qa#services');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/de\/\?utm_source=qa#services$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', absoluteUrl('/de'));
  await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute('href', absoluteUrl('/'));
  await expect(page.locator('#services')).toBeFocused();
  await expect(menu).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
  await page.goBack();
  await expect(page).toHaveURL(/\/\?utm_source=qa#services$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('#services')).toBeFocused();
});

test('a German case card opens the English article and can return to its German collection', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('cookie_consent_preferences', JSON.stringify({ necessary: true, analytics: false }));
  });
  await page.goto('/de/case-studies/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('FALLSTUDIEN');
  const article = page.getByRole('link', { name: /Fallstudie auf Englisch/ }).first();
  await expect(article).toHaveAttribute('hreflang', 'en');
  await article.click();
  await expect(page).toHaveURL(/\/project\/[^/]+\//);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  const returnLink = page.getByRole('link', { name: 'Fallstudien auf Deutsch' });
  await expect(returnLink).toHaveAttribute('href', '/de/case-studies/?resume=1');
  await returnLink.click();
  await expect(page).toHaveURL(/\/de\/case-studies\//);
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
});

test.describe('German direct visits without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('the native mobile menu switches to the counterpart and German contact has an email fallback', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto('/de/contact/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/KOSTEN FÜR IHR PROJEKT/);
    await expect(page.getByRole('heading', { name: 'Projektdetails per E-Mail senden' })).toBeVisible();
    await expect(page.locator('#main-content a[href^="mailto:"]').first()).toBeVisible();
    await expect(page.locator('form')).toHaveCount(0);
    await page.locator('header summary').click();
    await page.getByRole('navigation', { name: 'Navigationsmenü' }).getByRole('link', { name: 'English' }).click();
    await expect(page).toHaveURL(/\/contact\/$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });
});
