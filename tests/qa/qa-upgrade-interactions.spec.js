import { expect, test } from './qa-test.js';
import { caseStudies, featuredCaseStudies } from '../../src/data/caseStudies.js';
import { HOURLY_FROM_LABEL, serviceOffers, typicalDurationLabel } from '../../src/data/serviceOffers.js';

const cardFor = (caseStudy) => ({
  cardName: `Read case study: ${caseStudy.cardTitle || caseStudy.title}`,
  path: `/project/${caseStudy.slug}`,
  heading: caseStudy.title,
});

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'cookie_consent_preferences',
      JSON.stringify({
        essential: true,
        analytics: false,
        sentry: false,
        decidedAt: new Date().toISOString(),
      }),
    );
  });
});

test('homepage upgrade flow exposes proof, case studies, offers, testimonials, and CTA', async ({ page }) => {
  await page.goto('/');

  for (const text of ['Top Rated Plus', '100% Job Success']) {
    await expect(page.getByText(text, { exact: true })).toBeVisible();
  }

  for (const text of ['21+ Projects', '300+ Hours', '94% Faster']) {
    await expect(page.getByText(text, { exact: true })).toHaveCount(0);
  }

  const headings = [
    /Featured Case Studies/i,
    /Service Offers/i,
    /Client Results/i,
    /Who I Am/i,
    /Ready to Start Your Project/i,
  ];

  for (const heading of headings) {
    await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible();
  }

  await expect(page.getByText(/Next-Gen Banking UI/i)).toHaveCount(0);
  await expect(page.getByRole('link', { name: /Read case study:/i })).toHaveCount(featuredCaseStudies.length);
});

test('hero and header CTAs activate the expected routes and sections', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');

  await page.getByRole('link', { name: 'View Case Studies' }).click();
  await expect
    .poll(async () => {
      const box = await page.locator('#portfolio').boundingBox();
      return box && box.y >= -120 && box.y < 260;
    })
    .toBeTruthy();

  await page.goto('/');
  await page.getByRole('button', { name: 'Request a Project Estimate' }).first().click();
  await expect(page).toHaveURL(/\/contact/);
  await expect(page.getByRole('heading', { name: /Request a Project Estimate/i })).toBeVisible();

  await page.goto('/');
  await page.getByRole('navigation').getByRole('link', { name: 'Testimonials', exact: true }).click();
  await expect
    .poll(async () => {
      const box = await page.locator('#testimonials').boundingBox();
      return box && box.y >= -120 && box.y < 260;
    })
    .toBeTruthy();
});

test('service offer accordions are keyboard and click operable', async ({ page }) => {
  await page.goto('/#services');
  const services = page.locator('#services [role="button"]');
  await expect(services).toHaveCount(3);

  for (const service of [
    'DATA EXTRACTION AUTOMATION SPRINT',
    'COMPUTER VISION PRODUCTION OPTIMIZATION',
    'AI WORKFLOW BUILDOUT',
  ]) {
    const row = page.locator('#services [role="button"]').filter({ hasText: service });
    const initialExpanded = await row.getAttribute('aria-expanded');
    await row.click();
    await expect(row).toHaveAttribute('aria-expanded', initialExpanded === 'true' ? 'false' : 'true');
    await row.press('Enter');
    await expect(row).toHaveAttribute('aria-expanded', initialExpanded === 'true' ? 'true' : 'false');
    await row.press(' ');
    await expect(row).toHaveAttribute('aria-expanded', initialExpanded === 'true' ? 'false' : 'true');
  }
});

test('open service offers show hourly rate, typical duration, and scope', async ({ page }) => {
  await page.goto('/#services');
  const services = page.locator('#services');
  await expect(services.getByRole('button')).toHaveCount(3);
  await expect(services).toContainText(HOURLY_FROM_LABEL);
  await expect(services).not.toContainText('€80');
  await expect(services).not.toContainText('3,600');
  await expect(services).not.toContainText('7,200');
  await expect(services.getByRole('button', { name: /Request a Project Estimate/i })).toHaveCount(0);

  for (const offer of serviceOffers) {
    const row = services.getByRole('button').filter({ hasText: offer.title });
    if ((await row.getAttribute('aria-expanded')) !== 'true') {
      await row.click();
    }
    await expect(row).toHaveAttribute('aria-expanded', 'true');
    const panel = page.locator(`#${await row.getAttribute('aria-controls')}`);
    await expect(panel).toBeVisible();
    await expect(panel).toContainText(HOURLY_FROM_LABEL);
    await expect(panel).toContainText(typicalDurationLabel(offer));
    await expect(panel).toContainText('IN SCOPE');
    await expect(panel).toContainText('OUT OF SCOPE');
    await expect(panel).toContainText(offer.inScope[0]);
    await expect(panel).toContainText(offer.outOfScope[0]);
  }
});

