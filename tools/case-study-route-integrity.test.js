// @vitest-environment node
import { execFileSync } from 'node:child_process';
import {
  cpSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { caseStudySlugs, getCaseStudyBySlug } from '../src/data/caseStudies.js';
import {
  assertCaseStudyRouteSources,
  assertSameCaseStudySlugs,
  assertSitemapCaseStudyRoutes,
  removeStaleProjectHtml,
} from './case-study-route-integrity.js';
import { deploymentHtaccess } from '../plugins/vite-plugin-case-study-publication.js';
import { HOURLY_RATE_EUR } from '../src/config/pricing.js';

const temporaryDirectories = [];
afterEach(() => temporaryDirectories.splice(0).forEach((directory) => rmSync(directory, { recursive: true, force: true })));

const projectRoute = (slug) => `/project/${slug}`;
const htaccess = (slugs = caseStudySlugs) => deploymentHtaccess(readFileSync('public/.htaccess', 'utf8'), slugs);
const scenarioSlugs = () => caseStudySlugs.length > 0 ? caseStudySlugs : ['synthetic-one', 'synthetic-two'];
const seoFor = (slugs) => ({
  '/': { path: '/' },
  ...Object.fromEntries(slugs.map((slug) => [projectRoute(slug), { path: projectRoute(slug) }])),
});

function fixture({ hourlyRateEur = HOURLY_RATE_EUR } = {}) {
  const directory = mkdtempSync(path.join(tmpdir(), 'case-study-route-fixture-'));
  temporaryDirectories.push(directory);

  for (const file of [
    'index.html',
    'public/.htaccess',
    'src/config/links.js',
    'src/config/pricing.js',
    'plugins/vite-plugin-pricing-html.js',
    'src/data/caseStudies.js',
    'src/lib/caseStudyCollection.js',
    'src/lib/caseStudyBrowsing.js',
    'src/lib/caseStudyThumbnails.js',
    'src/lib/featuredCaseStudies.js',
    'src/lib/seoConfig.js',
    'src/lib/seo.js',
    'src/lib/heroDetectedFields.js',
    'src/pages/Home.jsx',
    'src/pages/ContactFallback.jsx',
    'src/components/ContactContent.jsx',
    'src/components/PrivacyPolicyContent.jsx',
    'src/components/CookiePolicyContent.jsx',
    'src/components/ui/button.jsx',
    'src/lib/utils.js',
    'src/components/Hero.jsx',
    'src/components/Header.jsx',
    'src/components/SkipLink.jsx',
    'src/lib/focusTarget.js',
    'src/components/Portfolio.jsx',
    'src/components/Services.jsx',
    'src/components/Services.css',
    'src/components/Testimonials.jsx',
    'src/components/Testimonials.css',
    'src/components/About.jsx',
    'src/components/CTA.jsx',
    'src/components/SectionAnimator.jsx',
    'src/data/testimonials.js',
    'publication/case-study-derivatives.js',
    'publication/case-study-manifest.js',
    'publication/case-study-evidence.js',
    'publication/case-study-schema.js',
    'publication/markdown-case-study.js',
    'publication/compile-case-studies.js',
    'publication/case-study-card-copy.js',
    'publication/staged-case-study-publication.js',
    'publication/case-study-manifest-merge.js',
    'publication/public-case-studies.js',
    'publication/case-study-featured.js',
    'publication/case-study-other-work.js',
    'src/components/CaseStudyArticle.js',
    'src/components/CaseStudyGallery.js',
    'src/components/CaseStudyCard.js',
    'src/components/DetectionFrame.js',
    'src/components/CaseStudyCollection.js',
    'src/components/CaseStudiesContent.js',
    'src/components/OngoingCaseStudies.js',
    'src/components/ServiceDetailContent.js',
    'src/components/RelatedWork.js',
    'src/data/relatedWork.js',
    'src/data/serviceOffers.js',
    'tools/case-study-route-integrity.js',
    'tools/public-route-integrity.js',
    'tools/generate-sitemap.js',
    'tools/generate-static-route-html.js',
    'tools/render-static-home.js',
  ]) {
    mkdirSync(path.dirname(path.join(directory, file)), { recursive: true });
    copyFileSync(file, path.join(directory, file));
  }
  if (existsSync('public/assets/case-studies')) {
    cpSync('public/assets/case-studies', path.join(directory, 'public/assets/case-studies'), { recursive: true });
  }
  mkdirSync(path.join(directory, 'dist'), { recursive: true });
  const pricingPath = path.join(directory, 'src/config/pricing.js');
  writeFileSync(pricingPath, readFileSync(pricingPath, 'utf8')
    .replace(/(export const HOURLY_RATE_EUR = )[^;]+/, `$1${hourlyRateEur}`));
  writeFileSync(path.join(directory, 'package.json'), '{"type":"module"}');
  const bootstrapHtml = execFileSync(process.execPath, ['--input-type=module', '-e',
    "import { readFileSync } from 'node:fs'; import { replacePricingTokens } from './plugins/vite-plugin-pricing-html.js'; process.stdout.write(replacePricingTokens(readFileSync('index.html', 'utf8')));",
  ], { cwd: directory, encoding: 'utf8' });
  writeFileSync(path.join(directory, 'dist/index.html'), bootstrapHtml);
  writeFileSync(
    path.join(directory, 'dist/.htaccess'),
    deploymentHtaccess(readFileSync(path.join(directory, 'public/.htaccess'), 'utf8'), caseStudySlugs),
  );
  writeFileSync(path.join(directory, 'package.json'), '{"type":"module"}');
  symlinkSync(path.join(process.cwd(), 'node_modules'), path.join(directory, 'node_modules'));
  return directory;
}

const run = (directory, script) =>
  execFileSync(process.execPath, [`tools/${script}.js`], {
    cwd: directory,
    encoding: 'utf8',
    stdio: 'pipe',
    env: { ...process.env, SITEMAP_LASTMOD: '2026-09-07' },
  });

describe('case-study route integrity', () => {
  it('renders shared homepage content and preserves every HTML output on a second generation', () => {
    const directory = fixture();
    const sourcePaths = ['index.html', 'public/.htaccess', 'src/config/pricing.js', 'src/data/caseStudies.js'];
    const sourcesBefore = sourcePaths.map((file) => readFileSync(path.join(directory, file), 'utf8'));
    run(directory, 'generate-static-route-html');
    const home = readFileSync(path.join(directory, 'dist/index.html'), 'utf8');
    expect(home.match(/<h1\b/g)).toHaveLength(1);
    expect(home).toContain('Manual data entry, scattered website data, and unstructured video slow teams down. I build document extraction, n8n automation, and computer vision workflows to make that information usable.');
    expect(home).toContain('href="/contact/"');
    expect(home).toContain('href="/case-studies/"');
    expect(home).toContain('Profile Invoice');
    expect(home).toContain('aria-label="Vivek Patel home"');
    expect(home).not.toContain('<details');
    expect(home).not.toContain('translateY(12px)');
    for (const service of ['data-extraction-automation-sprint', 'computer-vision-production-optimization', 'ai-workflow-buildout']) {
      expect(home).toContain(`href="/services/${service}"`);
    }
    const outputs = ['index.html', '404.html', 'contact/index.html', 'case-studies/index.html', 'legal/index.html', 'data-policy/index.html',
      ...caseStudySlugs.map((slug) => `project/${slug}/index.html`),
      ...['data-extraction-automation-sprint', 'computer-vision-production-optimization', 'ai-workflow-buildout']
        .map((id) => `services/${id}/index.html`)];
    const firstOutputs = outputs.map((file) => readFileSync(path.join(directory, 'dist', file), 'utf8'));
    run(directory, 'generate-static-route-html');
    expect(outputs.map((file) => readFileSync(path.join(directory, 'dist', file), 'utf8'))).toEqual(firstOutputs);
    expect(sourcePaths.map((file) => readFileSync(path.join(directory, file), 'utf8'))).toEqual(sourcesBefore);
    expect(firstOutputs[1]).not.toContain('Profile Invoice');
    expect(firstOutputs[2]).not.toContain('Profile Invoice');
    const contact = firstOutputs[2];
    expect(contact.match(/<h1\b/g)).toHaveLength(1);
    expect(contact).toContain('REQUEST A');
    expect(contact).toContain('PROJECT ESTIMATE');
    expect(contact).toContain('href="mailto:contact@vivekapatel.com"');
    expect(contact).toContain('WHAT HAPPENS NEXT');
    expect(contact).toContain('You receive a suggested scope, timeline, and first milestone.');
    expect(contact).toContain('The project request form needs JavaScript.');
    expect(contact).toContain('Connect with Vivek Patel on Upwork');
    expect(contact).not.toMatch(/<(?:form|input|textarea)\b/);
    expect(contact).not.toContain('<details');
    const privacy = readFileSync(path.join(directory, 'dist/legal/index.html'), 'utf8');
    const cookies = readFileSync(path.join(directory, 'dist/data-policy/index.html'), 'utf8');
    for (const [html, heading, crossPath] of [
      [privacy, 'Privacy Policy', '/data-policy/'],
      [cookies, 'Cookie Policy', '/legal/'],
    ]) {
      expect(html.match(/<h1\b/g)).toHaveLength(1);
      expect(html).toMatch(new RegExp(`<h1\\b[^>]*>${heading}</h1>`));
      expect(html).toContain('href="mailto:contact@vivekapatel.com"');
      expect(html).toContain(`href="${crossPath}"`);
      expect(html.match(/href="#main-content"/g)).toHaveLength(1);
      expect(html).toContain('Skip to main content');
      expect(html.indexOf('href="#main-content"')).toBeLessThan(html.indexOf('<header'));
      expect(html).toMatch(/<main\b[^>]*id="main-content"[^>]*tabindex="-1"/);
      expect(html).not.toContain('Profile Invoice');
      expect(html).not.toMatch(/opacity:0|translateY\(/);
      expect(html.match(/<details\b/g)).toHaveLength(1);
      expect(html).toMatch(/<summary\b[^>]*aria-label="Toggle navigation menu"/);
      expect(html).toContain('id="static-mobile-menu"');
      expect(html).toContain('href="/#services"');
      expect(html).toContain('href="/case-studies/"');
      expect(html).toContain('href="/contact/"');
    }
    expect(privacy).toContain('Last updated: June 1, 2026');
    expect(privacy).toContain('Changes to This Privacy Policy');
    expect(privacy).toContain('You are advised to review this Privacy Policy periodically for any changes.');
    expect(cookies).toContain('Last updated: 30 August 2026');
    expect(cookies).toContain('cookie_consent_preferences');
    expect(cookies).toContain('Cookie consent controls need JavaScript.');
    expect(cookies).not.toContain('Manage Your Cookie Consent');
  }, 30_000);
  it('propagates one changed hourly amount through static metadata and every service page', () => {
    const directory = fixture({ hourlyRateEur: 67 });
    run(directory, 'generate-static-route-html');
    const home = readFileSync(path.join(directory, 'dist/index.html'), 'utf8');
    const contact = readFileSync(path.join(directory, 'dist/contact/index.html'), 'utf8');
    expect(home).toContain('€67/hour');
    expect(home).toMatch(/"priceRange":\s*"€67\/hour"/);
    expect(contact).toContain('€67/hour');
    for (const id of ['data-extraction-automation-sprint', 'computer-vision-production-optimization', 'ai-workflow-buildout']) {
      const html = readFileSync(path.join(directory, `dist/services/${id}/index.html`), 'utf8');
      expect(html).toContain('from €67/hour');
      expect(html).not.toContain('€45/hour');
      expect(html).not.toContain('__HOURLY_');
    }
  });
  it.each([{ slugs: [] }, { slugs: ['published-case-study'] }])('validates generated deployment routing for $slugs published slugs', ({ slugs }) => {
    const seo = {
      '/': { path: '/' },
      ...Object.fromEntries(slugs.map((slug) => [`/project/${slug}`, { path: `/project/${slug}` }])),
    };
    expect(() => assertCaseStudyRouteSources({ slugs, seo, htaccess: htaccess(slugs) })).not.toThrow();
    const staleSitemap = '<loc>https://www.vivekapatel.com/project/withdrawn-case-study/</loc>';
    expect(() => assertSitemapCaseStudyRoutes(staleSitemap, slugs)).toThrow(/stale|missing/i);
    if (slugs.length > 0) {
      const missingSeo = { '/': { path: '/' } };
      expect(() => assertCaseStudyRouteSources({ slugs, seo: missingSeo, htaccess: htaccess(slugs) })).toThrow(/missing/i);
    }
  });

  it('rejects duplicate source slugs before a consumer can generate routes', () => {
    expect(() => assertSameCaseStudySlugs(['one', 'one'], ['one'], 'SEO'))
      .toThrow(/duplicate case-study slugs/i);
  });

  it('rejects SEO routes that are missing or have a mismatched canonical path', () => {
    const slugs = scenarioSlugs();
    const missingSeo = seoFor(slugs);
    delete missingSeo[projectRoute(slugs[0])];
    expect(() => assertCaseStudyRouteSources({ slugs, seo: missingSeo, htaccess: htaccess(slugs) }))
      .toThrow(/SEO case-study routes do not match/i);

    const mismatchedSeo = seoFor(slugs);
    mismatchedSeo[projectRoute(slugs[0])].path = projectRoute(slugs[1]);
    expect(() => assertCaseStudyRouteSources({ slugs, seo: mismatchedSeo, htaccess: htaccess(slugs) }))
      .toThrow(/canonical path/i);
  });

  it('rejects a stale or broad deployment project regex', () => {
    const slugs = scenarioSlugs();
    const generatedHtaccess = htaccess(slugs);
    const staleRouting = generatedHtaccess.replace(slugs[0], 'withdrawn-case-study');
    expect(() => assertCaseStudyRouteSources({ slugs, seo: seoFor(slugs), htaccess: staleRouting }))
      .toThrow(/Deployment routing case-study routes do not match/i);

    const broadRouting = generatedHtaccess.replace(`(${slugs.join('|')})`, '([a-z-]+)');
    expect(() => assertCaseStudyRouteSources({ slugs, seo: seoFor(slugs), htaccess: broadRouting }))
      .toThrow(/Deployment routing case-study routes do not match/i);

    const projectRule = generatedHtaccess.match(/^\s*RewriteRule\s+\^project\/.*$/m)[0];
    expect(() => assertCaseStudyRouteSources({ slugs, seo: seoFor(slugs), htaccess: `${generatedHtaccess}\n${projectRule}` }))
      .toThrow(/exactly one case-study allowlist rule/i);
  });

  it('rejects sitemap pages that are missing or stale', () => {
    const slugs = scenarioSlugs();
    const sitemap = slugs
      .slice(1)
      .map((slug) => `<loc>https://www.vivekapatel.com${projectRoute(slug)}/</loc>`)
      .concat('<loc>https://www.vivekapatel.com/project/withdrawn-case-study/</loc>')
      .join('\n');
    expect(() => assertSitemapCaseStudyRoutes(sitemap, slugs)).toThrow(/missing:|stale:/i);

    const noncanonicalExtra = `${sitemap}\n<loc>https://www.vivekapatel.com/project/withdrawn-case-study</loc>`;
    expect(() => assertSitemapCaseStudyRoutes(noncanonicalExtra, slugs))
      .toThrow(/canonical project route/i);
  });

  it('runs real generators, preserves tracked deployment routing bytes, and removes only stale generated HTML', () => {
    const directory = fixture();
    const deploymentPath = path.join(directory, 'public/.htaccess');
    const deploymentBefore = readFileSync(deploymentPath, 'utf8');
    const staleDirectory = path.join(directory, 'dist/project/withdrawn-case-study');
    mkdirSync(staleDirectory, { recursive: true });
    writeFileSync(path.join(staleDirectory, 'index.html'), 'STALE_GENERATED_HTML');
    writeFileSync(path.join(staleDirectory, 'operator-note.txt'), 'DO_NOT_REMOVE');

    run(directory, 'generate-sitemap');
    run(directory, 'generate-static-route-html');

    expect(readFileSync(deploymentPath, 'utf8')).toBe(deploymentBefore);
    expect(existsSync(path.join(staleDirectory, 'index.html'))).toBe(false);
    expect(readFileSync(path.join(staleDirectory, 'operator-note.txt'), 'utf8')).toBe('DO_NOT_REMOVE');
    for (const slug of caseStudySlugs) {
      expect(existsSync(path.join(directory, 'dist', projectRoute(slug), 'index.html'))).toBe(true);
      const articleHtml = readFileSync(path.join(directory, 'dist', projectRoute(slug), 'index.html'), 'utf8');
      const backHref = getCaseStudyBySlug(slug).projectStatus === 'ongoing' ? '/case-studies/#in-progress' : '/case-studies/';
      expect(articleHtml).toContain(`href="${backHref}"`);
      expect(readFileSync(path.join(directory, 'dist/sitemap.xml'), 'utf8'))
        .toContain(`https://www.vivekapatel.com${projectRoute(slug)}/`);
    }
  });

  it('fails the real sitemap generator before it writes when deployment routing diverges', () => {
    const directory = fixture();
    const deploymentPath = path.join(directory, 'dist/.htaccess');
    writeFileSync(deploymentPath, deploymentHtaccess(readFileSync(path.join(directory, 'public/.htaccess'), 'utf8'), ['synthetic-case-study']));

    expect(() => run(directory, 'generate-sitemap')).toThrow(/Deployment routing case-study routes do not match/i);
    expect(existsSync(path.join(directory, 'dist/sitemap.xml'))).toBe(false);
  });

  it('refuses to traverse a symlinked static project directory', async () => {
    const directory = fixture();
    const distProjectDirectory = path.join(directory, 'dist/project');
    const targetDirectory = path.join(directory, 'unrelated-output');
    mkdirSync(targetDirectory);
    symlinkSync(targetDirectory, distProjectDirectory);

    const { removeStaleProjectHtml } = await import('./case-study-route-integrity.js');
    expect(() => removeStaleProjectHtml(path.join(directory, 'dist')))
      .toThrow(/must be a real directory/i);
    expect(existsSync(targetDirectory)).toBe(true);
  });
});


describe('adversarial output boundaries', () => {
  it.each([
    (slug) => `https://attacker.invalid/project/${slug}/`,
    (slug) => `https://www.vivekapatel.com/project/${slug}/?extra=1`,
    (slug) => `https://www.vivekapatel.com/project/${slug}/#extra`,
  ])('rejects noncanonical sitemap origins, queries, and fragments', (location) => {
    const slugs = scenarioSlugs();
    const sitemap = slugs.map((slug) => `<loc>${location(slug)}</loc>`).join('');
    expect(() => assertSitemapCaseStudyRoutes(sitemap, slugs)).toThrow(/canonical project route/i);
  });

  it('does not clean through a symlinked dist root', () => {
    const directory = fixture();
    const outside = path.join(directory, 'outside');
    mkdirSync(path.join(outside, 'project/stale'), { recursive: true });
    const sentinel = path.join(outside, 'project/stale/index.html');
    writeFileSync(sentinel, 'PRESERVE');
    rmSync(path.join(directory, 'dist'), { recursive: true });
    symlinkSync(outside, path.join(directory, 'dist'));
    expect(() => removeStaleProjectHtml(path.join(directory, 'dist'))).toThrow(/real directory/i);
    expect(readFileSync(sentinel, 'utf8')).toBe('PRESERVE');
  });

  it.each(['directory', 'index'])('fails before writing through a canonical route %s symlink', (kind) => {
    const directory = fixture();
    const outside = path.join(directory, 'outside');
    mkdirSync(outside);
    const sentinel = path.join(outside, 'index.html');
    writeFileSync(sentinel, 'PRESERVE');
    const route = path.join(directory, 'dist/contact');
    mkdirSync(path.dirname(route), { recursive: true });
    if (kind === 'directory') {
      symlinkSync(outside, route);
    } else {
      mkdirSync(route);
      symlinkSync(sentinel, path.join(route, 'index.html'));
    }
    const indexBefore = readFileSync(path.join(directory, 'dist/index.html'), 'utf8');
    expect(() => run(directory, 'generate-static-route-html')).toThrow(/symlinks|regular file/i);
    expect(readFileSync(sentinel, 'utf8')).toBe('PRESERVE');
    expect(readFileSync(path.join(directory, 'dist/index.html'), 'utf8')).toBe(indexBefore);
  });
});


describe('stale symlink parity', () => {
  it.each(['directory', 'index'])('rejects stale %s symlinks without changing their target', (kind) => {
    const directory = fixture();
    const outside = path.join(directory, 'outside');
    mkdirSync(outside);
    const sentinel = path.join(outside, 'index.html');
    writeFileSync(sentinel, 'PRESERVE');
    const stale = path.join(directory, 'dist/project/stale');
    mkdirSync(path.dirname(stale), { recursive: true });
    if (kind === 'directory') {
      symlinkSync(outside, stale);
    } else {
      mkdirSync(stale);
      symlinkSync(sentinel, path.join(stale, 'index.html'));
    }
    expect(() => removeStaleProjectHtml(path.join(directory, 'dist')))
      .toThrow(/symlinks|regular file/i);
    expect(readFileSync(sentinel, 'utf8')).toBe('PRESERVE');
  });
});
