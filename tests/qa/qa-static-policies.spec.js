import { expect, test } from './qa-test.js';
import { socialLinks } from '../../src/config/links.js';

test.skip(process.env.QA_LOCAL_ONLY !== '1', 'Static policy acceptance requires a loopback build preview.');

const fallbackNotice = 'Cookie consent controls need JavaScript.';
const consentKey = 'cookie_consent_preferences';
const policies = [
  {
    path: '/legal/',
    heading: 'Privacy Policy',
    updated: 'Last updated: June 1, 2026',
    crossPath: '/data-policy/',
    crossHeading: 'Cookie Policy',
    sections: [
      'Data Controller',
      'Information Collection and Use',
      'Types of Data Collected',
      'Legal Basis for Processing under GDPR',
      'Your Data Protection Rights Under GDPR',
      'Data Processors',
      'Changes to This Privacy Policy',
    ],
    end: 'You are advised to review this Privacy Policy periodically for any changes.',
  },
  {
    path: '/data-policy/',
    heading: 'Cookie Policy',
    updated: 'Last updated: 30 August 2026',
    crossPath: '/legal/',
    crossHeading: 'Privacy Policy',
    sections: [
      'What Are Cookies?',
      'How Do We Use Cookies?',
      'What Types of Cookies Do We Use?',
      'How Can I Control My Cookie Preferences?',
    ],
    end: 'To find out more about how to manage and delete cookies, visit wikipedia.org, www.allaboutcookies.org.',
  },
];

async function expectReadablePolicy(page, policy) {
  const main = page.locator('#main-content');
  await expect(main).toHaveCount(1);
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(main.getByRole('heading', { level: 1, name: policy.heading, exact: true })).toBeVisible();
  await expect(main.getByText(policy.updated, { exact: true })).toBeVisible();
  for (const section of policy.sections) {
    await expect(main.getByRole('heading', { name: section, exact: true })).toBeVisible();
  }
  await expect(main.getByText(policy.end, { exact: false })).toBeVisible();
  await expect(main.getByRole('link', { name: policy.crossHeading, exact: true })).toHaveAttribute('href', policy.crossPath);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  // Check the entire policy, including the long localStorage key below the fold.
  // Merely hiding horizontal overflow must not make a clipped paragraph pass.
  const clipped = await main.locator('h1, h2, h3, p, li, code').evaluateAll((elements) => elements.flatMap((element) => {
    const boxes = [...element.getClientRects()];
    const outsideViewport = boxes.some((box) => box.left < -1 || box.right > innerWidth + 1);
    const clippedContent = element.clientWidth > 0 && element.scrollWidth > element.clientWidth + 1;
    return outsideViewport || clippedContent ? [element.textContent] : [];
  }));
  expect(clipped).toEqual([]);
}

async function expectStaticActions(page, policy) {
  const main = page.locator('#main-content');
  await expect(main.getByRole('link', { name: socialLinks.contactEmail, exact: true })).toHaveAttribute('href', socialLinks.emailHref);
  if (policy.path === '/data-policy/') {
    await expect(main.getByText(fallbackNotice, { exact: false })).toBeVisible();
  }
  // Static policy controls must not imply that consent can be changed without the application.
  await expect(page.getByRole('button', { name: /manage.*consent/i })).toHaveCount(0);
  await expect(page.getByRole('dialog', { name: /we value your privacy/i })).toHaveCount(0);
}

