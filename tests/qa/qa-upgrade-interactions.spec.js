import { expect, test } from '@playwright/test';

const caseStudies = [
  {
    cardName: /Read case study: Automated Data Extraction/i,
    path: '/project/n8n-openai-data-extraction',
    heading: /n8n \+ OpenAI Data Extraction/i,
    stack: ['n8n', 'OpenAI', 'Web Scraping', 'Data Validation'],
  },
  {
    cardName: /Read case study: Invoice OCR Data Extraction/i,
    path: '/project/invoice-ocr-extraction',
    heading: /Invoice OCR Extraction/i,
    stack: ['OCR', 'Python', 'Image Processing', 'Structured Extraction'],
  },
  {
    cardName: /Read case study: Real-Time Pose Detection/i,
    path: '/project/yolo-computer-vision-optimization',
    heading: /YOLO Computer Vision Optimization/i,
    stack: ['YOLO', 'Python', 'Computer Vision', 'Real-time Inference'],
  },
];

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

  for (const text of ['Top Rated Plus', '100% Job Success', '21+ Projects', '300+ Hours', '94% Faster']) {
    await expect(page.getByText(text, { exact: true })).toBeVisible();
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

test('all featured case-study cards and detail CTAs work', async ({ page }) => {
  for (const caseStudy of caseStudies) {
    await page.goto('/#portfolio');
    await page.locator('#portfolio').scrollIntoViewIfNeeded();
    await page.getByRole('link', { name: caseStudy.cardName }).click();
    await expect(page).toHaveURL(new RegExp(`${caseStudy.path}$`));
    await expect(page.getByRole('heading', { name: caseStudy.heading })).toBeVisible();

    for (const stackItem of caseStudy.stack) {
      await expect(page.getByText(stackItem, { exact: true }).first()).toBeVisible();
    }

    await expect(page.getByText(/Next-Gen Banking UI/i)).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Upwork project/i }).first()).toHaveAttribute(
      'href',
      /upwork\.com/,
    );

    await page.getByRole('link', { name: 'View Case Studies' }).first().click();
    await expect(page).toHaveURL(/\/#portfolio$/);

    await page.goto(caseStudy.path);
    await page.getByRole('link', { name: 'Request a Project Estimate' }).click();
    await expect(page).toHaveURL(/\/contact$/);
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

  await page.getByLabel('Budget Range (Optional)').click();
  await page.getByRole('option', { name: '€5,000 - €10,000' }).click();
  await expect(page.getByLabel('Budget Range (Optional)')).toContainText('€5,000 - €10,000');

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
  await page.getByRole('dialog', { name: 'Navigation menu' }).getByRole('link', { name: 'Portfolio' }).click();
  await expect(page.getByRole('dialog', { name: 'Navigation menu' })).toBeHidden();
  await expect
    .poll(async () => {
      const box = await page.locator('#portfolio').boundingBox();
      return box && box.y >= -120 && box.y < 320;
    })
    .toBeTruthy();

  await page.getByRole('button', { name: 'Toggle navigation menu' }).click();
  await expect(page.getByRole('dialog', { name: 'Navigation menu' })).toBeVisible();
  await page.waitForTimeout(600);
  await page.getByRole('dialog', { name: 'Navigation menu' }).getByRole('button', {
    name: /Request a Project Estimate/i,
  }).click();
  await expect(page).toHaveURL(/\/contact$/);
});
