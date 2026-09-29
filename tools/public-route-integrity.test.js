// @vitest-environment node
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { serviceOffers } from '../src/data/serviceOffers.js';
import { routeSeo } from '../src/lib/seoConfig.js';
import {
  assertPublicLinksRouted,
  assertServiceRouteSources,
  internalLinksFromHtml,
  literalPageLinksFromSource,
  serviceIdsFromDeploymentConfig,
  staticOutputServesPath,
} from './public-route-integrity.js';

const directories = [];
afterEach(() => directories.splice(0).forEach((directory) => rmSync(directory, { recursive: true, force: true })));

const htaccess = readFileSync('public/.htaccess', 'utf8');
const serviceIds = serviceOffers.map((offer) => offer.id);

const distFixture = (files) => {
  const directory = mkdtempSync(path.join(tmpdir(), 'public-route-fixture-'));
  directories.push(directory);
  for (const [file, contents] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(directory, file)), { recursive: true });
    writeFileSync(path.join(directory, file), contents);
  }
  return directory;
};

describe('service route sources', () => {
  it('allowlists exactly the catalog service IDs in public/.htaccess', () => {
    expect(serviceIdsFromDeploymentConfig(htaccess)).toEqual(serviceIds);
    expect(() => assertServiceRouteSources({ htaccess })).not.toThrow();
  });

  it('gives every service a self-canonical SEO entry', () => {
    for (const offer of serviceOffers) {
      const seo = routeSeo[`/services/${offer.id}`];
      expect(seo.path).toBe(`/services/${offer.id}`);
      expect(seo.title).toContain(offer.name);
      expect(seo.description).toBe(offer.summary);
    }
  });

  it('fails when the Apache allowlist is missing a service', () => {
    const drifted = htaccess.replace('|ai-workflow-buildout', '');
    expect(() => assertServiceRouteSources({ htaccess: drifted })).toThrow(/Service deployment routing .*missing: ai-workflow-buildout/);
  });

  it('fails when the Apache allowlist has an unknown service', () => {
    const drifted = htaccess.replace('|ai-workflow-buildout)', '|ai-workflow-buildout|retired-service)');
    expect(() => assertServiceRouteSources({ htaccess: drifted })).toThrow(/stale: retired-service/);
  });

  it('fails when the service allowlist rule is removed', () => {
    const drifted = htaccess.replace(/^\s*RewriteRule \^services\/.*$/m, '');
    expect(() => assertServiceRouteSources({ htaccess: drifted })).toThrow(/exactly one service allowlist/);
  });
});

describe('public link routing check', () => {
  const html = (links) => `<html><body>${links.map((href) => `<a href="${href}">x</a>`).join('')}</body></html>`;

  it('extracts only same-origin page paths', () => {
    expect(internalLinksFromHtml(html([
      '/contact', '/#services', 'https://www.vivekapatel.com/legal/', 'https://github.com/x', 'mailto:a@b.c', '#top',
      '/assets/case-studies/gallery.webp',
    ]))).toEqual(['/contact', '/', '/legal/']);
  });

  it('finds literal client links that are absent from prerendered HTML', () => {
    const source = `<Link to="/services/missing" />
      <a href="/#services">Services</a>
      React.createElement(Link, { to: '/contact' })
      <a href="https://www.vivekapatel.com/legal/">Legal</a>
      <a href="https://example.com/other">External</a>
      <img src="/assets/photo.webp" />`;
    expect(literalPageLinksFromSource(source)).toEqual(['/services/missing', '/', '/contact', '/legal/']);
  });

  it('matches Apache static resolution: directory index or regular file only', () => {
    const dist = distFixture({ 'index.html': '', 'services/known/index.html': '', 'robots.txt': '' });
    expect(staticOutputServesPath(dist, '/')).toBe(true);
    expect(staticOutputServesPath(dist, '/services/known')).toBe(true);
    expect(staticOutputServesPath(dist, '/services/known/')).toBe(true);
    expect(staticOutputServesPath(dist, '/robots.txt')).toBe(true);
    expect(staticOutputServesPath(dist, '/services/unknown')).toBe(false);
    expect(staticOutputServesPath(dist, '/services')).toBe(false);
    expect(staticOutputServesPath(dist, '/../index.html')).toBe(false);
  });

  it('passes when every source and static link has a route', () => {
    const dist = distFixture({
      'index.html': html(['/services/known']),
      'services/known/index.html': html(['/', '/#services']),
    });
    expect(assertPublicLinksRouted(dist, { sourceLinks: ['/', '/services/known'] })).toBe(2);
  });

  it('fails on a source link with no prerendered route', () => {
    const dist = distFixture({ 'index.html': '' });
    expect(() => assertPublicLinksRouted(dist, { sourceLinks: ['/services/missing'] }))
      .toThrow('Public links have no static route: /services/missing (from source)');
  });

  it('fails on a link inside generated HTML with no route', () => {
    const dist = distFixture({ 'index.html': '', 'case-studies/index.html': html(['/project/withdrawn/']) });
    expect(() => assertPublicLinksRouted(dist, { sourceLinks: ['/'] }))
      .toThrow(`/project/withdrawn/ (from ${path.join('case-studies', 'index.html')})`);
  });
});
