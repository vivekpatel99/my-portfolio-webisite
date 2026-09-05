# Repository audit and local optimization — 2026-09-05

## Outcome and authority

Completed three passes: repository audit/baseline, bounded cleanup/optimization, and adversarial regression verification. This is an improved **local working tree**, not a deployment or closure of [Issue #14](https://github.com/vivekpatel99/my-portfolio-webisite/issues/14).

Baseline HEAD: `fc25b67d6c894cb0f2f75836d3d129e2f2290d37`. Initial `git status --short --untracked-files=all` showed only `?? .agents/sol-advisor/`. That pre-existing nested repository was left untouched. No staging, commits, pushes, worktrees, deployment, issue edits, backend mutations, or valid contact submissions were performed. Work used the current checkout.

Initial JavaScript fell from **503,925 to 397,713 bytes (21.1%)**, and gzip from **157,540 to 125,762 bytes (20.2%)**. Eight unused direct dependencies and 55 lockfile package entries were removed without changing any retained package version. All 124 Vitest tests and 151 passive Playwright checks pass. Homepage mobile Lighthouse scores are **95 performance / 97 accessibility / 100 best practices / 100 SEO**. Strict mobile FCP and LCP goals remain unmet; see measurements below.

## Pass 1 — scope, evidence, baseline

Read repository/user AGENTS instructions, `package.json`, Convex generated guidelines, all native QA specifications/configuration and SEO script, entry points, routes, components, hooks, libraries, data, CSS, build/static-HTML/sitemap tools, CI, hosting configuration, and backend validation/schema/mutation/cron/migration code. Inventory included bundled developer tooling and documentation; vendor skill prose, generated Convex output and the pre-existing untracked plugin were not treated as disposable application code.

An AST scan parsed **107 tracked JavaScript/TypeScript files, with zero parse failures**, including plugin tooling, to establish dependency references. This complements direct reading; it is not a claim of formal verification of every line. Raw reference results are retained with the local evidence.

| Area | Finding and disposition |
| --- | --- |
| React routes and startup | All routes and the Convex provider loaded eagerly. Only Contact calls a Convex hook. Split secondary routes; keep Home, layout and 404 immediately available. |
| Telemetry | Static Sentry/Convex imports coupled optional telemetry to startup. Deferred configured initialization with revocation checks; preserved sampling, masking, tracing targets and consent interface. |
| Animation lifecycle | NumberTicker used a controller never bound to an element, an unused local variable, and an uncancelled RAF chain. Cursor listened to mouse movement even when unavailable. Fixed these directly. |
| Dependencies | Eight Radix packages had no tracked code references, config uses or runtime consumers. Removed their declarations and orphaned lock entries. |
| Test discovery | Baseline `npm test` passed 117 tests but failed four bundled Bun suites on `bun:test`. Those belong to pstack's own package, whose test command is `bun test orch watch-pr`. Excluded that independent plugin tree from website Vitest discovery. No application/backend test was removed. |
| Vite diagnostics | `console.warn = () => {}` suppressed all process warnings; a custom logger also swallowed PostCSS syntax diagnostics. Removed both. |
| Build minification | Existing Terser dependency was available but Vite used its default minifier. Explicit Terser further reduced entry gzip from 129.68 kB (rounded build output) to 125,762; final exact bytes below control. No new dependency. |
| Components/UI | Current Radix wrappers, `cn`, button variants, toast store and section wrappers have real consumers. Retained. Repeated icons, descriptive comments, small arrays and formatting differences do not justify a broad rewrite. |
| Assets/CSS/fonts | About/portfolio images already lazy-load and aspect-ratio containers reserve space; case-study images are WebP. Hero background is preloaded. System fonts require no font downloads. CSS stayed byte-identical. No speculative CSS/asset deletion or image replacement. |
| SEO/hosting | Static route-specific titles, canonicals, social tags, hreflang, structured data, 404 behavior and sitemap checks retained. Apache-specific response rules cannot be validated by Vite preview. |
| Backend | Public lead mutation validates inputs and applies bounded indexed rate limits; internal email claims/retries use bounded batches; legacy cleanup is paginated. Kept schema, indexes, migration compatibility fields, function arguments and responses unchanged. No Convex deployment/validation command was needed because no `convex/` code changed; existing Convex tests ran in the full suite. |
| Developer plugins | Hostinger editor plugins are dev-gated and still consume Babel tooling. Bundled pstack is an independent tool package. Neither is presumed dead because it is absent from the production bundle. |

### Baseline verification

- Production build passed: one 503.93 kB JS entry, 34.11 kB CSS.
- Full Vitest: 117 passing tests in 13 suites; four unrelated Bun-suite loading failures.
- Passive preview desktop/mobile Playwright: 151 passed, five intentionally skipped, 59.0s.
- Native SEO: preview and production checks passed; script returned only the positive JSON-LD finding.
- Three mobile and one desktop homepage Lighthouse runs recorded before changes. The first mobile run overlapped baseline QA, so its faster result is not treated as a standalone controlled comparison. Other baseline runs and final runs establish the reported median/range. These remain same-machine lab observations, not statistical proof of real-user improvement.

## Pass 2 — implemented changes

| Files | Change / justification |
| --- | --- |
| `src/App.jsx`, `src/components/Layout.jsx` | Lazy-load Contact, Project, Legal and DataPolicy. Suspense stays inside the main landmark; navigation/footer remain available, with an accessible loading status. No home-section lazy rendering or anchor timing changes. |
| `src/main.jsx`, new `src/pages/ContactRoute.jsx` | Move ConvexProvider to the contact route, preserving the existing singleton client and Contact component. Home no longer downloads the contact backend client. |
| `src/lib/sentryTelemetry.js` | Dynamically load the configured SDK/client only when consent requests initialization; deduplicate in-flight loads, check current consent after download, handle failures, preserve close/capture behavior after initialization. |
| `src/components/Stats.jsx` | Remove unattached animation controller and unread variable; cancel the outstanding frame on unmount/dependency change. Preserve values, decimal precision, duration and rendered markup. |
| `src/components/CustomCursor.jsx`, `src/hooks/useMousePosition.js` | Subscribe only while the cursor is enabled; cancel/reset pending frame on disable so re-enabling works. Preserve cursor appearance and spring parameters. |
| `package.json`, `package-lock.json` | Remove eight unused direct dependencies. Lockfile packages: 823 → 768, including the root entry; zero retained version changes. |
| `vite.config.js` | Restore normal warning/error reporting and select existing Terser for minification. Keep dev editor integrations and production hosting behavior. |
| `vitest.config.ts` | Exclude the independently packaged `plugins/pstack/**` Bun suites from the website runner. |
| New `src/lib/sentryTelemetry.test.js`, `src/hooks/useMousePosition.test.jsx`, `src/components/Stats.test.jsx` | Seven regression tests covering consent/download races, initialization failure/deduplication, privacy settings, cursor resubscription and animation cancellation/decimal completion. |
| `public/sitemap.xml` | The required native build regenerated seven `lastmod` values from 2026-06-17 to 2026-09-03, derived from existing Git history. This happened in the baseline build too. URLs and priorities unchanged; no manual SEO rewrite. |
| This report | Findings, evidence, limitations and reproduction instructions. |

Removed direct dependencies: `@radix-ui/react-alert-dialog`, `@radix-ui/react-avatar`, `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-label`, `@radix-ui/react-select`, `@radix-ui/react-slider`, `@radix-ui/react-tabs`.

Removal used npm's offline uninstall with scripts/audit/funding disabled. No component files were deleted. Retained `@emotion/is-prop-valid`: Framer Motion declares it as an optional dependency, so absence of a direct source import is not evidence of uselessness. Retained Babel for the active dev plugins. Removed packages were already tree-shaken from the baseline browser build; their removal improves installation/maintenance footprint, not the claimed page-load reduction.

## Bundle measurements

Exact byte counts use filesystem bytes and Node `gzipSync`, not rounded build output. Decimal kB = 1,000 bytes.

| Asset scope | Before bytes | After bytes | Before gzip | After gzip |
| --- | ---: | ---: | ---: | ---: |
| Initial homepage JS | 503,925 | 397,713 | 157,540 | 125,762 |
| All emitted JS, including deferred routes | 503,925 | 500,818 | 157,540 | 156,720 |
| CSS | 34,109 | 34,109 | 7,038 | 7,038 |

Deferred JS: ContactRoute 82,402 / 23,535 gzip; Project 9,176 / 3,139; Legal 7,110 / 2,404; DataPolicy 4,417 / 1,880. Splitting primarily changes **when bytes are downloaded**, not total application functionality. Gzip totals sum separately compressed assets.

The measured normal build has no active Sentry DSN, allowing production dead-code elimination. Therefore do not attribute its timing savings to a 331 kB Sentry chunk. A separate build with an inert `example.invalid` test DSN successfully emitted the SDK separately (331.00 kB / 104.46 kB gzip) and kept the entry at 398.78 kB / 126.30 kB gzip. That configuration-only build was not served to a live telemetry endpoint.

## Lighthouse measurements and Issue #14

Pinned Lighthouse **12.8.2**, installed outside the repository under `/tmp/astra-audit-20260905/tooling`, using installed headless Google Chrome, default simulated mobile throttling and desktop preset. Normal initial consent state, no flags disabling animation, no blocked image requests, same machine and same built Vite preview. Source/build environment was kept constant between measured builds. Raw reports contain exact Chrome version, timestamps and throttling settings.

Metrics below are milliseconds except unitless CLS. TTI is Lighthouse's `interactive` diagnostic; it is **not INP or field interactivity**. Scores are Performance / Accessibility / Best Practices / SEO.

| Homepage run | Scores | FCP ms | LCP ms | TTI ms | TBT ms | CLS |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Before mobile 1 | 95 / 97 / 100 / 100 | 1652.685 | 2728.685 | 2776.285 | 1 | 0 |
| Before mobile 2 | 93 / 97 / 100 / 100 | 1652.477 | 3078.715 | 3131.215 | 0.5 | 0 |
| Before mobile 3 | 93 / 97 / 100 / 100 | 1651.717 | 3077.575 | 3130.075 | 0.5 | 0 |
| After mobile 1 | 95 / 97 / 100 / 100 | 1501.823 | 2777.735 | 2830.235 | 0 | 0 |
| After mobile 2 | 95 / 97 / 100 / 100 | 1501.879 | 2852.819 | 2897.819 | 0 | 0 |
| After mobile 3 | 95 / 97 / 100 / 100 | 1501.673 | 2852.509 | 2897.509 | 0.5 | 0 |
| Before desktop | 100 / 97 / 100 / 100 | 401.402 | 722.103 | 730.103 | 0 | 0.000130 |
| After desktop | 100 / 97 / 100 / 100 | 362.322 | 688.037 | 695.582 | 0 | 0.000130 |

Mobile median changes: FCP 1652.477 → 1501.823 ms (9.1% lower); LCP 3077.575 → 2852.509 ms (7.3% lower); TTI 3130.075 → 2897.509 ms (7.4% lower). Individual timings vary; do not equate the build's 21.1% initial-byte reduction with a 21.1% speed improvement.

| Requested homepage target | Local result |
| --- | --- |
| All four scores >90 | Pass in every baseline/final homepage run |
| FCP <1.5s | Desktop pass; mobile **not met**, ~1.502s, not rounded down to pass |
| LCP <2.5s | Desktop pass; mobile **not met**, median 2.853s |
| CLS <0.1 | Pass |
| Interactivity <3s | Desktop pass; all final mobile TTI runs pass |
| Production Lighthouse evidence | **Unavailable: HTTP 403** in headless audit; no scores claimed |
| Production issue resolved | **Not established**; no changes deployed |

The initial LCP diagnostic identifies the hero paragraph, with render delay contributing 83% in the first baseline. Hero text deliberately starts transparent and uses staggered entrance animations. Those timings and design were retained. Optimizing further by making content visible immediately, prerendering body content, or changing CSS delivery would require a separately reviewed behavior/rendering change; this audit does not silently make that tradeoff to hit a score.

### Direct-route regression measurements

Single mobile runs, same Lighthouse configuration, preserved baseline on port 4174 and final preview on 4173. These spot checks are not repeated medians.

| Direct entry | Scores before → after | FCP ms before → after | LCP ms before → after | TTI ms before → after | CLS |
| --- | --- | --- | --- | --- | --- |
| Contact | 98/97/100/100 → 98/97/100/100 | 1651.949 → 1593.967 | 2102.923 → 2135.960 | 2102.923 → 2135.960 | 0 both |
| YOLO project | 98/96/100/100 → 98/96/100/100 | 1651.551 → 1593.018 | 2327.327 → 2326.822 | 2349.827 → 2349.322 | 0 both |

Contact LCP/TTI rose about 33 ms in this sample; do not claim universal route speedups. Both direct routes still miss the strict mobile FCP goal, while their LCP and TTI are within target. Scores shown elsewhere are explicitly homepage scores, not a claim every route scores identically.

### Production evidence, separate from local improvement

Production `https://www.vivekapatel.com/` was opened in native Chrome through Codex computer control. After its automatic browser check, the homepage rendered; rejecting optional cookies and navigating to Contact worked. No challenge was manually bypassed. The separate headless Lighthouse request returned `ERRORED_DOCUMENT_REQUEST`, HTTP 403, with all four scores null. This is **not** a performance score for the portfolio or proof the deployed site improved.

Native SEO checks fetched and passed the seven expected routes on production both before and after local work. That verifies fetched metadata only, not production Lighthouse acceptance, cache behavior, deployed code parity, or actual lead/email delivery.

## Pass 3 — adversarial regression verification

- Focused Vitest: **28 tests, six suites passed** (ticker, cursor, telemetry lifecycle, Contact and Project).
- Full website/Convex Vitest: **124 tests, 16 suites passed**. No application/backend coverage excluded; pstack's separate Bun package was not changed or claimed tested.
- Final production build passed with Terser. Additional configured-Sentry build passed without running telemetry.
- Final passive preview desktop/mobile Playwright: **151 passed, five skipped**, 58.2s. Covers routes and unknown slugs, navigation/hash links, responsive layout, mobile keyboard/menu isolation, cookie preferences, reduced motion, screenshots, decimals and invalid-only form handling.
- Native SEO checks passed against running final preview and production.
- **16 baseline/final comparisons**: eight routes at widths 390 and 1280. Identical main text, link text/hrefs/accessible names, head metadata, section heights and overflow results. These comparisons use reduced motion and settled rendering; they do not prove identical animation frames. CSS bytes are identical. Baseline/final homepage screenshots retained.
- Native Chrome local interaction: Services navigation, accordion expansion, rejected optional cookies, lazy Contact navigation, empty-form errors/toast. No valid data submitted.
- Additional write-blocked Playwright check passed: no secondary route chunks requested on Home, Contact chunk requested on navigation, zero writes from empty validation, and a deliberately failed Contact chunk reaches the existing error boundary and recovers through Back to home.
- Baseline/final mobile homepage screenshots were visually inspected and show the same design.
- Fresh working-tree diff inspected for content, backend, telemetry settings and dependency-version drift. `git diff --check` and `npm ls --omit=dev --depth=0` passed. HEAD is unchanged and the index diff is empty.

## Remaining risks and consciously deferred work

1. Mobile FCP/LCP miss the strict brief. All-score >90 does not erase these timing failures. Production must be measured on a deployed build before #14 can be considered resolved.
2. Existing Lighthouse accessibility findings remain: footer copyright contrast (~4.02:1 versus 4.5:1), and the Upwork badge's accessible name omitting part of its visible label. Do not interpret 97 as complete accessibility compliance. Brand colors/labels were not rewritten in this optimization scope.
3. Existing project video autoplays without a visible pause control; several animations only partially honor reduced motion. Retained intentional behavior and recorded follow-up rather than silently changing design/accessibility behavior.
4. Existing image sizing/format opportunities remain, including the logo and remote hero/team images. Existing image ratio wrappers mitigate layout shifts. No unverified asset replacement, lossy recompression or speculative image deletion.
5. Existing Browserslist database is reported 21 months old. Warning is now visible. Updating it could change generated CSS/browser support and was not bundled into cleanup.
6. Lazy routes add a first-navigation chunk request. Suspense preserves the surrounding layout; the existing ErrorBoundary handles a failed module load. Deployment must retain old hashed assets long enough for already-open tabs and return real 404s for missing assets. No hosting/cache policy was changed.
7. Deferred telemetry cannot capture exceptions until SDK initialization completes. Consent withdrawal during download prevents initialization; tests verify it. No live Sentry/GA ingestion or contact email delivery was exercised.
8. Convex retry delivery has external-side-effect/idempotency considerations and legacy schema compatibility. No speculative removal of migration fields, public response keys or indexes; remote data was not inspected or modified.
9. Production/preview differ in CDN challenges, caching, compression, security headers and hosting rewrite semantics. Vite local scores do not certify those production characteristics. Native Playwright screenshot checks assert dimensions/availability, not a pixel-perfect reference comparison.

## Local evidence and reproduction

Raw reports, logs, dependency reference inventory, exact bundle counts, parity script/results and screenshots are retained in ignored **`.lighthouseci/astra-2026-09-05/`**. Original baseline build and pinned measurement tooling are in `/tmp/astra-audit-20260905/`. `measurement-summary.json` includes report hashes/settings; raw artifacts remain local and are not added as repository bloat. This report is the durable summary.

```sh
npm test
npm run build
npm run preview -- --port 4173 --strictPort
QA_PREVIEW_URL=http://127.0.0.1:4173 npm run qa:playwright:ci -- --workers=2
QA_PREVIEW_URL=http://127.0.0.1:4173 npm run qa:seo
node /tmp/astra-audit-20260905/tooling/node_modules/lighthouse/cli/index.js \
  http://127.0.0.1:4173/ --chrome-flags='--headless' \
  --only-categories=performance,accessibility,best-practices,seo \
  --output=json --output-path=/tmp/home-mobile.json --quiet
# Repeat mobile three times; add --preset=desktop for the desktop profile.
```

Never use `qa:playwright:live-contact` for these passive checks. To limit the native SEO script to local-only checks, set both `QA_PREVIEW_URL` and `QA_PROD_URL` to the preview URL, as CI does, and label that output local-only.
