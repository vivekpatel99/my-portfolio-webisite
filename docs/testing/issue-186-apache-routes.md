# Service route hosting regression checks

Issue: [#186](https://github.com/vivekpatel99/my-portfolio-webisite/issues/186),
from audit queue [#183](https://github.com/vivekpatel99/my-portfolio-webisite/issues/183).
Base: `develop` at `c53aa3a9ab3279e112af16ef15eb11a15e3c43ce`.

The route implementation from PR #214 is already on this base. This follow-up
makes its Apache acceptance checks repeatable and required in CI. It does not
establish which build the production host currently serves. Keep `Refs #186`
until the separate production verification is complete.

## Run locally

Install dependencies, a local Docker daemon, and OpenSSL, then run:

```sh
npm run build
npm run qa:apache-services
```

The runner mounts `dist`, including its unchanged `.htaccess`, read-only in a
temporary Apache 2.4.69 container. The Docker daemon must share the local
filesystem, as it does on the GitHub Linux runner. The multi-platform image is pinned by digest.
Apache serves HTTPS using a temporary self-signed certificate. Requests use the
production Host header and TLS server name, but connect only to a randomly
assigned loopback port. Redirect destinations are asserted without following
them to the public site. No application JavaScript or contact submissions run.

The fixture loads rewrite and header modules, permits deployment directives
with `AllowOverride All`, and enables `FollowSymLinks` for per-directory
rewrites. These requirements follow the
[Apache per-directory rewrite documentation](https://httpd.apache.org/docs/current/en/rewrite/htaccess.html).
The runner removes its container, certificate, and configuration in `finally`.

## Coverage

For every current service offer, the runner checks:

- The slashless URL returns Apache's 301 with the correct canonical destination.
- The trailing-slash, query-string, and explicit `index.html` URLs return HTTP
  200 and HTML content.
- HTML before JavaScript has the service heading, summary, both scope lists,
  and the estimate link.
- Title, description, canonical, Open Graph, and Twitter metadata match the
  offer; service HTML stays indexable.
- The HTTP-served sitemap includes the service's canonical URL.

Unknown service IDs, with and without a slash and with a query string, must
return real HTTP 404 responses carrying the not-found title and noindex metadata.
The existing build integrity checks still reject public links without generated
routes and drift between the service catalog, SEO entries, and Apache allowlist.

CI downloads the same complete production archive used by passive browser QA.
The new `apache-service-qa` job is a dependency of `test-and-build`; the result
gate rejects a missing, skipped, cancelled, or failed Apache job.

## Verification on 4 October 2026

- `npm run build`: passed; generated 21 static routes and checked 36 public links.
- `npm run qa:apache-services`: passed; 15 route responses and all service
  sitemap entries. The final run exited successfully after fixture cleanup.
- Targeted Vitest run: 54 tests passed across the service page, offer catalog,
  public route integrity, CI gate, and workflow tests.
- JavaScript syntax and `git diff --check`: passed.

Two negative controls alter generated output only: an incorrect service title
must fail the metadata assertion, and a rewrite that serves an unknown service
as HTTP 200 must fail the status assertion. Both files are restored byte for
byte after each control. Both controls failed at their intended assertions with
the final read-only fixture, and both generated files were restored exactly.

The full `npm test -- --maxWorkers=2` attempt was **not green**: 623 tests
passed, four failed, two were skipped, and seven worker-startup errors were
reported. Failures occurred in three publication fixture tests, the generator
integration test in `tools/case-study-route-integrity.test.js`, and the visual
editor suite's setup hook. These reported test, subprocess, hook, and worker
timeouts while several other builds and suites were active on the same machine.
Those files are unchanged by this PR; contention is a likely explanation, not
an independently proven baseline result. After the summary, the test runner
also timed out shutting down its worker; its remaining task-owned processes
were stopped. Required remote CI must pass before this draft PR is ready to merge.

Production response status, deployment, and release approval remain unverified.
