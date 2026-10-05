import { expect, test } from './qa-test.js';
import {
  caseStudies,
  collectionCaseStudies,
  featuredCaseStudies,
} from '../../src/data/caseStudies.js';
import { HOURLY_FROM_LABEL, serviceOffers, serviceTimelineLabel } from '../../src/data/serviceOffers.js';

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

  await page.getByRole('link', { name: 'View Case Studies', exact: true }).click();
  await expect
    .poll(async () => {
      const box = await page.locator('#portfolio').boundingBox();
      return box && box.y >= -120 && box.y < 260;
    })
    .toBeTruthy();

  await page.goto('/');
  await page.getByRole('link', { name: 'Request a Project Estimate' }).first().click();
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

test('service cards have working keyboard and click scope links', async ({ page }) => {
  await page.goto('/#services');
  const services = page.locator('#services');
  await expect(services.getByRole('article')).toHaveCount(serviceOffers.length);
  await expect(services.locator('[aria-expanded]')).toHaveCount(0);
  await expect(services).toBeFocused();

  const firstLink = services.getByRole('article', { name: serviceOffers[0].title }).getByRole('link', { name: /Scope details/i });
  await firstLink.focus();
  await firstLink.press('Enter');
  await expect(page).toHaveURL(new RegExp(`/services/${serviceOffers[0].id}/?$`));

  await page.goto('/#services');
  const secondLink = page.locator('#services').getByRole('article', { name: serviceOffers[1].title }).getByRole('link', { name: /Scope details/i });
  await secondLink.click();
  await expect(page).toHaveURL(new RegExp(`/services/${serviceOffers[1].id}/?$`));
  await expect(page.getByRole('heading', { name: serviceOffers[1].title })).toBeVisible();
  await expect(page.locator('main')).toContainText('Timeline scoped per project');
  await expect(page.locator('main')).toContainText('Build or fine-tune a model');
});

