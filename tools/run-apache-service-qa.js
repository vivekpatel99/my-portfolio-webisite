import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { request } from 'node:https';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { JSDOM } from 'jsdom';
import { serviceOffers, serviceRouteForId } from '../src/data/serviceOffers.js';
import { absoluteUrl, routeSeo, SITE_URL } from '../src/lib/seoConfig.js';

// Run the actual built .htaccess under Apache, including its HTTPS and host
// conditions. No deployment rules are removed or replaced for this fixture.
const dist = path.resolve('dist');
readFileSync(path.join(dist, '.htaccess'));
const directory = mkdtempSync(path.join(tmpdir(), 'portfolio-apache-service-qa-'));
const docker = (...args) => execFileSync('docker', args, { encoding: 'utf8', timeout: 120_000 }).trim();
let container;
let failure;

const fetchLocal = (port, pathname) => new Promise((resolve, reject) => {
  const req = request({
    hostname: '127.0.0.1', port, path: pathname,
    servername: new URL(SITE_URL).hostname,
    headers: { Host: new URL(SITE_URL).hostname },
    // Only the isolated loopback fixture uses this self-signed certificate.
    rejectUnauthorized: false,
  }, (res) => {
    res.setEncoding('utf8');
    let html = '';
    res.on('data', (chunk) => { html += chunk; });
    res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, html }));
    res.on('error', reject);
  });
  req.setTimeout(5000, () => req.destroy(new Error(`Apache request timed out: ${pathname}`)));
  req.on('error', reject);
  req.end();
});

const assertServicePage = (response, service, pathname) => {
  assert.equal(response.status, 200, `${pathname}: expected HTTP 200`);
  assert.match(response.headers['content-type'] ?? '', /^text\/html\b/, pathname);
  const dom = new JSDOM(response.html);
  try {
    const document = dom.window.document;
    const seo = routeSeo[serviceRouteForId(service.id)];
    const canonical = absoluteUrl(seo.path);
    const meta = (key) => document.querySelector(`meta[name="${key}"], meta[property="${key}"]`)?.content;
    assert.equal(document.title, seo.title, `${pathname}: title`);
    assert.equal(document.querySelector('link[rel="canonical"]')?.href, canonical, `${pathname}: canonical`);
    for (const prefix of ['og', 'twitter']) {
      assert.equal(meta(`${prefix}:title`), seo.title, `${pathname}: ${prefix} title`);
      assert.equal(meta(`${prefix}:description`), seo.description, `${pathname}: ${prefix} description`);
      assert.equal(meta(`${prefix}:url`), canonical, `${pathname}: ${prefix} URL`);
      assert.equal(meta(`${prefix}:image`), absoluteUrl(seo.image), `${pathname}: ${prefix} image`);
    }
    assert.equal(meta('description'), service.summary, `${pathname}: description`);
    assert.equal(meta('og:type'), 'website', `${pathname}: social type`);
    assert.equal(meta('twitter:card'), 'summary_large_image', `${pathname}: Twitter card`);
    assert.doesNotMatch(meta('robots') ?? '', /\b(noindex|none)\b/i, `${pathname}: service must be indexable`);
    assert.equal(document.querySelector('#root h1')?.textContent, service.title, `${pathname}: static heading`);
    for (const copy of [service.summary, ...service.inScope, ...service.outOfScope]) {
      assert.ok(document.querySelector('#root')?.textContent.includes(copy), `${pathname}: missing service content`);
    }
    assert.ok(document.querySelector('#root a[href="/contact"]'), `${pathname}: estimate link`);
  } finally {
    dom.window.close();
  }
};

