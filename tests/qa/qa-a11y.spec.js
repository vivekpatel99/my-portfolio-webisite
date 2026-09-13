import { expect, test } from './qa-test.js';

const renderedContrast = async (locator) => locator.evaluate((element) => {
  const parseColor = (value) => {
    const match = value.match(/rgba?\(([^)]+)\)/);
    if (!match) return null;
    const channels = match[1].replaceAll('/', ' ').trim().split(/[ ,]+/).filter(Boolean);
    const rgb = channels.slice(0, 3).map(Number);
    const alpha = channels[3] === undefined ? 1 : Number(channels[3]);
    return rgb.every(Number.isFinite) && Number.isFinite(alpha) ? { rgb, alpha } : null;
  };
  const composite = (foreground, background) => {
    const alpha = foreground.alpha;
    return foreground.rgb.map((channel, index) => channel * alpha + background[index] * (1 - alpha));
  };
  const luminance = (rgb) => rgb.map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  }).reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);

  const ancestors = [];
  for (let node = element; node; node = node.parentElement) ancestors.unshift(node);
  let background = [0, 0, 0];
  for (const node of ancestors) {
    const color = parseColor(getComputedStyle(node).backgroundColor);
    if (!color || color.alpha === 0) continue;
    background = composite(color, background);
  }
  const foreground = parseColor(getComputedStyle(element).color)?.rgb;
  if (!foreground) throw new Error('Could not parse rendered foreground color');
  const foregroundLuminance = luminance(foreground);
  const backgroundLuminance = luminance(background);
  return {
    ratio: (Math.max(foregroundLuminance, backgroundLuminance) + 0.05)
      / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05),
    foreground,
    background,
  };
});

const expectRenderedContrast = async (locator, label, minimum = 4.5) => {
  const result = await renderedContrast(locator);
  expect(result.ratio, `${label}: ${JSON.stringify(result)}`).toBeGreaterThanOrEqual(minimum);
  return result;
};

const expectRenderedForeground = async (locator, label, expected) => {
  await expect.poll(
    async () => (await renderedContrast(locator)).foreground.join(','),
    { message: label },
  ).toBe(expected);
};

test('home has exactly one main landmark', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('main')).toHaveCount(1);
});

test('project page uses a single main landmark', async ({ page }) => {
  await page.goto('/project/n8n-openai-data-extraction');
  await expect(page.locator('main')).toHaveCount(1);
});

test('contact social icon links have accessible names', async ({ page }) => {
  await page.goto('/contact');
  const links = page.locator('a[href*="linkedin"], a[href*="github"]').filter({
    has: page.locator('svg'),
  });
  const count = await links.count();
  for (let i = 0; i < count; i++) {
    const link = links.nth(i);
    const ariaLabel = await link.getAttribute('aria-label');
    const text = await link.textContent();
    if (!text?.trim()) {
      expect(ariaLabel, `Icon link ${i} should have aria-label`).toBeTruthy();
    }
  }
});

test('mobile menu closes on Escape', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Toggle navigation menu' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('mobile menu isolates background content while open', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Toggle navigation menu' }).click();
  await expect(page.getByRole('dialog', { name: 'Navigation menu' })).toBeVisible();
  await expect(page.locator('#main-content')).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
});

test('testimonial links are not duplicated for animation', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.testimonial-card-link')).toHaveCount(4);
  await expect(page.locator('.scroller-inner')).toHaveCount(0);
});

test('reduced motion disables custom cursor', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('html')).not.toHaveClass(/custom-cursor-enabled/);
});

test('form inputs have associated labels', async ({ page }) => {
  await page.goto('/contact');
  for (const id of ['name', 'email', 'description']) {
    const label = page.locator(`label[for="${id}"]`);
    await expect(label).toBeVisible();
  }
});

test('normal-size purple text and links meet contrast in rendered states', async ({ page }) => {
  await page.goto('/');
  const price = page.getByText('Starting at €80/hour', { exact: true });
  const priceBackground = await price.evaluate((element) => {
    const badge = element.parentElement;
    const style = badge ? getComputedStyle(badge) : null;
    return style ? {
      backgroundColor: style.backgroundColor,
      alpha: style.backgroundColor.startsWith('rgba(')
        ? Number(style.backgroundColor.split(',')[3].replace(')', '').trim())
        : 1,
    } : null;
  });
  expect(priceBackground?.backgroundColor, 'Hero price badge should have a stable dark background').toBe('rgb(12, 13, 13)');
  expect(priceBackground?.alpha, 'Hero price badge should be opaque over the image').toBe(1);
  await expectRenderedContrast(price, 'Hero price');

  const cardLink = page.locator('a.text-accent-purple-text').first();
  await expectRenderedContrast(cardLink, 'Case study card link');
  await cardLink.hover();
  await expectRenderedForeground(cardLink, 'Case study card link should finish its hover transition', '255,255,255');
  await expectRenderedContrast(cardLink, 'Case study card link on hover');

  const portfolioLink = page.getByRole('link', { name: /View all case studies/ });
  await expectRenderedContrast(portfolioLink, 'Portfolio collection link');
  await portfolioLink.hover();
  await expectRenderedForeground(portfolioLink, 'Portfolio collection link should finish its hover transition', '255,255,255');
  await expectRenderedContrast(portfolioLink, 'Portfolio collection link on hover');
  await page.mouse.move(0, 0);
  await portfolioLink.focus();
  await expect(portfolioLink).toBeFocused();
  await expectRenderedForeground(portfolioLink, 'Portfolio collection link focus state', '167,139,250');
  await expectRenderedContrast(portfolioLink, 'Portfolio collection link on focus');
});

test('policy, contact, footer, and not-found accent states meet contrast', async ({ page }) => {
  await page.goto('/legal/');
  for (const name of ['Cookie Policy', 'Resend', 'Convex', 'Sentry']) {
    await expectRenderedContrast(page.locator('main').getByRole('link', { name, exact: true }), `Legal ${name}`);
  }

  await page.goto('/data-policy/');
  await expectRenderedContrast(page.locator('main').getByRole('link', { name: 'Privacy Policy', exact: true }), 'Data policy link');

  await page.goto('/contact/');
  const email = page.getByRole('link', { name: /@/ }).first();
  await email.hover();
  await expectRenderedForeground(email, 'Contact email should finish its hover transition', '167,139,250');
  await expectRenderedContrast(email, 'Contact email on hover');

  await page.goto('/');
  const footerLink = page.locator('footer').getByRole('link', { name: 'Home', exact: true });
  await footerLink.hover();
  await expectRenderedForeground(footerLink, 'Footer navigation link should finish its hover transition', '167,139,250');
  await expectRenderedContrast(footerLink, 'Footer navigation link on hover');

  await page.goto('/missing-page/');
  await expectRenderedContrast(page.getByText('404', { exact: true }), 'Not-found status');
});

test('services section exists for anchor target', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#services')).toBeAttached();
  await expect(page.locator('#about')).toBeAttached();
  await expect(page.locator('#portfolio')).toBeAttached();
  await expect(page.locator('#testimonials')).toBeAttached();
});

test('section anchors include scroll-margin-top for fixed header navigation', async ({ page }) => {
  await page.goto('/');
  for (const id of ['services', 'about', 'portfolio', 'testimonials']) {
    const margin = await page.locator(`#${id}`).evaluate((el) =>
      getComputedStyle(el).scrollMarginTop
    );
    expect(margin === '0px' || margin === '', `#${id} scroll-margin-top is ${margin}`).toBeFalsy();
  }
});
