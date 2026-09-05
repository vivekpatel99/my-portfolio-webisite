# Codebase Review Report — horizons-website

**Date:** 2026-05-24  
**Mode:** Deep (3 parallel specialists + architecture pass)  
**Scope:** Full repo except Horizons modifications (read-only review of `plugins/` and vite error handlers)  
**Baseline:** `bun run lint` ✅ · `bun run format:check` ✅ · `bun run build` ✅ (1,084 kB JS bundle, single chunk)

## Executive Summary

The codebase is functional and passes lint/build, but has several **silent failure paths** that undermine analytics, lead notifications, and GDPR compliance. The single biggest opportunity is fixing the **consent + analytics stack** (GA never loads, Sentry loads without consent, consent revocation doesn't disable tracking) alongside **SEO integrity** (sitemap lists 6 project URLs that redirect to homepage).

---

## Findings by Severity

### Critical (9–10)

| ID | Category | Title | Location | Description | Suggested fix |
|----|----------|-------|----------|-------------|---------------|
| C01 | Bug | Google Analytics never loads | `Layout.jsx:55`, `GoogleAnalytics.jsx:8` | Layout mounts `<GoogleAnalytics />` only when `gaConsent` is true, but never passes `hasConsent`. Internal guard `if (!hasConsent) return` always exits. | Pass `hasConsent={gaConsent}` or remove redundant internal check. |
| C02 | SEO | Sitemap project URLs are soft 404s | `tools/generate-sitemap.js:8`, `Project.jsx:14` | Sitemap lists 6 project slugs; `projectData` only defines `social-media-app`. All other slugs redirect to `/`. | Populate case studies or remove project URLs from sitemap. |
| C03 | Config | Tailwind `bg-primary` tokens broken | `tailwind.config.js:25-36`, `button.jsx:11` | Uses `default:` instead of shadcn `DEFAULT:`. Generates `bg-primary-default`, not `bg-primary`. | Rename all `default:` keys to `DEFAULT:`. |
| C04 | Security | Sentry captures PII + full replay | `main.jsx:12-21` | `sendDefaultPii: true`, replay on errors. Contact form fields can appear in Session Replay. | `sendDefaultPii: false`, mask inputs in replay, scrub `/contact` in `beforeSend`. |
| C05 | Security | Hardcoded Supabase credentials | `customSupabaseClient.js:3-5` | URL + anon key committed; zero `import.meta.env` usage in `src/`. | Move to `VITE_SUPABASE_*` env vars; validate at startup. |

### Major (7–8)

| ID | Category | Title | Location | Description | Suggested fix |
|----|----------|-------|----------|-------------|---------------|
| M01 | Fail-fast | Contact email failure shows success | `Contact.jsx:105-116` | DB insert succeeds but edge function fails → user sees "Message Sent!" | Partial-failure toast; Sentry capture with lead ID. |
| M02 | Retry | Consent revocation doesn't disable GA | `CookieConsentBanner.jsx:92-98`, `Layout.jsx:38` | Reject/save-with-analytics-off updates localStorage but never sets `gaConsent` false | Add `onRevoke` callback; remove gtag scripts on revoke. |
| M03 | Security | Sentry loads without cookie consent | `main.jsx:10`, `Layout.jsx:55` | GA is consent-gated; Sentry initializes unconditionally | Defer Sentry init until consent or update legal copy. |
| M04 | Security | Unverified RLS on leads table | `Contact.jsx:84` | Client inserts via anon key; no repo-side RLS/rate-limit proof | Verify anon INSERT-only RLS; add rate limiting/CAPTCHA. |
| M05 | Bug | Project route unreachable from UI | `Portfolio.jsx:13-58` | All items `isExternal: true`; internal `/project/:slug` never used | Wire internal projects or remove dead route. |
| M06 | Bug | Duplicate Toaster instances | `main.jsx:29`, `Layout.jsx:62` | Two toast containers share one store → duplicate DOM/timers | Keep single Toaster at app root. |
| M07 | Retry | Contact form double-submit | `Contact.jsx:63-74` | `setIsSubmitting(true)` async; rapid clicks can duplicate leads | Synchronous `useRef` submit lock at handler start. |
| M08 | Performance | No code splitting — 1.08 MB bundle | `App.jsx:4-8`, `vite.config.js` | All routes eagerly imported; single JS chunk (329 kB gzip) | `React.lazy` per route; `manualChunks` for vendors. |
| M09 | SEO | Missing `og-image.png` | `Contact.jsx:147`, `public/` | Pages reference `/og-image.png`; file absent from `public/` | Add asset or use `metaImages.ogImage` from `config/links.js`. |
| M10 | Duplicate | Domain split in legal copy | `Legal.jsx:26,55,65`, `DataPolicy.jsx:31` | Canonical uses `vivekapatel.com`; legal text uses `vivek-patel.com` | Unify domain across all copy and meta. |
| M11 | Duplicate | Conflicting contact emails | `Legal.jsx:65`, `config/links.js:35` | Privacy lists `contact@vivek-patel.com`; form uses `vivekp.freelance@pm.me` | Centralize in `links.js`. |
| M12 | Fail-fast | PostCSS errors suppressed in build | `vite.config.js:228` | Custom logger swallows `CssSyntaxError: [postcss]` | Remove filter; fail build on CSS errors. |
| M13 | Infra | Horizons error scripts in prod bundle | `vite.config.js:167-241` | Dev plugins gated by `isDev`, but runtime error handlers inject in all builds | Coordinate with Horizons before gating. |
| M14 | Infra | Sitemap generator doesn't fail build | `tools/generate-sitemap.js:60` | catch only logs; build continues with stale sitemap | `process.exit(1)` on error. |
| M15 | Bug | Project page is placeholder content | `Project.jsx:14` | Only case study is "Next-Gen Banking UI" — unrelated to portfolio | Replace with real data or remove. |

### Meaningful (4–6)

| ID | Category | Title | Location | Impact |
|----|----------|-------|----------|--------|
| N01 | Performance | Sentry `tracesSampleRate: 1.0` | `main.jsx:14` | 100% transaction sampling in prod |
| N02 | Performance | CustomCursor + infinite animations | `CustomCursor.jsx`, `AnimatedHeroBackground.jsx` | rAF on every mousemove; 6 infinite motion layers; no `prefers-reduced-motion` guard |
| N03 | Performance | TechStack contradictory preload | `TechStack.jsx:32,72` | Preloads 20 images then uses `loading="lazy"` |
| N04 | Bug | NumberTicker floors decimals | `Stats.jsx:20`, `Project.jsx:59` | `4.9` animates to `4` |
| N05 | Bug | AnimatePresence miswired | `App.jsx:28` | Exit animations never fire (pages inside Layout Outlet) |
| N06 | SEO | Duplicate canonical tags | `App.jsx:25` + per-page Helmet | Two `<link rel="canonical">` per page |
| N07 | Duplicate | Project slugs in sitemap + Portfolio | `generate-sitemap.js`, `Portfolio.jsx` | Manual sync required on project changes |
| N08 | Duplicate | `pageVariants` copied 4× | Contact, Legal, DataPolicy, Project | Extract shared motion config |
| N09 | Duplicate | Platform SVG icons duplicated 4× | Hero, Contact, Connect, Testimonials | Shared icon module |
| N10 | Duplicate | Animated backgrounds ~95% identical | `AnimatedHeroBackground`, `AnimatedCtaBackground` | Single parameterized component |
| N11 | Duplicate | `COOKIE_CONSENT_KEY` in 2 files | `Layout.jsx:10`, `CookieConsentBanner.jsx:9` | Shared config constant |
| N14 | Duplicate | Stats social proof on Contact page | `Contact.jsx:188`, `Stats.jsx:40` | Overlapping hardcoded values |
| N15 | Infra | Dual lockfiles | `bun.lock` + `package-lock.json` | Stale drift risk |
| N16 | Infra | `globals` not in package.json | `eslint.config.cjs:3` | Fragile on strict installs |
| N17 | Infra | CI pins `bun-version: latest` | `.github/workflows/ci.yml:21` | Non-reproducible builds |
| N18 | Infra | Playwright installed, zero tests | `package.json:64`, no test files | Dead dependency |
| N19 | Infra | `generate-llms.js` not in build | `package.json:8` | `public/llms.txt` never generated |
| N20 | Bloat | 7 unused Radix packages | `package.json:28-39` | alert-dialog, avatar, dialog, dropdown-menu, label, slider, tabs |
| N21 | Bloat | `@babel/traverse` in dependencies | `package.json:26` | Dev-only Horizons plugin usage |
| N22 | Retry | Cookie banner X doesn't persist choice | `CookieConsentBanner.jsx:192` | Re-prompts every session |
| N23 | Security | CDN assets without SRI | `config/links.js`, `index.html` | raw.githubusercontent.com, jsdelivr trust |
| N24 | Infra | Sitemap `lastmod` always today | `generate-sitemap.js:6` | Git noise; false freshness to crawlers |
| N25 | Config | `tailwindcss-animate` registered twice | `index.css:5`, `tailwind.config.js:76` | v3/v4 hybrid duplication |
| N26 | Config | Stale Tailwind content paths | `tailwind.config.js:5-7` | `./pages/`, `./components/` don't exist at root |
| N27 | Fail-fast | No env validation | All hardcoded secrets/IDs | Misconfig fails silently at runtime |
| N28 | Infra | ESLint `--ext` deprecated | `package.json:10` | ESLint 10 flat config ignores flag |

### Minor (1–3)

| ID | Category | Title | Location |
|----|----------|-------|----------|
| L01 | Duplicate | CTA `navigate('/contact')` repeated 3× | Hero, CTA, Header |
| L02 | Duplicate | Section header pattern 8+ times | Portfolio, Stats, Connect, etc. |
| L03 | Duplicate | `bg-[#0C0D0D]` hardcoded 20+ times | Multiple components |
| L04 | Bloat | Dead files never imported | `WelcomeMessage`, `CallToAction`, `ErrorButton`, `SupabaseAuthContext`, stub pages |
| L05 | Bloat | `terser` unused | `package.json:80` |
| L06 | Bloat | `@types/react*` unused in JS project | `package.json:67-68` |
| L07 | Config | `autoprefixer` redundant with Tailwind v4 | `postcss.config.js:4` |
| L08 | Security | Horizons `postMessage` uses `'*'` | `vite.config.js`, plugins (read-only) |

---

## Category Rollup

| Category | Count | Top issue |
|----------|-------|-----------|
| Bugs | 8 | GA never loads despite consent (C01) |
| Fail-fast / silent errors | 6 | Contact email failure shows success (M01) |
| Security / GDPR | 8 | Sentry PII + replay on contact form (C04) |
| SEO | 5 | Sitemap project URLs redirect home (C02) |
| Duplicates / DRY | 14 | Domain split in legal copy (M10) |
| Performance | 6 | 1.08 MB single-chunk bundle (M08) |
| Dead code / bloat | 8 | 7 unused Radix packages (N20) |
| Infra / tooling | 12 | PostCSS errors suppressed (M12) |

**Total unique findings:** 47 (after deduplication across 3 specialists)

---

## Horizons-Sensitive Items

These touch platform-synced code. Report only — coordinate before changing.

| ID | Finding | Location |
|----|---------|----------|
| H01 | PostCSS + console.warn suppression hides build issues | `vite.config.js:223-234` |
| H02 | Runtime error handlers injected in production builds | `vite.config.js:167-241` |
| H03 | `@babel/traverse` in production dependencies (dev plugin only) | `package.json:26` |
| H04 | Outbound `postMessage(..., '*')` exposes errors to any parent iframe | `vite.config.js`, `plugins/` |

---

## Baseline Verification

| Command | Result |
|---------|--------|
| `bun run lint` | Pass (exit 0) |
| `bun run format:check` | Pass |
| `bun run build` | Pass — 1,084 kB JS, 64 kB CSS, single chunk, 1.02s |

Build passes despite C03 (Tailwind token bug) because components fall back to explicit utility classes rather than semantic tokens.

---

## Recommended Fix Order (if acting later)

1. **C01 + M02 + M03** — Fix consent/analytics stack (GA prop, revoke callback, Sentry gating)
2. **M01 + M07** — Contact form reliability (partial failure UX, double-submit lock)
3. **C02 + M09 + M10** — SEO integrity (sitemap, og-image, domain unification)
4. **C03** — Tailwind `DEFAULT:` token fix (unblocks shadcn semantic colors)
5. **C04 + C05** — Secrets/env hardening (env vars, Sentry PII masking)
6. **M06 + M08 + L04 + N20** — Bundle cleanup (remove dead code/deps, lazy-load routes)
7. **M12-M14 + N15-N19** — Infra hardening (fail-fast builds, pin Bun, wire llms.txt)

---

## Architecture Reference (for follow-up work)

**App:** React 19 SPA portfolio (vivekapatel.com) — Vite 8, Tailwind 4, Framer Motion, Supabase contact form, Sentry monitoring.

**Routes:** `/` Home · `/contact` · `/project/:id` · `/legal` · `/data-policy` · `*` → `/`

**Main flow:** Contact form → Supabase `leads` insert → Edge Function `contact-form-email` → toast

**Off-limits:** `plugins/`, Horizons error handlers in `vite.config.js`, `postMessage` patterns
