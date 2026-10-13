# Issue 361: homepage static rendering verification

Issue: [#361](https://github.com/vivekpatel99/my-portfolio-webisite/issues/361).
Delivery: [PR #376](https://github.com/vivekpatel99/my-portfolio-webisite/pull/376) into `develop`.
Integration base: `a843c7f`, including the accepted card-diagram, related-work,
and testimonial-metadata updates from `develop`. Final implementation and check
results are available on the PR head.

The production generator renders the existing Home components into the initial
HTML, including the shared header to preserve its 69px layout space. Server
section wrappers render in their settled position. The Role h1, introduction, approved invoice, rate, portrait, public work
and service links, and inquiry destination share their browser content sources.
The existing client `createRoot` replaces that output once. Other routes use the
empty shell; repeat generation removes only the generator's marked homepage.

Hero CSS honors reduced motion before JavaScript runs (DESIGN DP-01, confirmed).
Static mobile-menu and testimonial slide controls are natively disabled and become interactive
with client rendering (BT-01). The existing hero motion lifecycle and confirmed
content remain intact. The accepted #360 card-diagram change is preserved.

## Observed local checks

- Node 24.21.0 production builds passed before and after integration: 21 HTML
  outputs and 39 checked public links. Tracked build inputs stayed unchanged.
- 97 focused unit checks passed across Hero, Home, Testimonials, and route
  integrity. The real-generator test checks repeated HTML equality, unchanged
  source inputs, and absence of homepage content from contact and 404 output.
  The final header/section fixes also passed 40 focused Header, SectionAnimator,
  and real-generator checks; the integrated route/artifact checks passed 65.
- All 28 original homepage browser checks passed before and after integration. Chromium and WebKit desktop/mobile projects cover 1440,
  390, and 320px, with and without JavaScript, plus native project navigation,
  reduced motion, disabled static controls, working client controls, one h1,
  no duplicate sections or console errors, and horizontal reflow.
  The expanded final suite adds eight delayed-entry checks: 35 of 36 passed
  in the full run, and the one WebKit mobile click timeout passed in an
  isolated rerun. All delayed-entry checks passed, retaining header height
  and h1 position when JavaScript starts.
- Static and JavaScript screenshots at 1440 and 320px were inspected. The
  existing invoice and portrait composition remained readable, including the
  final shared-header fallback.
- Local-only SEO passed. Apache service QA passed 15 HTTP responses and all
  service sitemap entries using the actual generated deployment rules.
- ESLint checks passed with no lint findings; the existing Babel preset emitted
  its undeclared-dependency notice. `git diff --check` passed.
- Independent standards and specification reviews cleared the implementation
  and the integration resolution, including both browser suite registrations
  and the sanitizer allowlist entry.

The broad host and container unit attempts did **not** pass: worker, fixture,
media-probe, and hook timeouts occurred under severe host I/O contention. The
combined integrated browser run also encountered timeouts and was stopped.
These runs are not counted as passing acceptance evidence. The final expanded
home run had one WebKit click timeout during host I/O stalls; its isolated rerun
passed, as recorded above. Final required CI
on the delivered PR head must pass before merging; consult the PR's checks and
sanitized browser artifacts for the final integrated results.

The prior integrated CI passed full unit tests, production build, Apache routes,
and all other QA jobs; one reduced-motion test failed on an immediate parallax
assertion. CSS stops animations before React handles the media-query change.
The test now waits for neutral parallax and still checks that subsequent input
produces no writes. The revised reduced-motion regression passed three local
repetitions. Final CI must verify this timing fix.

## Repeat acceptance

With Node 24, browser prerequisites, Docker, and OpenSSL available:

1. Run `npm ci`, `npm test -- --maxWorkers=2`, and `npm run build` with a valid
   production-like `VITE_CONVEX_URL`.
2. Start `npm run preview` and run the `qa-static-home.spec.js` and
   `qa-card-diagrams.spec.js` suites through `tests/qa/qa.config.js` with
   `QA_LOCAL_ONLY=1`, including all four preview projects.
3. Run local-only `npm run qa:seo` and `npm run qa:apache-services`.
4. Confirm final PR head checks and resolved review conversations before merge.

No production deployment, real contact submission, or parent-issue mutation is
part of this task. Temporary captures and diagnostic output are disposable;
the browser assertions and sanitized CI artifacts supply repeatable evidence.