try {
  execFileSync('openssl', [
    'req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '1',
    '-subj', '/CN=www.vivekapatel.com',
    '-keyout', path.join(directory, 'server.key'), '-out', path.join(directory, 'server.crt'),
  ], { stdio: 'ignore', timeout: 10_000 });
  writeFileSync(path.join(directory, 'httpd.conf'), `
ServerRoot "/usr/local/apache2"
Listen 443
ServerName www.vivekapatel.com:443
UseCanonicalName On
LoadModule mpm_event_module modules/mod_mpm_event.so
LoadModule unixd_module modules/mod_unixd.so
LoadModule authz_core_module modules/mod_authz_core.so
LoadModule dir_module modules/mod_dir.so
LoadModule mime_module modules/mod_mime.so
LoadModule rewrite_module modules/mod_rewrite.so
LoadModule headers_module modules/mod_headers.so
LoadModule ssl_module modules/mod_ssl.so
LoadModule socache_shmcb_module modules/mod_socache_shmcb.so
User daemon
Group daemon
ErrorLog /proc/self/fd/2
LogLevel warn
TypesConfig conf/mime.types
DirectoryIndex index.html
SSLEngine On
SSLCertificateFile conf/server.crt
SSLCertificateKeyFile conf/server.key
DocumentRoot "/usr/local/apache2/htdocs"
<Directory "/usr/local/apache2/htdocs">
  Options FollowSymLinks
  AllowOverride All
  Require all granted
</Directory>
`);
  const mounts = [
    [dist, '/usr/local/apache2/htdocs'],
    ...['httpd.conf', 'server.key', 'server.crt'].map((file) => [path.join(directory, file), `/usr/local/apache2/conf/${file}`]),
  ].flatMap(([source, target]) => ['--mount', `type=bind,source=${source},target=${target},readonly`]);
  container = docker('create', '--publish', '127.0.0.1::443', ...mounts,
    'httpd:2.4@sha256:41163d514c02ac205161c1549b499bc11adfdeb6291735b433d706af7e64382a');
  console.log(`Apache fixture container: ${container}`);
  docker('start', container);
  const bindings = JSON.parse(docker('inspect', '--format', '{{json .NetworkSettings.Ports}}', container));
  const port = Number(bindings['443/tcp'][0].HostPort);
  let ready = false;
  let readinessError;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetchLocal(port, '/');
      assert.equal(response.status, 200, 'Apache fixture home readiness');
      ready = true;
      break;
    } catch (error) {
      readinessError = error;
      await delay(1000);
    }
  }
  assert.ok(ready, `Apache did not become ready: ${readinessError?.message}`);

  let checked = 0;
  for (const service of serviceOffers) {
    const route = serviceRouteForId(service.id);
    const redirect = await fetchLocal(port, route);
    assert.equal(redirect.status, 301, `${route}: Apache directory-slash redirect`);
    assert.equal(redirect.headers.location, absoluteUrl(route), `${route}: redirect destination`);
    // Never follow redirects to a public host. Request each target on loopback.
    for (const pathname of [`${route}/`, `${route}/?source=route-qa`, `${route}/index.html`]) {
      assertServicePage(await fetchLocal(port, pathname), service, pathname);
      checked += 1;
    }
    checked += 1;
  }
  for (const pathname of ['/services/unknown-service', '/services/unknown-service/', '/services/unknown-service/?source=route-qa']) {
    const response = await fetchLocal(port, pathname);
    assert.equal(response.status, 404, `${pathname}: expected real HTTP 404`);
    const dom = new JSDOM(response.html);
    try {
      assert.equal(dom.window.document.title, 'Page Not Found | Vivek Patel', `${pathname}: 404 title`);
      assert.equal(dom.window.document.querySelector('meta[name="robots"]')?.content, 'noindex, nofollow', `${pathname}: 404 robots`);
    } finally {
      dom.window.close();
    }
    checked += 1;
  }
  const sitemap = await fetchLocal(port, '/sitemap.xml');
  assert.equal(sitemap.status, 200, 'sitemap HTTP status');
  for (const service of serviceOffers) {
    assert.ok(sitemap.html.includes(`<loc>${absoluteUrl(serviceRouteForId(service.id))}</loc>`), `${service.id}: sitemap entry`);
  }
  console.log(`Apache service QA passed: ${checked} route responses and all service sitemap entries.`);
} catch (error) {
  failure = error;
  console.error(error);
  if (container) {
    try { console.error(docker('logs', container)); }
    catch (logError) { console.error('Could not read Apache fixture logs:', logError.message); }
  }
  throw error;
} finally {
  try {
    if (container) docker('rm', '--force', container);
  } catch (cleanupError) {
    if (!failure) throw cleanupError;
    console.error('Could not remove Apache fixture:', cleanupError.message);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}