test('service cards show summary, timeline, and rate without opening', async ({ page }) => {
  await page.goto('/#services');
  const services = page.locator('#services');
  await expect(services.getByRole('article')).toHaveCount(serviceOffers.length);
  await expect(services).toContainText(HOURLY_FROM_LABEL);
  await expect(services).not.toContainText('€80');
  await expect(services).not.toContainText('3,600');
  await expect(services).not.toContainText('7,200');
  await expect(services.getByRole('button', { name: /Request a Project Estimate/i })).toHaveCount(0);

  for (const offer of serviceOffers) {
    const card = services.getByRole('article', { name: offer.title });
    await expect(card).toBeVisible();
    await expect(card.getByRole('heading', { name: offer.title })).toBeVisible();
    await expect(card).toContainText(offer.summary.split(/(?<=\.)\s+/)[0]);
    await expect(card).toContainText(HOURLY_FROM_LABEL);
    await expect(card).toContainText(serviceTimelineLabel(offer));
    await expect(card).not.toContainText(offer.inScope[0]);
    await expect(card.getByRole('link', { name: /Scope details/i })).toHaveAttribute('href', `/services/${offer.id}`);
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

  await page.getByRole('button', { name: /Send project request/i }).click();
  await expect(page.getByText('Uh oh! Missing fields.').first()).toBeVisible();

  await page.getByLabel('Full Name *').fill('QA Tester');
  await page.getByLabel('Email Address *').fill('invalid-email');
  await page.getByLabel('Project Description *').fill('Testing validation only.');
  await page.getByRole('button', { name: /Send project request/i }).click();
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
  await page.getByRole('dialog', { name: 'Navigation menu' }).getByRole('link', {
    name: /Request a Project Estimate/i,
  }).click();
  await expect(page).toHaveURL(/\/contact\/?$/);
});

test('Detection Bar keeps its purple border and configured logo', async ({ page }) => {
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
  
  // The configured logo is exposed through the home link.
  const vpMark = page.locator('header').getByRole('link', { name: 'Vivek Patel home' }).first();
  await expect(vpMark).toBeVisible();
  await expect(vpMark.locator('img')).toHaveAttribute('src', '/assets/logos/mylogo-60-c6065baa4d50.webp');
});

test('craft signal surfaces: Services cards keep offer markers and metadata', async ({ page }) => {
  await page.goto('/#services');
  const firstService = page.locator('#services article').first();
  await expect(firstService.getByText(/SERVICE · OFFER \d+/i)).toBeVisible();
  await expect(firstService.locator('dt').filter({ hasText: /^Rate/ })).toBeVisible();
  await expect(firstService).toContainText('€45/hour');
  await expect(firstService.locator('dt').filter({ hasText: /^Timeline/ })).toBeVisible();
  await expect(firstService).toContainText('Typically');
  await expect(firstService.getByRole('link', { name: /Scope details/i })).toBeVisible();
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

test('About keeps two information columns and the process grid', async ({ page }) => {
  await page.goto('/#about');
  const about = page.locator('#about');
  await expect(about).toBeVisible();
  
  // Dual field structure
  await expect(about.locator('.dual')).toBeVisible();
  await expect(about.locator('.field')).toHaveCount(2);
  
  await expect(about).toContainText('BIO · FIELD');
  
  // Process grid exists
  await expect(about.locator('.quiet-grid')).toBeVisible();
});

test('CTA shows its starting rate and estimate link', async ({ page }) => {
  await page.goto('/');
  const cta = page.locator('#cta');
  await expect(cta).toBeVisible();
  
  // Rate display
  await expect(cta).toContainText('€45/hour');
  await expect(cta).toContainText('RATE');
  
  await expect(cta.getByRole('heading', { name: /Ready to start your project/i })
    .getByText('Project inquiry', { exact: true })).toBeVisible();
  
  // Action field button
  await expect(cta).toContainText('REQUEST · ESTIMATE');
  
  await expect(cta.getByRole('link', { name: /request a project estimate/i })).toBeVisible();
});

test('Contact form labels the form and submit action', async ({ page }) => {
  await page.goto('/contact');
  const form = page.locator('form[data-sensitive-telemetry]');
  await expect(form).toBeVisible();
  
  // Form detection meta
  await expect(form.getByText('CONTACT · DETECTED', { exact: true })).toBeVisible();
  
  // Proof strip with metrics
  const proof = page.locator('.proof');
  await expect(proof).toBeVisible();
  await expect(proof.getByText('100%', { exact: true })).toBeVisible();
  await expect(proof.getByText(/Job Success/i)).toBeVisible();
  await expect(proof.getByText('5★', { exact: true })).toBeVisible();
  
  await expect(form.getByRole('button', { name: 'Send project request' })).toBeVisible();
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
  const firstService = page.locator('#services article').first();
  await firstService.scrollIntoViewIfNeeded();
  await expect(firstService).toContainText('€45/hour');
  await firstService.getByRole('link', { name: /Scope details/i }).click();
  await expect(page).toHaveURL(/\/services\/data-extraction-automation-sprint\/?$/);
  await expect(page.getByRole('heading', { name: 'In scope' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Out of scope' })).toBeVisible();
  await page.getByRole('link', { name: /Request a Project Estimate/i }).click();
  await expect(page).toHaveURL(/\/contact\/?$/);
  await expect(page.getByRole('heading', { name: /Request a Project Estimate/i })).toBeVisible();

  await page.getByLabel('Full Name *').fill('QA Tester');
  await page.getByLabel('Email Address *').fill('invalid');
  await page.getByLabel('Project Description *').fill('Test project');
  await page.getByRole('button', { name: /Send project request/i }).click();
  await expect(page.getByText('Invalid email address.', { exact: true })).toBeVisible();
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

test('e2e: Mobile nav → Menu → Request Estimate → Contact', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  
  // Verify the configured logo in the header.
  const vpMark = page.locator('header').getByRole('link', { name: 'Vivek Patel home' }).first();
  await expect(vpMark).toBeVisible();
  await expect(vpMark.locator('img')).toHaveAttribute('src', '/assets/logos/mylogo-60-c6065baa4d50.webp');
  
  // Open mobile menu
  await page.getByRole('button', { name: 'Toggle navigation menu' }).click();
  const menu = page.getByRole('dialog', { name: 'Navigation menu' });
  await expect(menu).toBeVisible();
  
  // Verify the configured logo in the open menu.
  const menuLogo = menu.getByRole('link', { name: 'Vivek Patel home' });
  await expect(menuLogo).toBeVisible();
  await expect(menuLogo.locator('img')).toHaveAttribute('src', '/assets/logos/mylogo-60-c6065baa4d50.webp');
  
  // Click Request Estimate
  await menu.getByRole('link', { name: /Request a Project Estimate/i }).click();
  
  // Should navigate to contact
  await expect(page).toHaveURL(/\/contact\/?$/);
  await expect(page.getByRole('heading', { name: /Request a Project Estimate/i })).toBeVisible();
  
  // Verify contact form detection meta
  await expect(page.locator('form')).toContainText('CONTACT · DETECTED');
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
  
  // Quote should change
  await expect(testimonials.locator('blockquote')).not.toHaveText(initialQuote ?? '');
  await expect(testimonials.locator('blockquote')).toBeVisible();
  
  // Verify rail structure persists
  await expect(testimonials.locator('.rail')).toBeVisible();
  await expect(testimonials.locator('.count')).toBeVisible();
});

const collectionReturnLink = (page) => page
  .getByRole('navigation', { name: 'Case study navigation' })
  .getByRole('link', { name: /View case studies/i });

const settledScrollY = async (page) => {
  await expect.poll(async () => {
    const first = await page.evaluate(() => window.scrollY);
    await page.waitForTimeout(100);
    return (await page.evaluate(() => window.scrollY)) === first;
  }).toBe(true);
  return page.evaluate(() => window.scrollY);
};

const openAndReturnToCard = async (page, card, activate) => {
  await expect(card).toHaveCount(1);
  await card.evaluate((element) => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
  const departureY = await settledScrollY(page);
  const slug = (await card.getAttribute('href')).match(/\/project\/([^/]+)\//)[1];
  await activate(card);
  await expect(page).toHaveURL(new RegExp(`/project/${slug}/?$`));
  await collectionReturnLink(page).click();
  await expect(page).toHaveURL(/\/case-studies\/$/);
  const returned = page.locator(`#main-content a[href="/project/${slug}/?from=collection"]`);
  await expect(returned).toBeInViewport();
  expect(Math.abs((await settledScrollY(page)) - departureY)).toBeLessThanOrEqual(100);
  return departureY;
};

const clickCard = (card) => card.click();
const pressEnterOnCard = (page) => async (card) => {
  await card.focus();
  await page.keyboard.press('Enter');
};

const CORE_PAGE_SIZE = 6;
const initialCoreCount = Math.min(CORE_PAGE_SIZE, collectionCaseStudies.length);
const migratedSlugs = ['ai-project-planning-assistant', 'python-ci-workflow-automation'];
const migratedCard = (page, slug) => page.locator(`[id^="case-study-grid-"] a[href="/project/${slug}/?from=collection"]`);
const loadMoreControl = (page) => page.locator('button[aria-controls^="case-study-grid-"]');
const coreCards = (page) => page
  .locator('[id^="case-study-grid-"]')
  .getByRole('link', { name: /Read case study:/ });

const loadAllCoresByKeyboard = async (page) => {
  const loadMore = loadMoreControl(page);
  await expect(loadMore).toHaveAccessibleName('Load more');
  await expect(loadMore.locator('.detection-label')).toHaveText('MORE WORK');
  await expect(loadMore.locator('.detection-label')).toHaveAttribute('aria-hidden', 'true');
  await loadMore.focus();
  for (let shown = initialCoreCount; shown < collectionCaseStudies.length;) {
    await page.keyboard.press('Enter');
    shown = Math.min(shown + CORE_PAGE_SIZE, collectionCaseStudies.length);
    await expect(coreCards(page)).toHaveCount(shown);
    await expect(loadMore).toBeFocused();
  }
  await expect(loadMore).toHaveAccessibleName('All case studies shown');
  await expect(loadMore.locator('.detection-label')).toHaveText('ALL WORK SHOWN');
};

const openCollection = async (page) => {
  await page.goto('/case-studies/');
  // Same-URL goto keeps history.state, so clear both snapshot stores and reload.
  await page.evaluate(() => {
    sessionStorage.clear();
    window.history.replaceState(null, '');
  });
  await page.reload();
  await expect(coreCards(page)).toHaveCount(initialCoreCount);
  await expect(page.getByRole('region', { name: /other work/i })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: /other work/i })).toHaveCount(0);
  await expect(page.getByRole('status')).toHaveText('Showing 6 of 12 case studies');
};

test.describe('collection return', () => {
  test.skip(process.env.QA_LOCAL_ONLY !== '1', 'Unreleased collection-return behavior is checked on local previews only.');

  for (const reducedMotion of ['no-preference', 'reduce']) {
    test.describe(`reducedMotion=${reducedMotion}`, () => {
      test.beforeEach(async ({ page }) => {
        await page.emulateMedia({ reducedMotion });
      });

      test('fresh session restores each migrated card by pointer click', async ({ page }) => {
        for (const slug of migratedSlugs) {
          await openCollection(page);
          await loadMoreControl(page).click();
          await expect(coreCards(page)).toHaveCount(12);
          const departureY = await openAndReturnToCard(page, migratedCard(page, slug), clickCard);
          await expect(coreCards(page)).toHaveCount(12);
          expect(departureY).toBeGreaterThan(0);
        }
      });

      test('a first-batch return snapshot is replaced by the next migrated-card departure', async ({ page }) => {
        for (const slug of migratedSlugs) {
          await openCollection(page);
          const coreDepartureY = await openAndReturnToCard(page, coreCards(page).nth(1), clickCard);
          await expect(coreCards(page)).toHaveCount(initialCoreCount);
          await loadMoreControl(page).click();
          await expect(coreCards(page)).toHaveCount(12);
          const migratedDepartureY = await openAndReturnToCard(page, migratedCard(page, slug), clickCard);
          expect(Math.abs(migratedDepartureY - coreDepartureY)).toBeGreaterThan(100);
          await expect(coreCards(page)).toHaveCount(12);
        }
      });

      test('keyboard Load more keeps focus and keyboard migrated-card returns preserve the loaded count', async ({ page }) => {
        for (const slug of migratedSlugs) {
          await openCollection(page);
          await loadAllCoresByKeyboard(page);
          await openAndReturnToCard(page, migratedCard(page, slug), pressEnterOnCard(page));
          await expect(coreCards(page)).toHaveCount(collectionCaseStudies.length);
        }
      });

      test('browser Back from each migrated article restores position and loaded count', async ({ page }) => {
        for (const slug of migratedSlugs) {
          await openCollection(page);
          await loadAllCoresByKeyboard(page);
          const card = migratedCard(page, slug);
          await expect(card).toHaveCount(1);
          await card.evaluate((element) => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
          const departureY = await settledScrollY(page);
          await card.click();
          await expect(page).toHaveURL(new RegExp(`/project/${slug}/$`));
          await page.goBack();
          await expect(page).toHaveURL(/\/case-studies\/$/);
          await expect(coreCards(page)).toHaveCount(12);
          await expect(migratedCard(page, slug)).toBeInViewport();
          expect(Math.abs((await settledScrollY(page)) - departureY)).toBeLessThanOrEqual(100);
        }
      });
    });
  }
});
