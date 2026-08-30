# Website review issues — 30 August 2026

**Source:** live-site + repo review of vivekapatel.com  
**Baseline:** hiring-client path (home → case study → contact)  
**Do not touch:** `plugins/`, Horizons Vite error handlers, `window.parent.postMessage`

Status: `done` · `blocked` · `later` · `skip` · `dismissed`

---

## Plan

| Wave | Goal | Status |
|------|------|--------|
| 1 | Self-host/compress assets, slug lists, cookie banner, SEO from case studies | done |
| 2 | 404, telemetry env, SPA pageviews, contact copy, error boundary | done |
| 3 | Policy copy, project stats, reduced motion, dead code, tests | done |
| Later | Email retry cap, leftover schema/client, JS split, trailing slashes | later |
| Owner | Real n8n client-canvas screenshot | blocked |

Required vs optional:

- **Required (waves 1–3):** anything a hiring client or crawler hits now.
- **Optional (later):** ops and cleanup that does not change what a visitor sees.
- **Skip:** CMS / extra generators. Three hardcoded case studies is the right shape.

How it was checked:

- `npm test` — 11 files, 88 tests.
- `node tools/generate-sitemap.js` — sitemap still generated from `routeSeo`.
- Browser checks on `http://127.0.0.1:3000` (see verification notes at the bottom).
- Live contact form was **not** submitted (writes production leads).

---

## Index

| ID | Issue | Severity | Status |
|----|-------|----------|--------|
| I-01 | 55.87 MB YOLO GIF on GitHub raw | hiring | done |
| I-02 | n8n hero is a stock n8n-io screenshot | hiring | done (stand-in) |
| I-03 | Other case-study images hotlinked to GitHub | hiring | done |
| I-04 | Profile photo 1.87 MB PNG | hiring | done |
| I-05 | Mobile cookie banner covers hero CTAs | hiring | done |
| I-06 | `social-media-app` leftover in `.htaccess` | crawler | done |
| I-07 | Slug lists can drift (`caseStudies` / `routeSeo` / Apache) | crawler | done |
| I-08 | Contact toast says "Message Sent" before email | trust | done |
| I-09 | Unknown project slug toasts and redirects home | UX | done |
| I-10 | `Routes` key remounts Layout (needed for old GA) | analytics | done |
| I-11 | Hardcoded GA ID / Sentry DSN fallback | privacy | done |
| I-12 | `127.0.0.1` treated as production for GA | privacy | done |
| I-13 | Per-email and global rate limits share one error | trust | done |
| I-14 | No React error boundary | resilience | done |
| I-15 | Cookie policy calls localStorage a cookie; one consent flag | copy | done |
| I-16 | Recycled profile stats on case studies | trust | done |
| I-17 | Contact validation is toast-only | a11y | done |
| I-18 | Dead `handleViewWorkClick` in Hero | hygiene | done |
| I-19 | `unexpected_error` status is never written | docs | done |
| I-20 | Budget strings duplicated FE/BE | hygiene | done |
| I-21 | Hero image preloaded on every static route | perf | done |
| I-22 | Pulse animation ignores reduced motion | a11y | done |
| I-23 | Email retries forever on Resend failure | ops | later |
| I-24 | `supabaseId` leftover on leads schema | hygiene | later |
| I-25 | `convexClient.js` is a large fake client for missing env | hygiene | later |
| I-26 | One large JS chunk | perf | later |
| I-27 | Internal links omit trailing slash vs canonicals | SEO | later |
| I-28 | Multiple scroll-to-top helpers | hygiene | later |
| I-39 | Real first-party n8n client canvas (not a stand-in) | hiring | blocked |
| D-01 | Rate-limit "race" | — | dismissed |
| D-02 | Add a CMS / publishing system | — | skipped |
| D-03 | May 2026 C01 (GA never loads) | — | dismissed |
| D-04 | May 2026 C02 (sitemap 404s) | — | dismissed |
| D-05 | "AnimatePresence does nothing" | — | dismissed |
| D-06 | Extra security headers / HSTS preload / legal code-split | — | dismissed |