test.describe('policies without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  for (const width of [1440, 390, 320]) {
    for (const policy of policies) {
      test(`${policy.heading} has complete HTML and native keyboard links at ${width}px`, async ({ page, request, browserName }) => {
        await page.setViewportSize({ width, height: 900 });
        const response = await request.get(policy.path);
        expect(response.status()).toBe(200);
        const html = await response.text();
        expect(html).toMatch(new RegExp(`<h1\\b[^>]*>${policy.heading}</h1>`));
        expect(html).toContain(policy.updated);
        for (const section of policy.sections) expect(html).toContain(section);
        expect(html).toContain(policy.end);
        expect(html).toContain(`href="${policy.crossPath}"`);
        expect(html).toContain(`href="${socialLinks.emailHref}"`);

        await page.goto(policy.path);
        await expectReadablePolicy(page, policy);
        await expectStaticActions(page, policy);

        const links = page.locator('#main-content a[href]');
        const tabKey = browserName === 'webkit' ? 'Alt+Tab' : 'Tab';
        await links.first().focus();
        for (let index = 0; index < await links.count(); index += 1) {
          const link = links.nth(index);
          await expect(link).toBeFocused();
          await expect(link).not.toHaveCSS('outline-style', 'none');
          const boxes = await link.evaluate((element) => [...element.getClientRects()].map(({ left, right }) => ({ left, right })));
          for (const box of boxes) {
            expect(box.left).toBeGreaterThanOrEqual(0);
            expect(box.right).toBeLessThanOrEqual(width);
          }
          if (index + 1 < await links.count()) await page.keyboard.press(tabKey);
        }

        await page.locator('#main-content').getByRole('link', { name: policy.crossHeading, exact: true }).focus();
        await page.keyboard.press('Enter');
        await expect(page).toHaveURL(new RegExp(`${policy.crossPath}$`));
        const destination = policies.find(({ path }) => path === policy.crossPath);
        await expectReadablePolicy(page, destination);
        await expectStaticActions(page, destination);
      });
    }
  }
});

for (const policy of policies) {
  test(`${policy.heading} stays readable when the application entry fails`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 740 });
    await page.route(/\/assets\/index-[^/]+\.js(?:\?.*)?$/, (route) => route.abort());
    await page.goto(policy.path);
    await expectReadablePolicy(page, policy);
    await expectStaticActions(page, policy);
  });

  test(`${policy.heading} preserves every static policy paragraph after the application mounts`, async ({ page }) => {
    await page.addInitScript((key) => {
      localStorage.setItem(key, JSON.stringify({ necessary: true, analytics: false }));
    }, consentKey);
    let release;
    const gate = new Promise((resolve) => { release = resolve; });
    await page.route(/\/assets\/index-[^/]+\.js(?:\?.*)?$/, async (route) => {
      await gate;
      await route.fallback();
    });
    const policyText = () => page.locator('#main-content').locator('h1, h2, h3, p, li').evaluateAll((elements) => elements
      .map((element) => element.textContent.replace(/\s+/g, ' ').trim())
      .filter((text) => !text.includes('Cookie consent controls need JavaScript.')));
    try {
      await page.goto(policy.path, { waitUntil: 'commit' });
      await expectReadablePolicy(page, policy);
      await expectStaticActions(page, policy);
      const staticText = await policyText();
      release();
      // The shared footer proves the application mounted; static policy HTML has no footer.
      await expect(page.locator('footer').getByRole('button', { name: /manage consent/i })).toBeVisible();
      await expectReadablePolicy(page, policy);
      expect(await policyText()).toEqual(staticText);
      await expect(page.getByText(fallbackNotice, { exact: false })).toHaveCount(0);
    } finally {
      release();
    }
  });
}

for (const width of [1440, 390, 320]) {
  test(`mounted policies reopen the existing consent banner and restore keyboard focus at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript((key) => {
      localStorage.setItem(key, JSON.stringify({ necessary: true, analytics: false }));
    }, consentKey);
    for (const policy of policies) {
      await page.goto(policy.path);
      const footerTrigger = page.locator('footer').getByRole('button', { name: /manage consent/i });
      await expect(footerTrigger).toBeVisible();
      await expectReadablePolicy(page, policy);
      const triggers = policy.path === '/data-policy/'
        ? [page.getByRole('button', { name: 'Manage Your Cookie Consent', exact: true }), footerTrigger]
        : [footerTrigger];
      for (const trigger of triggers) {
        await trigger.focus();
        await page.keyboard.press('Enter');
        const dialog = page.getByRole('dialog', { name: /we value your privacy/i });
        await expect(dialog).toHaveCount(1);
        await expect(dialog).toBeVisible();
        await expect(dialog).toBeFocused();
        await dialog.getByRole('button', { name: 'Reject', exact: true }).focus();
        await page.keyboard.press('Enter');
        await expect(dialog).toHaveCount(0);
        await expect(trigger).toBeFocused();
      }
    }
  });
}