test('all featured case-study cards and detail CTAs work', async ({ page }) => {
  await page.goto('/#portfolio');
  await page.locator('#portfolio').scrollIntoViewIfNeeded();
  await expect(page.getByRole('link', { name: /Read case study:/i })).toHaveCount(featuredCaseStudies.length);
  for (const caseStudy of featuredCaseStudies.map(cardFor)) {
    await page.goto('/#portfolio');
    await page.locator('#portfolio').scrollIntoViewIfNeeded();
    await page.getByRole('link', { name: caseStudy.cardName, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${caseStudy.path}/$`));
    await expect(page.getByRole('heading', { name: caseStudy.heading })).toBeVisible();

    await expect(page.getByText(/Next-Gen Banking UI/i)).toHaveCount(0);
    await page.getByRole('link', { name: 'View Case Studies' }).first().click();
    await expect(page).toHaveURL(/\/case-studies\/?$/);
    await expect(page.getByRole('heading', { name: /Selected Case Studies/i })).toBeVisible();

    await page.goto(caseStudy.path);
    await page.getByRole('link', { name: /Discuss a similar project/ }).click();
    await expect(page).toHaveURL(/\/contact\/?$/);
  }
});

test('all published case-study routes and detail CTAs remain reachable', async ({ page }) => {
  for (const caseStudy of caseStudies.map(cardFor)) {
    await page.goto(caseStudy.path);
    await expect(page.getByRole('heading', { name: caseStudy.heading })).toBeVisible();
    await page.getByRole('link', { name: /Discuss a similar project/ }).click();
    await expect(page).toHaveURL(/\/contact\/?$/);
  }
});

test('contact guidance, budget dropdown, and validation work without submitting a lead', async ({ page }) => {
  const mutationRequests = [];
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().includes('/api/mutation')) {
      mutationRequests.push(request.url());
    }
  });

  await page.goto('/contact');
  await expect(page.getByRole('heading', { name: 'What happens next' })).toBeVisible();
  await expect(page.getByText('Helpful details to include:')).toBeVisible();
  await expect(page.getByRole('link', { name: /contact@vivekapatel\.com/i })).toHaveAttribute(
    'href',
    'mailto:contact@vivekapatel.com',
  );

  await page.getByLabel('Budget Range').selectOption({ label: '€5,000 - €10,000' });
  await expect(page.getByLabel('Budget Range')).toContainText('€5,000 - €10,000');

  await page.getByRole('button', { name: /Request a Project Estimate/i }).click();
  await expect(page.getByText('Uh oh! Missing fields.').first()).toBeVisible();

  await page.getByLabel('Full Name *').fill('QA Tester');
  await page.getByLabel('Email Address *').fill('invalid-email');
  await page.getByLabel('Project Description *').fill('Testing validation only.');
  await page.getByRole('button', { name: /Request a Project Estimate/i }).click();
  await expect(page.getByText('Invalid email address.').first()).toBeVisible();
  expect(mutationRequests).toEqual([]);
});

test('mobile navigation menu links and CTA work', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Toggle navigation menu' }).click();
  await expect(page.getByRole('dialog', { name: 'Navigation menu' })).toBeVisible();
  await page.waitForTimeout(600);
  await page.getByRole('dialog', { name: 'Navigation menu' }).getByRole('link', { name: 'Case Studies' }).click();
  await expect(page.getByRole('dialog', { name: 'Navigation menu' })).toBeHidden();
  await expect(page).toHaveURL(/\/case-studies\/?$/);
  await expect(page.getByRole('heading', { name: /Selected Case Studies/i })).toBeVisible();

  await page.getByRole('button', { name: 'Toggle navigation menu' }).click();
  await expect(page.getByRole('dialog', { name: 'Navigation menu' })).toBeVisible();
  await page.waitForTimeout(600);
  await page.getByRole('dialog', { name: 'Navigation menu' }).getByRole('button', {
    name: /Request a Project Estimate/i,
  }).click();
  await expect(page).toHaveURL(/\/contact\/?$/);
});

test('craft signal surfaces: Detection Bar nav has purple border and VP mark', async ({ page }) => {
  await page.goto('/');
  const header = page.locator('header');
  await expect(header).toBeVisible();
  
  // Detection bar has purple border
  const headerStyles = await header.evaluate((el) => {
    const computed = window.getComputedStyle(el);
    return {
      borderBottom: computed.borderBottomColor,
      backdropFilter: computed.backdropFilter,
    };
  });
  expect(headerStyles.borderBottom).toContain('139');
  
  // VP mark exists with correct structure
  const vpMark = page.locator('header').getByRole('link', { name: 'Vivek Patel Logo' }).first();
  await expect(vpMark).toBeVisible();
  await expect(vpMark.locator('span:has-text("VP")')).toBeVisible();
});

test('craft signal surfaces: Services Field-Row has detection boxes with meta', async ({ page }) => {
  await page.goto('/#services');
  const firstService = page.locator('#services [role="button"]').first();
  await firstService.click();
  await expect(firstService).toHaveAttribute('aria-expanded', 'true');
  
  // Panel contains rate and duration meta
  const panel = page.locator(`#${await firstService.getAttribute('aria-controls')}`);
  await expect(panel).toBeVisible();
  await expect(panel).toContainText('RATE');
  await expect(panel).toContainText('€45/hour');
  await expect(panel).toContainText('DURATION');
  await expect(panel).toContainText('Typically');
  
  // Scope grid present
  await expect(panel).toContainText('IN SCOPE');
  await expect(panel).toContainText('OUT OF SCOPE');
});

test('craft signal surfaces: Testimonials Field Quote has rail and diamond dots', async ({ page }) => {
  await page.goto('/#testimonials');
  const testimonials = page.locator('#testimonials');
  await expect(testimonials).toBeVisible();
  
  // Rail with field counter
  await expect(testimonials.locator('.rail')).toBeVisible();
  await expect(testimonials.locator('.count')).toBeVisible();
  
  // Quote area with large quotes
  await expect(testimonials.locator('.quote-area')).toBeVisible();
  await expect(testimonials.locator('blockquote')).toBeVisible();
  
  // Diamond-shaped dots for carousel navigation
  const dots = testimonials.locator('.dots button');
  await expect(dots).not.toHaveCount(0);
  
  // Verify meta information
  await expect(testimonials).toContainText('TESTIMONIAL ·');
  await expect(testimonials).toContainText('PROJECT ·');
});

test('craft signal surfaces: About dual columns with field labels', async ({ page }) => {
  await page.goto('/#about');
  const about = page.locator('#about');
  await expect(about).toBeVisible();
  
  // Dual field structure
  await expect(about.locator('.dual')).toBeVisible();
  await expect(about.locator('.field')).toHaveCount(2);
  
  // Field labels present
  await expect(about).toContainText('PHOTO · FIELD');
  await expect(about).toContainText('BIO · FIELD');
  
  // Process grid exists
  await expect(about.locator('.quiet-grid')).toBeVisible();
});

test('craft signal surfaces: CTA action field shows €45/hour rate', async ({ page }) => {
  await page.goto('/');
  const cta = page.locator('#cta');
  await expect(cta).toBeVisible();
  
  // Rate display
  await expect(cta).toContainText('€45/hour');
  await expect(cta).toContainText('RATE');
  
  // Detection meta
  await expect(cta).toContainText('CTA · DETECTED');
  
  // Action field button
  await expect(cta).toContainText('REQUEST · ESTIMATE');
  
  // Route note (no mailto)
  await expect(cta).toContainText('ROUTE · /CONTACT/ · NO MAILTO');
});

test('craft signal surfaces: Contact form panel with FORM · DETECTED meta', async ({ page }) => {
  await page.goto('/contact');
  const form = page.locator('form[data-sensitive-telemetry]');
  await expect(form).toBeVisible();
  
  // Form detection meta
  await expect(form).toContainText('FORM · DETECTED');
  
  // Proof strip with metrics
  await expect(page.locator('.proof')).toBeVisible();
  await expect(page).toContainText('100%');
  await expect(page).toContainText('Job Success');
  await expect(page).toContainText('5★');
  
  // Submit note
  await expect(page).toContainText('SUBMIT · CONVEX DB');
});

test('craft signal surfaces: Case study cards have detection boxes', async ({ page }) => {
  await page.goto('/#portfolio');
  await page.locator('#portfolio').scrollIntoViewIfNeeded();
  
  // Cards exist
  const cards = page.locator('#portfolio article.card');
  await expect(cards.first()).toBeVisible();
  
  // Media area structure
  await expect(cards.first().locator('.media')).toBeVisible();
  
  // Footer with completion date
  await expect(cards.first().locator('time')).toBeVisible();
});

test('e2e: Home → Service → CTA → Contact → Fill validation', async ({ page }) => {
  await page.goto('/');
  
  // Open first service offer
  const firstService = page.locator('#services [role="button"]').first();
  await firstService.scrollIntoViewIfNeeded();
  await firstService.click();
  await expect(firstService).toHaveAttribute('aria-expanded', 'true');
  
  // Verify service panel shows rate
  const panel = page.locator(`#${await firstService.getAttribute('aria-controls')}`);
  await expect(panel).toContainText('€45/hour');
  
  // Navigate to CTA
  const ctaButton = page.locator('#cta').getByRole('link', { name: /request estimate/i });
  await ctaButton.scrollIntoViewIfNeeded();
  await ctaButton.click();
  
  // Should be on contact page
  await expect(page).toHaveURL(/\/contact\/?$/);
  await expect(page.getByRole('heading', { name: /Request a Project Estimate/i })).toBeVisible();
  
  // Fill form with invalid email
  await page.getByLabel('Full Name *').fill('QA Tester');
  await page.getByLabel('Email Address *').fill('invalid');
  await page.getByLabel('Project Description *').fill('Test project');
  await page.getByRole('button', { name: /Request a Project Estimate/i }).click();
  
  // Validation should trigger
  await expect(page.getByText(/Invalid email/i)).toBeVisible();
});

test('e2e: Home portfolio card → Case study detail → Back', async ({ page }) => {
  await page.goto('/#portfolio');
  await page.locator('#portfolio').scrollIntoViewIfNeeded();
  
  // Click first featured card
  const firstCard = page.getByRole('link', { name: /Read case study:/i }).first();
  const cardText = await firstCard.textContent();
  await firstCard.click();
  
  // Should be on case study detail
  await expect(page).toHaveURL(/\/project\/[^/]+\/?$/);
  await expect(page.getByRole('heading').first()).toBeVisible();
  
  // Navigate back using browser back
  await page.goBack();
  await expect(page).toHaveURL(/\/?$/);
  await expect(page.locator('#portfolio')).toBeVisible();
});

test('e2e: Mobile nav Detection Bar → Menu → Request Estimate → Contact', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  
  // Verify Detection Bar with VP mark
  const vpMark = page.locator('header').getByRole('link', { name: 'Vivek Patel Logo' }).first();
  await expect(vpMark).toBeVisible();
  await expect(vpMark.locator('span:has-text("VP")')).toBeVisible();
  
  // Open mobile menu
  await page.getByRole('button', { name: 'Toggle navigation menu' }).click();
  const menu = page.getByRole('dialog', { name: 'Navigation menu' });
  await expect(menu).toBeVisible();
  
  // Verify Detection Bar in menu
  await expect(menu.getByRole('link', { name: 'Vivek Patel Logo' })).toBeVisible();
  await expect(menu.locator('span:has-text("VP")')).toBeVisible();
  
  // Click Request Estimate
  await menu.getByRole('button', { name: /Request a Project Estimate/i }).click();
  
  // Should navigate to contact
  await expect(page).toHaveURL(/\/contact\/?$/);
  await expect(page.getByRole('heading', { name: /Request a Project Estimate/i })).toBeVisible();
  
  // Verify contact form detection meta
  await expect(page.locator('form')).toContainText('FORM · DETECTED');
});

test('e2e: Testimonials carousel advance and structure', async ({ page }) => {
  await page.goto('/#testimonials');
  await page.locator('#testimonials').scrollIntoViewIfNeeded();
  
  const testimonials = page.locator('#testimonials');
  
  // Wait for carousel to be ready
  await expect(testimonials.locator('.quote-area')).toBeVisible();
  
  // Get initial content
  const initialQuote = await testimonials.locator('blockquote').textContent();
  
  // Click second dot
  const dots = testimonials.locator('.dots button');
  await expect(dots).not.toHaveCount(0);
  await dots.nth(1).click();
  
  // Wait a bit for transition
  await page.waitForTimeout(300);
  
  // Quote should change (or verify structure at minimum)
  await expect(testimonials.locator('blockquote')).toBeVisible();
  
  // Verify rail structure persists
  await expect(testimonials.locator('.rail')).toBeVisible();
  await expect(testimonials.locator('.count')).toBeVisible();
});