---

## Wave 1 — assets, slugs, banner, SEO

### I-01 — 55.87 MB YOLO GIF

| | |
|--|--|
| **Status** | done |
| **Files** | `src/config/links.js`, `src/data/caseStudies.js`, `src/pages/Project.jsx`, `public/assets/case-studies/football-tracking.mp4` |

**Problem:** Gallery used GitHub raw `yolov12l_processed_121364_0.gif` (58,581,154 bytes). Cache was `max-age=300`.

**Fix:** Local ~1.3 MB MP4 + WebP poster. `CaseStudyMedia` renders `<video>` for `.mp4`/`.webm`.

---

### I-02 — n8n hero is someone else's editor

| | |
|--|--|
| **Status** | done (stand-in). Real canvas is I-39. |
| **Files** | `src/config/links.js`, `src/data/caseStudies.js` |

**Problem:** Hotlinked `n8n-io/n8n` readme screenshot (`localhost:5678`, another account).

**Fix:** First-party `planning-graph.webp`. Alt text no longer claims it is the n8n canvas.

---

### I-03 — GitHub-hotlinked case-study images

| | |
|--|--|
| **Status** | done |
| **Files** | `src/config/links.js`, `public/assets/case-studies/` |

**Problem:** Invoice and yoga images also came from GitHub raw.

**Fix:** `/assets/case-studies/invoice-ocr.webp` (137 KB) and `yoga-pose.webp` (32 KB).

---

### I-04 — 1.87 MB profile PNG

| | |
|--|--|
| **Status** | done |
| **Files** | `src/config/links.js`, `index.html`, `public/assets/images/vivek-black-and-white.webp` |

**Problem:** PNG was 1.87 MB for a ~504×378 slot.

**Fix:** ~71 KB WebP. PNG deleted.

---

### I-05 — Mobile cookie banner covers hero CTAs

| | |
|--|--|
| **Status** | done |
| **Files** | `src/components/CookieConsentBanner.jsx`, `src/components/CookieConsentBanner.test.jsx` |

**Problem:** `fixed bottom-4 left-4 right-4` measured ~358×374 over both hero buttons on a phone. Hero is `min-h-screen`, so any bottom sheet still covers those CTAs.

**Fix:** Mobile sits under the header (`top-20`, ~110px). Buttons are a single row. Long copy is `hidden sm:block`. Desktop stays a corner card (`sm:bottom-4 sm:max-w-lg`). Measured at 390×844: estimate and View Case Studies are not covered.

---

### I-06 — `social-media-app` leftover in Apache

| | |
|--|--|
| **Status** | done |
| **Files** | `public/.htaccess` |

**Problem:** Allowlist included a slug that is not a case study. Apache served the SPA; React then bounced home.

**Fix:** Allowlist is only the three live slugs.

---

### I-07 — Three slug lists can drift

| | |
|--|--|
| **Status** | done |
| **Files** | `src/lib/seoConfig.js`, `src/data/caseStudies.js`, `src/data/caseStudies.test.js` |

**Problem:** Adding a case study meant editing data, `routeSeo`, `.htaccess`, and QA lists by hand.

**Fix:** Project `routeSeo` is derived from `caseStudies`. Test asserts Apache allowlist, slugs, and `routeSeo` keys match, and that `social-media-app` is gone. No extra CMS/generator.

---

## Wave 2 — 404, telemetry, contact, errors

### I-08 — Contact toast lies

| | |
|--|--|
| **Status** | done |
| **Files** | `src/pages/Contact.jsx`, `tests/qa/qa-contact.spec.js`, `tests/qa/qa-contact-live.spec.js` |

**Problem:** "Message Sent" meant the Convex row existed. Email can still be `missing_api_key` or `resend_error`.

**Fix:** Success toast is **Request received**. Email retry cap is still I-23.

---

### I-09 — Unknown project slug redirects home

| | |
|--|--|
| **Status** | done |
| **Files** | `src/pages/Project.jsx`, `tests/qa/qa-routes.spec.js` |

