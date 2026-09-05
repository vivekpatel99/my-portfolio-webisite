# All Issues — horizons-website Codebase Review

**Date:** 2026-05-24  
**Review mode:** Deep (3 parallel specialists)  
**Total issues:** 47  
**Baseline:** lint ✅ · format ✅ · build ✅

---

## Table of Contents

- [Critical (9–10)](#critical-910)
- [Major (7–8)](#major-78)
- [Meaningful (4–6)](#meaningful-46)
- [Minor (1–3)](#minor-13)
- [Horizons-Sensitive](#horizons-sensitive)
- [Index by Category](#index-by-category)

---

## Critical (9–10)

### C01 — Google Analytics never loads

| Field | Value |
|-------|-------|
| **Impact** | 9 |
| **Category** | Bug |
| **Files** | `src/components/Layout.jsx:55`, `src/components/GoogleAnalytics.jsx:8` |
| **Horizons-sensitive** | No |

**Problem:** Layout renders `{gaConsent && <GoogleAnalytics />}` when consent is granted, but never passes the `hasConsent` prop. Inside `GoogleAnalytics`, `if (!hasConsent) return` always exits because `undefined` is falsy.

**Effect:** Analytics is completely blind — no pageviews or events are recorded even after the user accepts cookies.

**Suggested fix:** Always mount `<GoogleAnalytics hasConsent={gaConsent} />` and remove the redundant conditional mount, or drop the internal prop check.

---

### C02 — Sitemap project URLs are soft 404s

| Field | Value |
|-------|-------|
| **Impact** | 9 |
| **Category** | SEO |
| **Files** | `tools/generate-sitemap.js:8`, `src/pages/Project.jsx:14`, `src/components/Portfolio.jsx:5` |
| **Horizons-sensitive** | No |

**Problem:** Sitemap generator lists 6 project slugs (`football-tracking`, `medical-segmentation`, etc.), but `Project.jsx` only defines data for `social-media-app`. All other slugs hit `navigate('/')`.

**Effect:** Search engines crawl 6 URLs that redirect to homepage — soft 404s hurt SEO trust and waste crawl budget.

**Suggested fix:** Populate `projectData` for all sitemap slugs, or remove project URLs from sitemap until case studies exist.

---

### C03 — Tailwind `bg-primary` tokens broken

| Field | Value |
|-------|-------|
| **Impact** | 9 |
| **Category** | Config |
| **Files** | `tailwind.config.js:25-36`, `src/components/ui/button.jsx:11` |
| **Horizons-sensitive** | No |

**Problem:** Color tokens use lowercase `default:` instead of shadcn convention `DEFAULT:`. This generates `bg-primary-default` instead of `bg-primary`.

**Effect:** Semantic UI tokens (`bg-primary`, `bg-destructive`, etc.) don't resolve. Components fall back to explicit utility classes, masking the bug in builds.

**Suggested fix:** Rename all `default:` keys to `DEFAULT:` in `tailwind.config.js` under `theme.extend.colors`.

---

### C04 — Sentry captures PII + full session replay

| Field | Value |
|-------|-------|
| **Impact** | 9 |
| **Category** | Security / GDPR |
| **Files** | `src/main.jsx:12-21` |
| **Horizons-sensitive** | No |

**Problem:** `sendDefaultPii: true` with `replayIntegration()` and `replaysOnErrorSampleRate: 1.0`. Contact form fields (name, email, description) can appear in Session Replay.

**Effect:** GDPR violation risk — personal data from contact form may be stored in Sentry without explicit consent.

**Suggested fix:** Set `sendDefaultPii: false`. Configure `replayIntegration({ maskAllText: true, maskAllInputs: true })`. Add `beforeSend` scrubber for `/contact` route.

---

### C05 — Hardcoded Supabase credentials

| Field | Value |
|-------|-------|
| **Impact** | 9 |
| **Category** | Security |
| **Files** | `src/lib/customSupabaseClient.js:3-5` |
| **Horizons-sensitive** | No |

**Problem:** Supabase project URL and anon JWT key are committed as string literals. Zero `import.meta.env` usage anywhere in `src/`.

**Effect:** Keys are exposed in every client bundle. Cannot rotate credentials without redeploying. No environment separation (dev/staging/prod).

**Suggested fix:** Move to `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Validate at startup. Rotate key if repo is public.

---

## Major (7–8)

### M01 — Contact email failure shows success

| Field | Value |
|-------|-------|
| **Impact** | 8 |
| **Category** | Fail-fast |
| **Files** | `src/pages/Contact.jsx:105-116` |
| **Horizons-sensitive** | No |

**Problem:** After Supabase DB insert succeeds, if the `contact-form-email` edge function fails, the error is only `console.error`'d. User still sees "Message Sent!" toast.

**Effect:** Lead is saved but owner is never notified. Silent revenue loss.

**Suggested fix:** Show partial-failure/warning toast. Capture to Sentry with lead ID. Optionally retry email invoke.

---

### M02 — Consent revocation doesn't disable GA

| Field | Value |
|-------|-------|
| **Impact** | 8 |
| **Category** | Retry / GDPR |
| **Files** | `src/components/CookieConsentBanner.jsx:92-98`, `src/components/Layout.jsx:38` |
| **Horizons-sensitive** | No |

**Problem:** `handleRejectAll` and save-with-analytics-off update localStorage but never call back to set `gaConsent` to `false`. Once GA is mounted, it stays until full page reload.

**Effect:** User revokes analytics consent but tracking continues — GDPR compliance failure.

**Suggested fix:** Add `onRevoke` callback to banner. Set `gaConsent(false)` in Layout. Remove gtag scripts and cookies on revoke.

---

### M03 — Sentry loads without cookie consent

| Field | Value |
|-------|-------|
| **Impact** | 8 |
| **Category** | Security / GDPR |
| **Files** | `src/main.jsx:10`, `src/components/Layout.jsx:55` |
| **Horizons-sensitive** | No |

**Problem:** Google Analytics is consent-gated via `CookieConsentBanner`, but `Sentry.init()` runs unconditionally in `main.jsx` before any consent check.

**Effect:** Cookie policy claims analytics require consent, but Sentry (with replay) loads immediately.

**Suggested fix:** Defer `Sentry.init` until analytics consent is granted, or document Sentry as strictly-necessary and update legal copy.

---

### M04 — Unverified RLS on leads table

| Field | Value |
|-------|-------|
| **Impact** | 8 |
| **Category** | Security |
| **Files** | `src/pages/Contact.jsx:84` |
| **Horizons-sensitive** | No |

**Problem:** Client inserts directly into `leads` table via anon key. No repo-side RLS policy documentation or rate-limit configuration.

**Effect:** If Supabase RLS allows unrestricted anon INSERT, table is open to spam/flood attacks.

**Suggested fix:** Verify RLS: anon INSERT-only, deny SELECT/UPDATE/DELETE. Add edge-function rate limiting or CAPTCHA.

---

### M05 — Project route unreachable from UI

| Field | Value |
|-------|-------|
| **Impact** | 8 |
| **Category** | Bug |
| **Files** | `src/components/Portfolio.jsx:13-58`, `src/pages/Project.jsx` |
| **Horizons-sensitive** | No |

**Problem:** All 6 portfolio items set `isExternal: true`, so `handleProjectClick` / `navigate('/project/:slug')` is never called. Internal project route exists but is dead code from the UI.

**Effect:** `/project/:projectId` route and `Project.jsx` page are unreachable from the portfolio grid.

**Suggested fix:** Wire internal projects with matching slugs, or remove the dead route and Project page.

---

### M06 — Duplicate Toaster instances

| Field | Value |
|-------|-------|
| **Impact** | 7 |
| **Category** | Bug |
| **Files** | `src/main.jsx:29`, `src/components/Layout.jsx:62` |
| **Horizons-sensitive** | No |

**Problem:** Two `<Toaster />` components mount — one in `main.jsx`, one in `Layout.jsx`. Both subscribe to the shared toast store.

**Effect:** Duplicate toast DOM nodes and duplicate auto-dismiss timers for every notification.

**Suggested fix:** Keep a single Toaster at app root (`main.jsx` or `Layout.jsx`, not both).

---

### M07 — Contact form double-submit

| Field | Value |
|-------|-------|
| **Impact** | 7 |
| **Category** | Retry |
| **Files** | `src/pages/Contact.jsx:63-74` |
| **Horizons-sensitive** | No |

**Problem:** `setIsSubmitting(true)` runs after validation. Rapid double-clicks before re-render can fire two async submits.

**Effect:** Duplicate leads in Supabase from a single user action.

**Suggested fix:** Use a synchronous `useRef` submit lock at the start of the handler. Disable form immediately.

---

### M08 — No code splitting — 1.08 MB bundle

| Field | Value |
|-------|-------|
| **Impact** | 8 |
| **Category** | Performance |
| **Files** | `src/App.jsx:4-8`, `vite.config.js` |
| **Horizons-sensitive** | No |

**Problem:** All pages statically imported in `App.jsx`. No `React.lazy` / `Suspense`. No `manualChunks` in Vite config. Build produces a single 1,084 kB JS chunk (329 kB gzip).

**Effect:** Entire app loaded on first visit regardless of route. Slower Time to Interactive.

**Suggested fix:** Lazy-load Contact, Project, Legal, DataPolicy routes. Configure `build.rollupOptions.output.manualChunks` for vendor splits (react, framer-motion, sentry, radix).

---

### M09 — Missing `og-image.png`

| Field | Value |
|-------|-------|
| **Impact** | 7 |
| **Category** | SEO |
| **Files** | `src/pages/Contact.jsx:147`, `src/pages/Legal.jsx`, `public/` |
| **Horizons-sensitive** | No |

**Problem:** Multiple pages reference `https://www.vivekapatel.com/og-image.png` in Open Graph / Twitter meta tags. File does not exist in `public/`.

**Effect:** Broken social share previews on Contact, Legal, and DataPolicy pages.

**Suggested fix:** Add `public/og-image.png`, or use `metaImages.ogImage` from `src/config/links.js` consistently.

---

### M10 — Domain split in legal copy

| Field | Value |
|-------|-------|
| **Impact** | 7 |
| **Category** | Duplicate / SEO |
| **Files** | `src/pages/Legal.jsx:26,55,65`, `src/pages/DataPolicy.jsx:31` |
| **Horizons-sensitive** | No |

**Problem:** Canonical URLs and OG tags use `vivekapatel.com`, but legal body text and meta descriptions reference `vivek-patel.com`.

**Effect:** Brand inconsistency across GDPR pages. Potential user confusion and SEO signal conflict.

**Suggested fix:** Pick one canonical domain. Search-replace all legal and meta copy to match.

---

### M11 — Conflicting contact emails

| Field | Value |
|-------|-------|
| **Impact** | 6 |
| **Category** | Duplicate |
| **Files** | `src/pages/Legal.jsx:65`, `src/config/links.js:35` |
| **Horizons-sensitive** | No |

**Problem:** Privacy policy lists `contact@vivek-patel.com`. Contact form notifications use `vivekp.freelance@pm.me` from `socialLinks.contactEmail`.

**Effect:** Users contacting via privacy policy email reach a different inbox than form submissions.

**Suggested fix:** Centralize contact email in `src/config/links.js` and reference it in Legal.jsx.

---

### M12 — PostCSS errors suppressed in build

| Field | Value |
|-------|-------|
| **Impact** | 8 |
| **Category** | Fail-fast |
| **Files** | `vite.config.js:228` |
| **Horizons-sensitive** | Yes |

**Problem:** Custom Vite logger swallows errors containing `CssSyntaxError: [postcss]`, allowing broken CSS/Tailwind to pass builds silently.

**Effect:** CSS bugs ship to production undetected.

**Suggested fix:** Remove the filter. Fix underlying CSS errors. Coordinate with Horizons before changing vite.config.js.

---

### M13 — Horizons error scripts in prod bundle

| Field | Value |
|-------|-------|
| **Impact** | 8 |
| **Category** | Infra |
| **Files** | `vite.config.js:167-241` |
| **Horizons-sensitive** | Yes |

**Problem:** Dev-only Horizons plugins are gated by `isDev`, but `addTransformIndexHtml` injects runtime error handlers (window.onerror, console.error hijack, fetch monkey-patch, postMessage) in all builds including production.

**Effect:** Production bundle carries Horizons iframe debugging overhead and `postMessage(..., '*')` calls.

**Suggested fix:** Gate `addTransformIndexHtml` behind `isDev` or iframe detection. Coordinate with Horizons platform before changing.

---

### M14 — Sitemap generator doesn't fail build

| Field | Value |
|-------|-------|
| **Impact** | 7 |
| **Category** | Infra |
| **Files** | `tools/generate-sitemap.js:60` |
| **Horizons-sensitive** | No |

**Problem:** catch block only calls `console.error()`. Does not `process.exit(1)`.

**Effect:** Build continues with stale or missing sitemap on write failure.

**Suggested fix:** Add `process.exit(1)` in catch, or rethrow to fail the build chain.

---

### M15 — Project page is placeholder content

| Field | Value |
|-------|-------|
| **Impact** | 7 |
| **Category** | Bug |
| **Files** | `src/pages/Project.jsx:14` |
| **Horizons-sensitive** | No |

**Problem:** Only defined project is `'social-media-app'` titled "Next-Gen Banking UI" — unrelated to actual AI/CV portfolio work.

**Effect:** If internal project route is ever wired, users see irrelevant placeholder content.

**Suggested fix:** Replace with real case-study data matching portfolio slugs, or remove until ready.

---

## Meaningful (4–6)

### N01 — Sentry `tracesSampleRate: 1.0`

| Field | Value |
|-------|-------|
| **Impact** | 6 |
| **Category** | Performance |
| **Files** | `src/main.jsx:14` |
| **Horizons-sensitive** | No |

**Problem:** Captures 100% of transactions in production. `tracePropagationTargets` still references placeholder `yourserver.io`.

**Suggested fix:** Lower to 0.1–0.2 in prod. Fix propagation targets to actual API domains.

---

### N02 — CustomCursor + infinite animations without reduced-motion guard

| Field | Value |
|-------|-------|
| **Impact** | 5 |
| **Category** | Performance / A11y |
| **Files** | `src/components/CustomCursor.jsx`, `src/components/AnimatedHeroBackground.jsx`, `src/components/AnimatedCtaBackground.jsx` |
| **Horizons-sensitive** | No |

**Problem:** CustomCursor re-renders via rAF on every mousemove with spring physics. Hero + CTA backgrounds run 6 infinite Framer Motion layers. CSS restores cursor for `prefers-reduced-motion` but JS animations keep running.

**Suggested fix:** Gate cursor and animations behind `(pointer: fine)` and `prefers-reduced-motion`. Pause off-screen layers.

---

### N03 — TechStack contradictory image preload

| Field | Value |
|-------|-------|
| **Impact** | 5 |
| **Category** | Performance |
| **Files** | `src/components/TechStack.jsx:32,72` |
| **Horizons-sensitive** | No |

**Problem:** useEffect eagerly preloads all 20 tech logos via `new Image()`, while `<img>` tags also set `loading="lazy"`.

**Suggested fix:** Pick one strategy: preload only visible subset, or drop preload and rely on lazy + caching.

---

### N04 — NumberTicker floors decimals

| Field | Value |
|-------|-------|
| **Impact** | 6 |
| **Category** | Bug |
| **Files** | `src/components/Stats.jsx:20`, `src/pages/Project.jsx:59` |
| **Horizons-sensitive** | No |

**Problem:** `Math.floor(progress * end)` truncates decimals. Stat `4.9/5` animates 0→4. Stat `99.9%` animates 0→99.

**Suggested fix:** Detect integer vs decimal values. Use `toFixed(1)` for fractional stats.

---

### N05 — AnimatePresence miswired for route transitions

| Field | Value |
|-------|-------|
| **Impact** | 4 |
| **Category** | Bug |
| **Files** | `src/App.jsx:28` |
| **Horizons-sensitive** | No |

**Problem:** AnimatePresence wraps `<Routes>`, but animated `motion.div` pages render inside Layout `<Outlet>`. Exit variants on Contact/Project/Legal/DataPolicy never fire.

**Suggested fix:** Move AnimatePresence to wrap `<Outlet>` keyed by `location.pathname`.

---

### N06 — Duplicate canonical tags

| Field | Value |
|-------|-------|
| **Impact** | 6 |
| **Category** | SEO |
| **Files** | `src/App.jsx:25`, per-page Helmet in Home, Contact, Legal, DataPolicy |
| **Horizons-sensitive** | No |

**Problem:** `App.jsx` injects global `<link rel="canonical">` on every route. Each page also sets its own via `<Helmet>`.

**Suggested fix:** Remove global canonical from App.jsx or remove per-page duplicates — keep one source of truth.

---

### N07 — Project slugs duplicated in sitemap + Portfolio

| Field | Value |
|-------|-------|
| **Impact** | 7 |
| **Category** | Duplicate |
| **Files** | `tools/generate-sitemap.js:8`, `src/components/Portfolio.jsx:5` |
| **Horizons-sensitive** | No |

**Problem:** Same 6 project slugs hardcoded in two places. Adding/removing a project requires manual sync.

**Suggested fix:** Extract slugs to shared module (e.g. `src/config/projects.js`) imported by both.

---

### N08 — `pageVariants` copied 4×

| Field | Value |
|-------|-------|
| **Impact** | 3 |
| **Category** | Duplicate |
| **Files** | `src/pages/Contact.jsx:43`, `src/pages/Legal.jsx:5`, `src/pages/DataPolicy.jsx:6`, `src/pages/Project.jsx:73` |
| **Horizons-sensitive** | No |

**Problem:** Nearly identical `pageVariants` + `pageTransition` copy-pasted across 4 pages.

**Suggested fix:** Extract shared motion config to `src/lib/pageMotion.js` or a layout wrapper.

---

### N09 — Platform SVG icons duplicated 4×

| Field | Value |
|-------|-------|
| **Impact** | 3 |
| **Category** | Duplicate |
| **Files** | `src/components/Hero.jsx:44`, `src/pages/Contact.jsx:20`, `src/components/Connect.jsx:7`, `src/components/Testimonials.jsx:5` |
| **Horizons-sensitive** | No |

**Problem:** Upwork, Freelancer, FreelancerMap SVG icons inlined in 4 files with only size differences.

**Suggested fix:** Add platform icons to `src/components/icons/` with a size prop.

---

### N10 — Animated backgrounds ~95% identical

| Field | Value |
|-------|-------|
| **Impact** | 3 |
| **Category** | Duplicate |
| **Files** | `src/components/AnimatedHeroBackground.jsx`, `src/components/AnimatedCtaBackground.jsx` |
| **Horizons-sensitive** | No |

**Problem:** Both define 3-layer parallax motion configs differing only in image URL and timing. Same image URL used for hero and CTA in `config/links.js`.

**Suggested fix:** Single `AnimatedParallaxBackground({ imageUrl, layers })` component.

---

### N11 — `COOKIE_CONSENT_KEY` duplicated

| Field | Value |
|-------|-------|
| **Impact** | 4 |
| **Category** | Duplicate |
| **Files** | `src/components/Layout.jsx:10`, `src/components/CookieConsentBanner.jsx:9` |
| **Horizons-sensitive** | No |

**Problem:** Same localStorage key string defined in two files — drift risk if one changes.

**Suggested fix:** Export from shared `src/config/consent.js`.

---

### N12 — Stats social proof duplicated on Contact page

| Field | Value |
|-------|-------|
| **Impact** | 4 |
| **Category** | Duplicate |
| **Files** | `src/pages/Contact.jsx:188`, `src/components/Stats.jsx:40` |
| **Horizons-sensitive** | No |

**Problem:** Contact hardcodes 100% Job Success, 11+ Projects, 5★ Rating — overlapping Stats section data.

**Suggested fix:** Extract shared stats constants. Reuse `<Stats compact />` or a stats config module.

---

### N13 — Dual lockfiles

| Field | Value |
|-------|-------|
| **Impact** | 6 |
| **Category** | Infra |
| **Files** | `bun.lock`, `package-lock.json` |
| **Horizons-sensitive** | No |

**Problem:** Both Bun and npm lockfiles exist. CI uses `bun install --frozen-lockfile`.

**Suggested fix:** Delete `package-lock.json` and add to `.gitignore`, or standardize on npm.

---

### N14 — `globals` not in package.json

| Field | Value |
|-------|-------|
| **Impact** | 6 |
| **Category** | Infra |
| **Files** | `eslint.config.cjs:3`, `package.json` |
| **Horizons-sensitive** | No |

**Problem:** `eslint.config.cjs` requires `globals` but it's not in devDependencies. Currently resolves via ESLint's nested dep.

**Suggested fix:** Add `"globals": "^16.2.0"` to devDependencies.

---

### N15 — CI pins `bun-version: latest`

| Field | Value |
|-------|-------|
| **Impact** | 7 |
| **Category** | Infra |
| **Files** | `.github/workflows/ci.yml:21`, `.github/workflows/lighthouse.yml:19` |
| **Horizons-sensitive** | No |

**Problem:** Both workflows use `bun-version: latest`. Bun updates can break builds without code changes.

**Suggested fix:** Pin to specific Bun version (e.g. 1.2.x) and bump intentionally.

---

### N16 — Playwright installed, zero tests

| Field | Value |
|-------|-------|
| **Impact** | 6 |
| **Category** | Infra |
| **Files** | `package.json:64`, no `playwright.config.js`, no test files |
| **Horizons-sensitive** | No |

**Problem:** `@playwright/test` in devDependencies but no test files and no test job in CI.

**Suggested fix:** Add playwright.config + smoke tests and CI job, or remove dependency.

---

### N17 — `generate-llms.js` not in build

| Field | Value |
|-------|-------|
| **Impact** | 5 |
| **Category** | Infra / SEO |
| **Files** | `tools/generate-llms.js`, `package.json:8` |
| **Horizons-sensitive** | No |

**Problem:** Build script only runs `generate-sitemap.js`. `generate-llms.js` never runs; `public/llms.txt` is absent.

**Suggested fix:** Add `node tools/generate-llms.js` to build script.

---

### N18 — 7 unused Radix packages

| Field | Value |
|-------|-------|
| **Impact** | 6 |
| **Category** | Bloat |
| **Files** | `package.json:28-39` |
| **Horizons-sensitive** | No |

**Problem:** Installed but never imported: `@radix-ui/react-alert-dialog`, `avatar`, `dialog`, `dropdown-menu`, `label`, `slider`, `tabs`.

**Suggested fix:** Remove unused packages from dependencies.

---

### N19 — `@babel/traverse` in production dependencies

| Field | Value |
|-------|-------|
| **Impact** | 5 |
| **Category** | Bloat |
| **Files** | `package.json:26`, `plugins/visual-editor/` |
| **Horizons-sensitive** | Yes |

**Problem:** Only used by dev-only Horizons plugins. Sibling `@babel/*` packages are correctly in devDependencies.

**Suggested fix:** Move to devDependencies. Coordinate with Horizons.

---

### N20 — Cookie banner close (X) doesn't persist choice

| Field | Value |
|-------|-------|
| **Impact** | 5 |
| **Category** | Retry / GDPR |
| **Files** | `src/components/CookieConsentBanner.jsx:192` |
| **Horizons-sensitive** | No |

**Problem:** Closing via X does not write `cookie_consent_preferences`. Banner reappears after 1.5s on reload.

**Suggested fix:** On close, persist `{ necessary: true, analytics: false }` or treat close as reject-all.

---

### N21 — CDN assets without SRI

| Field | Value |
|-------|-------|
| **Impact** | 6 |
| **Category** | Security |
| **Files** | `src/config/links.js`, `index.html` |
| **Horizons-sensitive** | No |

**Problem:** Favicon, OG images, hero assets load from `raw.githubusercontent.com`, `horizons-cdn.hostinger.com`, and `cdn.jsdelivr.net` without integrity checks.

**Suggested fix:** Self-host critical assets in `public/`. Pin CDN URLs. Add CSP headers.

---

### N22 — Sitemap `lastmod` always today

| Field | Value |
|-------|-------|
| **Impact** | 6 |
| **Category** | Infra / SEO |
| **Files** | `tools/generate-sitemap.js:6` |
| **Horizons-sensitive** | No |

**Problem:** `const today = new Date()` stamps every URL on every build.

**Suggested fix:** Use git last-modified dates per file, or only update lastmod when slug list changes.

---

### N23 — `tailwindcss-animate` registered twice

| Field | Value |
|-------|-------|
| **Impact** | 5 |
| **Category** | Config |
| **Files** | `src/index.css:5`, `tailwind.config.js:76` |
| **Horizons-sensitive** | No |

**Problem:** Plugin loaded via v4 `@plugin 'tailwindcss-animate'` in index.css AND `plugins: [require('tailwindcss-animate')]` in tailwind.config.js.

**Suggested fix:** Pick one registration path (prefer v4 `@plugin` only).

---

### N24 — Stale Tailwind content paths

| Field | Value |
|-------|-------|
| **Impact** | 4 |
| **Category** | Config |
| **Files** | `tailwind.config.js:5-7` |
| **Horizons-sensitive** | No |

**Problem:** `content` includes `./pages/`, `./components/`, `./app/` at repo root — none exist. Only `./src/**/*` is valid.

**Suggested fix:** Remove stale paths. Rely on v4 `@source` in index.css.

---

### N25 — No env validation at startup

| Field | Value |
|-------|-------|
| **Impact** | 7 |
| **Category** | Fail-fast |
| **Files** | `src/lib/customSupabaseClient.js`, `src/main.jsx`, `src/components/GoogleAnalytics.jsx` |
| **Horizons-sensitive** | No |

**Problem:** All secrets/IDs hardcoded. No startup check that required config exists.

**Suggested fix:** Add `src/lib/env.js` with validation. Throw in dev if vars missing.

---

### N26 — ESLint `--ext` deprecated

| Field | Value |
|-------|-------|
| **Impact** | 4 |
| **Category** | Infra |
| **Files** | `package.json:10`, `eslint.config.cjs:15` |
| **Horizons-sensitive** | No |

**Problem:** Lint scripts pass `--ext .js,.jsx` but ESLint 10 flat config already scopes `files: ['src/**/*.{js,jsx}']`.

**Suggested fix:** Change to `"lint": "eslint src/"`.

---

### N27 — Tailwind content scanning configured redundantly

| Field | Value |
|-------|-------|
| **Impact** | 4 |
| **Category** | Duplicate / Config |
| **Files** | `src/index.css:2-4`, `tailwind.config.js:4` |
| **Horizons-sensitive** | No |

**Problem:** v4 `@config` + `@source` in index.css overlap with v3-style `content: [...]` in tailwind.config.js.

**Suggested fix:** Migrate fully to v4 `@source` and drop `content` from config.

---

### N28 — Global console.warn silenced in Vite

| Field | Value |
|-------|-------|
| **Impact** | 7 |
| **Category** | Fail-fast |
| **Files** | `vite.config.js:223` |
| **Horizons-sensitive** | Yes |

**Problem:** `console.warn = () => {}` disables ALL Vite/build warnings globally.

**Suggested fix:** Remove override. Filter specific noisy warnings via customLogger if needed.

---

## Minor (1–3)

### L01 — CTA `navigate('/contact')` repeated 3×

| Field | Value |
|-------|-------|
| **Impact** | 2 |
| **Category** | Duplicate |
| **Files** | `src/components/Hero.jsx:11`, `src/components/CTA.jsx:7`, `src/components/Header.jsx:65` |
| **Horizons-sensitive** | No |

**Suggested fix:** Shared `<ContactButton>` or `useContactNavigation()` hook.

---

### L02 — Section header pattern repeated 8+ times

| Field | Value |
|-------|-------|
| **Impact** | 3 |
| **Category** | Duplicate |
| **Files** | `Portfolio.jsx`, `Stats.jsx`, `Connect.jsx`, `Experience.jsx`, `Testimonials.jsx`, `About.jsx` |
| **Horizons-sensitive** | No |

**Suggested fix:** Shared `<SectionHeading title accent subtitle />` component.

---

### L03 — `bg-[#0C0D0D]` hardcoded 20+ times

| Field | Value |
|-------|-------|
| **Impact** | 2 |
| **Category** | Duplicate |
| **Files** | Multiple components and pages |
| **Horizons-sensitive** | No |

**Suggested fix:** Use `bg-background` (already defined as CSS variable) or a named token.

---

### L04 — Dead files never imported

| Field | Value |
|-------|-------|
| **Impact** | 3 |
| **Category** | Bloat |
| **Files** | `src/contexts/SupabaseAuthContext.jsx`, `src/components/WelcomeMessage.jsx`, `src/components/CallToAction.jsx`, `src/components/ErrorButton.jsx`, `src/pages/PrivacyPolicy.jsx`, `src/pages/CookiePolicy.jsx` |
| **Horizons-sensitive** | No |

**Problem:** Zero imports. PrivacyPolicy and CookiePolicy are blank stubs; Legal and DataPolicy replaced them.

**Suggested fix:** Delete dead files.

---

### L05 — `terser` unused

| Field | Value |
|-------|-------|
| **Impact** | 4 |
| **Category** | Bloat |
| **Files** | `package.json:80`, `vite.config.js` |
| **Horizons-sensitive** | No |

**Problem:** Listed in devDependencies but Vite 8 defaults to Rolldown minification. No `build.minify: 'terser'`.

**Suggested fix:** Remove terser unless explicitly needed.

---

### L06 — `@types/react*` unused in JS project

| Field | Value |
|-------|-------|
| **Impact** | 3 |
| **Category** | Bloat |
| **Files** | `package.json:67-68` |
| **Horizons-sensitive** | No |

**Problem:** No tsconfig, no `.ts`/`.tsx` source files.

**Suggested fix:** Remove `@types/react` and `@types/react-dom`. Keep `@types/node` only if needed for vite.config.

---

### L07 — `autoprefixer` redundant with Tailwind v4

| Field | Value |
|-------|-------|
| **Impact** | 3 |
| **Category** | Config |
| **Files** | `postcss.config.js:4`, `package.json:70` |
| **Horizons-sensitive** | No |

**Problem:** Tailwind v4 uses Lightning CSS which handles vendor prefixing internally.

**Suggested fix:** Remove autoprefixer from postcss.config.js and devDependencies.

---

### L08 — Horizons `postMessage` uses wildcard origin

| Field | Value |
|-------|-------|
| **Impact** | 6 |
| **Category** | Security |
| **Files** | `vite.config.js:50,69`, `plugins/vite-plugin-iframe-route-restoration.js:23` |
| **Horizons-sensitive** | Yes (read-only) |

**Problem:** Outbound messages use `postMessage(..., '*')`. Inbound messages validate allowlist, but outbound does not restrict origin.

**Suggested fix:** Restrict outbound postMessage to Horizons allowlist. Coordinate before changing.

---

## Horizons-Sensitive

| ID | Title | Files | Notes |
|----|-------|-------|-------|
| H01 | PostCSS + console.warn suppression | `vite.config.js:223-234` | Same as M12 + N28 |
| H02 | Runtime error handlers in prod | `vite.config.js:167-241` | Same as M13 |
| H03 | `@babel/traverse` in dependencies | `package.json:26` | Same as N19 |
| H04 | Outbound postMessage wildcard | `vite.config.js`, `plugins/` | Same as L08 |

**Do not modify without Horizons platform approval.**

---

## Index by Category

| Category | Issues |
|----------|--------|
| **Bugs** | C01, M05, M06, M15, N04, N05 |
| **Fail-fast / silent errors** | M01, M12, N25, N28 |
| **Security / GDPR** | C04, C05, M03, M04, N21, L08 |
| **SEO** | C02, M09, M10, N06, N17, N22 |
| **Duplicates / DRY** | M10, M11, N07, N08, N09, N10, N11, N12, N27, L01, L02, L03 |
| **Performance** | M08, N01, N02, N03 |
| **Dead code / bloat** | N18, N19, L04, L05, L06 |
| **Infra / tooling** | M12, M13, M14, N13, N14, N15, N16, N17, N23, N24, N26, L07 |
| **Retry / idempotency** | M02, M07, N20 |
| **Config** | C03, N23, N24, N27, L07 |
| **Horizons-sensitive** | H01–H04 (overlap with M12, M13, N19, L08) |

---

## Recommended Fix Order

1. **C01 + M02 + M03** — Consent/analytics stack
2. **M01 + M07** — Contact form reliability
3. **C02 + M09 + M10** — SEO integrity
4. **C03** — Tailwind token fix
5. **C04 + C05** — Secrets/env hardening
6. **M06 + M08 + L04 + N18** — Bundle cleanup
7. **M12–M14 + N13–N17** — Infra hardening