**Problem:** Client nav toasted and replaced `/`. Apache already 404s unknown hard loads. Same mistake, two behaviors. Returning `null` also left a stale "Page Not Found" title on home.

**Fix:** Unknown slug renders `NotFound`. URL stays. No toast.

---

### I-10 — Layout remount used as pageview hook

| | |
|--|--|
| **Status** | done |
| **Files** | `src/App.jsx`, `src/components/GoogleAnalytics.jsx` |

**Problem:** `key={location.pathname}` on `Routes` remounted Header/Footer/consent. SPA pageviews piggybacked on that remount.

**Fix:** Key and `AnimatePresence` removed. `gtag('config')` runs on `useLocation`.

---

### I-11 — Hardcoded production telemetry IDs

| | |
|--|--|
| **Status** | done |
| **Files** | `src/components/GoogleAnalytics.jsx`, `src/lib/sentryTelemetry.js` |

**Problem:** Blank `VITE_GA_TRACKING_ID` / `VITE_SENTRY_DSN` still used live IDs.

**Fix:** No fallback. Missing env means telemetry stays off.

---

### I-12 — `127.0.0.1` counted as production

| | |
|--|--|
| **Status** | done |
| **Files** | `src/components/GoogleAnalytics.jsx` |

**Problem:** Only `localhost` was treated as local, so `vite preview` on `127.0.0.1` could send real hits.

**Fix:** Both hostnames skip GA.

---

### I-13 — Shared rate-limit error copy

| | |
|--|--|
| **Status** | done |
| **Files** | `convex/leads.ts`, `convex/leads.test.ts` |

**Problem:** Global 30/10-min cap and per-email cap used the same "you submitted too often" string.

**Fix:** Global: site is busy. Per-email: this address already sent several messages.

---

### I-14 — No React error boundary

| | |
|--|--|
| **Status** | done |
| **Files** | `src/components/ErrorBoundary.jsx`, `src/main.jsx` |

**Problem:** Sentry sits behind consent, so a first-paint crash was a black page and no report.

**Fix:** Thin boundary around the app with a home link. No extra reporting library.

---

## Wave 3 — copy, a11y, dead code, tests

### I-15 — Cookie policy vs actual storage

| | |
|--|--|
| **Status** | done |
| **Files** | `src/pages/DataPolicy.jsx` |

**Problem:** Policy talked about cookies while consent lives in `localStorage`. Banner uses one analytics flag for GA and Sentry.

**Fix:** Policy now names `cookie_consent_preferences`, says it is not a tracking cookie, and that one flag starts both GA and Sentry. Date: 30 August 2026.

---

### I-16 — Recycled profile stats on case studies

| | |
|--|--|
| **Status** | done |
| **Files** | `src/data/caseStudies.js` |

**Problem:** "11+ Projects" / "100% Job Success" showed as metrics from a single project.

**Fix:** Stats are project-specific. Home/contact proof strip still uses the profile numbers, which is correct.

---

### I-17 — Contact validation is toast-only

| | |
|--|--|
| **Status** | done |
| **Files** | `src/pages/Contact.jsx`, `src/pages/Contact.test.jsx` |

**Problem:** Missing fields only toasted. Screen readers and inline review suffered.

**Fix:** Field errors + `aria-invalid` + `aria-describedby`. Mutation is not called on invalid input.

---

### I-18 — Dead Hero handler

| | |
|--|--|
| **Status** | done |
| **Files** | `src/components/Hero.jsx` |

**Problem:** `handleViewWorkClick` was unused.

**Fix:** Deleted. Availability pulse respects `useReducedMotion`.

---

### I-19 — `unexpected_error` is never written

| | |
|--|--|
| **Status** | done |
| **Files** | `README.md` |

**Problem:** Status exists in schema/docs but no code path writes it.

**Fix:** README note. No fake writer.

---

### I-20 — Budget strings duplicated

| | |
|--|--|
| **Status** | done |
| **Files** | `src/lib/budgetOptions.js`, `src/pages/Contact.jsx` |

**Problem:** Options lived in Contact UI and `leadValidation.ts`.

**Fix:** Shared `BUDGET_OPTIONS` on the frontend. Backend still validates the same four strings.

---

### I-21 — Hero preload on every static HTML route

| | |
|--|--|
| **Status** | done |
| **Files** | `tools/generate-static-route-html.js` |

**Problem:** Contact/legal/project static HTML preloaded the home hero image.

**Fix:** Preload link stripped on non-home routes.

---

### I-22 — Reduced motion ignored

| | |
|--|--|
| **Status** | done |
| **Files** | `src/components/Hero.jsx`, `src/components/SectionAnimator.jsx` |

**Problem:** Pulse and section enter animations still ran under `prefers-reduced-motion`.

**Fix:** Both honor `useReducedMotion`.

---

## Later (optional)

### I-23 — Email retries forever

Cap Resend retries in the ten-minute cron. Glance at failed rows in the Convex dashboard. Do not add an eighth status.

### I-24 — `supabaseId` leftover

Optional field + index on `leads` from the import migration. Remove after confirming no import rerun is needed.

### I-25 — Fake Convex client

`src/lib/convexClient.js` is large for a missing-env fallback. Keep until a missing URL is shown to break local work.

### I-26 — One ~800 KB JS chunk

Route-split only if Lighthouse/CrUX says the home JS is the limiter. Legal pages are not the hiring path.

### I-27 — Trailing slash mismatch

Canonicals use a trailing slash. In-app `<Link>`s often omit it. Harmless for the SPA; tidy if crawler reports duplicate URLs.

### I-28 — Several scroll helpers

`ScrollToTop`, Header hash scroll, and `Project` `scrollTo(0,0)` overlap. Leave until a real double-scroll bug shows up.

---

## Blocked on you

### I-39 — Real n8n client canvas

The live card no longer uses the n8n-io stock screenshot. It uses a first-party planning graph instead.

To finish this: export a screenshot of the **actual client n8n workflow** (no other people's account names, no `localhost:5678`) and drop it in `public/assets/case-studies/`. Then point `portfolioImages.n8nWorkflow` at that file.

---

## Dismissed / skipped

| ID | Why |
|----|-----|
| D-01 Rate-limit race | Convex OCC retries the mutation. Two submits under a cap of 3 is allowed. |
| D-02 CMS | Three hardcoded studies is enough. Do not derive a publisher from `CONTEXT.md`. |
| D-03 May 2026 C01 | Layout already passes `hasConsent`. |
| D-04 May 2026 C02 | Sitemap slugs match the three live case studies. |
| D-05 AnimatePresence | Exit variants can still fire. The bug was the key above Layout (I-10). |
| D-06 Extra headers / legal split | CSP/headers are already serious. Desktop LCP was fine without the GIF in view. |

---

## What already worked (do not "fix")

- Apex → www 301
- All seven sitemap URLs return 200
- Unknown hard loads return HTTP 404 + `noindex`
- Per-route titles/OG in static HTML before JS
- Consent actually blocks GA and Sentry
- Custom cursor does not steal clicks
- Mobile nav has 44px targets
- Convex WebSocket opens without CSP errors
- Contact is insert-only and unauthenticated on purpose

---

## Verification notes

Local pass on `http://127.0.0.1:3002`, phone viewport 390×844:

- [x] Home: cookie bar is under the header; hero "Request a Project Estimate" is visible and clickable
- [x] `/project/yolo-computer-vision-optimization` plays `/assets/case-studies/football-tracking.mp4` (`readyState` 4)
- [x] `/project/n8n-openai-data-extraction` uses `/assets/case-studies/planning-graph.webp` (not n8n-io)
- [x] `/contact` empty submit shows "Name is required", "Email is required", "Project description is required"
- [x] `/project/nonexistent-slug` stays on that URL, heading "Page Not Found", `noindex, nofollow`, no toast
- [x] Live contact form was not submitted
