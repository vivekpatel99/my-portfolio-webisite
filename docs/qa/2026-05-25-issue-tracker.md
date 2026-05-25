# Website QA Issue Tracker

**Date:** 2026-05-25  
**QA session:** Expert Website QA Team (8 agents, preview + production)  
**Environments:** Local preview (`127.0.0.1:4173`) · Production (`https://www.vivekapatel.com`)  
**Baseline:** lint ✅ · build ✅ · 15 regression tests ✅

**How to use this doc:** Work top-down by priority. Check off **Status** when fixed, add PR link, and run **Verification** steps before closing an issue.

---

## Summary

| ID | Priority | Issue | Status | Fixed in |
|----|----------|-------|--------|----------|
| [BUG-001](#bug-001-google-analytics-never-loads-after-cookie-consent) | P0 | GA never loads after cookie consent | ⬜ Open | — |
| [BUG-002](#bug-002-contact-form-false-success-when-email-fails) | P0 | Contact form false success when email fails | ⬜ Open | — |
| [BUG-003](#bug-003-portfolio-never-links-to-internal-case-studies) | P1 | Portfolio never links to internal case studies | ⬜ Open | — |
| [BUG-004](#bug-004-project-page-has-stale-mock-data) | P1 | Project page has stale mock data | ⬜ Open | — |
| [BUG-005](#bug-005-nested-main-landmarks) | P1 | Nested `<main>` landmarks | ⬜ Open | — |
| [BUG-006](#bug-006-fixed-header-covers-anchored-sections) | P1 | Fixed header covers anchored sections | ⬜ Open | — |
| [BUG-007](#bug-007-cross-page-hash-nav-race-condition) | P1 | Cross-page hash nav race condition | ⬜ Open | — |
| [BUG-008](#bug-008-mobile-menu-missing-a11y-essentials) | P1 | Mobile menu missing a11y essentials | ⬜ Open | — |
| [BUG-009](#bug-009-whitespace-only-form-values-bypass-js-validation) | P2 | Whitespace-only form values bypass JS validation | ⬜ Open | — |
| [BUG-010](#bug-010-contact-social-icons-missing-aria-label) | P2 | Contact social icons missing `aria-label` | ⬜ Open | — |
| [BUG-011](#bug-011-home-page-missing-ogtwitter-tags) | P2 | Home page missing OG/Twitter tags | ⬜ Open | — |
| [BUG-012](#bug-012-og-image-url-inconsistency) | P2 | OG image URL inconsistency | ⬜ Open | — |
| [BUG-013](#bug-013-numberticker-truncates-decimals) | P2 | NumberTicker truncates decimals | ⬜ Open | — |
| [BUG-014](#bug-014-reduced-motion-inconsistently-applied) | P2 | Reduced motion inconsistently applied | ⬜ Open | — |
| [BUG-015](#bug-015-lighthouse-performance-below-threshold) | P2 | Lighthouse Performance below threshold | ⬜ Open | — |
| [BUG-016](#bug-016-sitemap-omits-project-urls) | P3 | Sitemap omits `/project/*` URLs | ⬜ Open | — |
| [BUG-017](#bug-017-orphan-stub-pages-not-routed) | P3 | Orphan stub pages not routed | ⬜ Open | — |
| [BUG-018](#bug-018-custom-cursor-edge-cases) | P3 | Custom cursor edge cases | ⬜ Open | — |
| [BUG-019](#bug-019-testimonials-marquee-doesnt-pause-on-keyboard-focus) | P3 | Testimonials marquee doesn't pause on keyboard focus | ⬜ Open | — |
| [BUG-020](#bug-020-footer-manage-consent-misleading-toast) | P3 | Footer "Manage Consent" misleading toast | ⬜ Open | — |
| [DEPLOY-001](#deploy-001-production-deploy-is-stale) | P1 | Production deploy is stale | ⬜ Open | — |

**Legend:** ⬜ Open · 🔄 In Progress · ✅ Fixed · ⏸ Won't Fix

---

## P0 — Critical

### BUG-001: Google Analytics never loads after cookie consent

| Field | Value |
|-------|-------|
| **Status** | ⬜ Open |
| **Priority** | P0 |
| **Category** | Analytics / Bug |
| **Environment** | Preview + Production |
| **Files** | `src/components/Layout.jsx:120`, `src/components/GoogleAnalytics.jsx:5-14` |

**Problem:** Layout renders `{gaConsent && <GoogleAnalytics />}` when consent is granted, but never passes `hasConsent`. Inside `GoogleAnalytics`, `if (!hasConsent) return` always exits because `undefined` is falsy.

**Steps to reproduce:**
1. Clear `localStorage` key `cookie_consent_preferences`
2. Visit `/` on production
3. Click **Accept All** on cookie banner
4. Open DevTools → Console: `typeof window.gtag`
5. Check Network tab for `googletagmanager.com` scripts

**Expected:** GA scripts load; `gtag` is defined on production.

**Actual:** `gtag` is `undefined`; 0 GTM scripts injected.

**Suggested fix:**
```jsx
// Layout.jsx
<GoogleAnalytics hasConsent={gaConsent} />
```
Or remove the internal `hasConsent` guard since the component only mounts when consent is granted.

**Verification:**
- [ ] Accept cookies on preview (127.0.0.1) — note: GA also blocks on non-production hostname
- [ ] Accept cookies on production — `gtag` defined, GTM script in DOM
- [ ] Reject cookies — no GA scripts

**Related tests:** Manual only (add `tests/analytics.spec.js` when fixed)

---

### BUG-002: Contact form false success when email fails

| Field | Value |
|-------|-------|
| **Status** | ⬜ Open |
| **Priority** | P0 |
| **Category** | Forms / Bug |
| **Environment** | Preview (confirmed) · Production (likely same) |
| **Files** | `src/pages/Contact.jsx:83-117` |

**Problem:** Supabase DB insert succeeds but `contact-form-email` edge function fails. Code logs the error but still shows success toast and resets the form.

**Steps to reproduce:**
1. Go to `/contact`
2. Submit valid form (or mock: DB 201 + edge function 500)
3. Watch console for `Error invoking email function`

**Expected:** User sees warning that message was saved but email notification failed, OR full success only when both succeed.

**Actual:** Form resets; success toast shown; lead may exist in DB but owner never notified.

**Additional finding:** Resend API returns 500 — testing domain restriction (`You can only send testing emails to your own email address`). Backend config issue separate from frontend UX bug.

**Suggested fix:**
```jsx
if (functionError) {
  toast({
    title: 'Message saved',
    description: 'Your details were received, but we could not send the notification email. We will still follow up.',
    variant: 'destructive', // or a "warning" variant
  });
} else {
  toast({ title: '🚀 Message Sent!', ... });
}
```

**Verification:**
- [ ] Mock DB OK + email fail → user sees partial-success message, form stays or resets intentionally
- [ ] Mock both OK → success toast
- [ ] Mock DB fail → error toast, form not reset
- [ ] Fix Resend domain config in Supabase (separate infra task)

**Related tests:** `tests/contact-form.spec.js` — `partial success when email function fails`

---

## P1 — High

### BUG-003: Portfolio never links to internal case studies

| Field | Value |
|-------|-------|
| **Status** | ⬜ Open |
| **Priority** | P1 |
| **Category** | Routing / UX |
| **Environment** | Preview + Production |
| **Files** | `src/components/Portfolio.jsx:5-59, 111-113`, `src/pages/Project.jsx`, `src/App.jsx:64-69` |

**Problem:** All 6 portfolio cards have `isExternal: true`. Internal route `/project/:projectId` exists but is unreachable from the UI. `handleProjectClick` is dead code.

**Steps to reproduce:**
1. Go to `/#portfolio`
2. Click any project card
3. Observe: opens Upwork/GitHub in new tab, never navigates to `/project/:slug`

**Expected:** Either internal case study pages OR remove unused `/project` route.

**Suggested fix (pick one):**
- **Option A:** Set `isExternal: false` for projects with case study content; populate `projectData` in `Project.jsx`
- **Option B:** Remove `/project/:projectId` route until case studies are ready

**Verification:**
- [ ] Click portfolio card → correct destination (internal or external, consistently)
- [ ] No dead code paths in `Portfolio.jsx`

---

### BUG-004: Project page has stale mock data

| Field | Value |
|-------|-------|
| **Status** | ⬜ Open |
| **Priority** | P1 |
| **Category** | Content / Bug |
| **Environment** | Preview + Production |
| **Files** | `src/pages/Project.jsx:13-71` |

**Problem:** Only one project key exists: `social-media-app`. Content is "Next-Gen Banking UI" — slug and content don't match. Other portfolio slugs redirect home with toast.

**Steps to reproduce:**
1. Visit `/project/social-media-app` → banking content
2. Visit `/project/football-tracking` → toast + redirect home

**Expected:** Real case study content matching portfolio items.

**Suggested fix:** Replace `projectData` with actual project content for each slug, or remove route until ready.

**Verification:**
- [ ] Each portfolio slug (if linked internally) renders correct title, images, stats
- [ ] Invalid slug still redirects gracefully

---

### BUG-005: Nested `<main>` landmarks

| Field | Value |
|-------|-------|
| **Status** | ⬜ Open |
| **Priority** | P1 |
| **Category** | Accessibility / HTML |
| **Environment** | Preview + Production |
| **Files** | `src/pages/Project.jsx:157`, `src/components/Layout.jsx:123` |

**Problem:** Layout wraps content in `<main id="main-content">`. Project page adds another `<main>` inside — invalid HTML, confuses screen readers.

**Steps to reproduce:**
1. Visit `/project/social-media-app`
2. DevTools: `document.querySelectorAll('main').length` → **2**

**Expected:** Exactly one `<main>` landmark per page.

**Suggested fix:** Change Project page wrapper from `<main>` to `<article>` or `<div>`.

**Verification:**
- [ ] `document.querySelectorAll('main').length === 1` on project page
- [ ] Lighthouse a11y score unchanged or improved

---

### BUG-006: Fixed header covers anchored sections

| Field | Value |
|-------|-------|
| **Status** | ⬜ Open |
| **Priority** | P1 |
| **Category** | UX / Navigation |
| **Environment** | Preview + Production |
| **Files** | `src/components/Services.jsx`, `src/components/About.jsx`, `src/components/Portfolio.jsx`, `src/components/Testimonials.jsx`, `src/index.css` |

**Problem:** Header is `fixed` with `h-20` (80px). Section anchors (`#services`, `#about`, etc.) have `scroll-margin-top: 0px`. Clicking nav links scrolls section title under the header.

**Steps to reproduce:**
1. Go to `/`
2. Click **Services** in header
3. Section title partially hidden under fixed header

**Expected:** Section heading fully visible below header.

**Suggested fix:**
```css
#services, #about, #portfolio, #testimonials, #connect {
  scroll-margin-top: 5rem; /* matches header height */
}
```

**Verification:**
- [ ] Click each nav link — heading visible below header
- [ ] Works at 390px and 1280px viewports

**Related tests:** `tests/navigation.spec.js`

---

### BUG-007: Cross-page hash nav race condition

| Field | Value |
|-------|-------|
| **Status** | ⬜ Open |
| **Priority** | P1 |
| **Category** | Navigation / Bug |
| **Environment** | Preview + Production |
| **Files** | `src/components/Header.jsx:35-47`, `src/components/ScrollToTop.jsx:7-9` |

**Problem:** From `/contact`, clicking **Services** calls `navigate('/')` then `setTimeout(..., 100)` to scroll to `#services`. Meanwhile `ScrollToTop` scrolls to top on route change. 100ms may be too short on slow devices.

**Steps to reproduce:**
1. Go to `/contact`
2. Click **Services** in header
3. On slow network/device, may land at page top instead of `#services`

**Expected:** Reliable scroll to `#services` after cross-page navigation.

**Suggested fix:**
- Pass hash in navigate: `navigate('/#services')` and handle in a `useEffect` on Home
- Or increase timeout / use `requestAnimationFrame` loop until element exists
- Or skip `ScrollToTop` when navigating with hash

**Verification:**
- [ ] `/contact` → Services → lands on `#services` (test 10× on throttled network)
- [ ] Same-page anchor nav still works

**Related tests:** `tests/navigation.spec.js` — `cross-page hash nav from contact reaches services`

---

### BUG-008: Mobile menu missing a11y essentials

| Field | Value |
|-------|-------|
| **Status** | ⬜ Open |
| **Priority** | P1 |
| **Category** | Accessibility |
| **Environment** | Preview + Production |
| **Files** | `src/components/Header.jsx:117-169` |

**Problem:** Mobile menu overlay lacks:
- **Escape** key to close
- **Focus trap** (Tab escapes to background)
- **Body scroll lock** (page scrolls behind overlay)

**Steps to reproduce:**
1. Viewport 390px, go to `/`
2. Open hamburger menu
3. Press Escape → menu stays open
4. Scroll → background page moves
5. Tab repeatedly → focus may leave dialog

**Expected:** Escape closes; focus trapped; body scroll locked.

**Suggested fix:** Add `useEffect` for Escape listener, `overflow: hidden` on body, focus trap (Radix Dialog pattern or manual).

**Verification:**
- [ ] Escape closes menu
- [ ] Body doesn't scroll when menu open
- [ ] Tab cycles within menu only
- [ ] Focus returns to hamburger on close

**Related tests:** Add to `tests/navigation.spec.js`

---

### DEPLOY-001: Production deploy is stale

| Field | Value |
|-------|-------|
| **Status** | ⬜ Open |
| **Priority** | P1 |
| **Category** | DevOps |
| **Environment** | Production only |

**Problem:** Production `last-modified: Dec 2025`. Local preview has May 2026 changes (OG tags, og-image.png, etc.). Many fixes won't reach users until redeployed.

**Evidence:**
- Production `/contact` OG image: GitHub raw logo URL
- Preview `/contact` OG image: `https://www.vivekapatel.com/og-image.png`

**Suggested fix:** Deploy latest `main` build to Hostinger per project workflow.

**Verification:**
- [ ] Production `last-modified` updated after deploy
- [ ] OG tags match preview
- [ ] Smoke test all routes on production

---

## P2 — Medium

### BUG-009: Whitespace-only form values bypass JS validation

| Field | Value |
|-------|-------|
| **Status** | ⬜ Open |
| **Priority** | P2 |
| **Category** | Forms / Validation |
| **Files** | `src/pages/Contact.jsx:65-71` |

**Problem:** Validation checks `!formState.name` but `"   "` is truthy. No `.trim()`.

**Note:** Browser `type="email"` blocks `"   "` for email field, but name/description can still submit whitespace via mocked routes or programmatic submit.

**Suggested fix:**
```jsx
const name = formState.name.trim();
const email = formState.email.trim();
const description = formState.description.trim();
if (!name || !email || !description) { ... }
```

**Verification:**
- [ ] Submit whitespace name → validation error
- [ ] Valid trimmed input still works

---

### BUG-010: Contact social icons missing `aria-label`

| Field | Value |
|-------|-------|
| **Status** | ⬜ Open |
| **Priority** | P2 |
| **Category** | Accessibility |
| **Files** | `src/pages/Contact.jsx:352-367`, compare `src/components/Footer.jsx:42-45` |

**Problem:** LinkedIn/GitHub links at bottom of Contact page are icon-only with no `aria-label`. Footer social buttons have labels.

**Suggested fix:**
```jsx
<a href={...} aria-label="LinkedIn profile" ...>
<a href={...} aria-label="GitHub profile" ...>
```

**Verification:**
- [ ] axe/Lighthouse: no unlabeled icon buttons on `/contact`

---

### BUG-011: Home page missing OG/Twitter tags

| Field | Value |
|-------|-------|
| **Status** | ⬜ Open |
| **Priority** | P2 |
| **Category** | SEO |
| **Files** | `src/pages/Home.jsx:17-28` |

**Problem:** Home Helmet has title, description, keywords, canonical — but no `og:*` or `twitter:*` tags. Contact/Legal/DataPolicy pages have full tags.

**Suggested fix:** Copy OG/Twitter pattern from `Contact.jsx` Helmet block, using home-specific copy and `/og-image.png`.

**Verification:**
- [ ] View source on `/` — og:title, og:image, twitter:card present
- [ ] [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) shows correct preview

---

### BUG-012: OG image URL inconsistency

| Field | Value |
|-------|-------|
| **Status** | ⬜ Open |
| **Priority** | P2 |
| **Category** | SEO |
| **Files** | `index.html`, `src/pages/Home.jsx`, `src/pages/Contact.jsx`, production deploy |

**Problem:** Three different OG image sources:
- `index.html` → GitHub raw logo URL
- Page Helmet → `https://www.vivekapatel.com/og-image.png`
- Production (stale) → GitHub raw logo URL

**Suggested fix:** Use `https://www.vivekapatel.com/og-image.png` everywhere including `index.html`.

**Verification:**
- [ ] All pages and index.html reference same OG image URL
- [ ] `/og-image.png` returns 200 with correct dimensions (1200×630 recommended)

---

### BUG-013: NumberTicker truncates decimals

| Field | Value |
|-------|-------|
| **Status** | ⬜ Open |
| **Priority** | P2 |
| **Category** | UI / Bug |
| **Files** | `src/components/Stats.jsx:17-21`, `src/pages/Project.jsx:58-68` |

**Problem:** `Math.floor(progress * end)` truncates decimals. Project stats `4.9` displays as `4/5`, `99.9` as `99%`.

**Suggested fix:** Use `Math.min(progress * end, end)` with `toFixed(1)` for non-integer values, or separate integer/decimal logic.

**Verification:**
- [ ] Visit `/project/social-media-app` → stats show `4.9/5` and `99.9%` after animation completes

---

### BUG-014: Reduced motion inconsistently applied

| Field | Value |
|-------|-------|
| **Status** | ⬜ Open |
| **Priority** | P2 |
| **Category** | Accessibility |
| **Files** | `src/components/AnimatedHeroBackground.jsx`, `src/components/Hero.jsx`, `src/components/Stats.jsx`, `src/index.css:62-88` |

**Problem:** Global `MotionConfig reducedMotion="user"` and CSS rules cover some animations, but these still animate under `prefers-reduced-motion: reduce`:
- Hero background (Framer Motion layers)
- Scroll chevron bounce (Framer infinite loop)
- Stats NumberTicker (`requestAnimationFrame`)

**Suggested fix:** Gate each with `useReducedMotion()` hook or CSS `@media (prefers-reduced-motion: reduce)`.

**Verification:**
- [ ] Enable reduced motion in OS/browser
- [ ] Home page: static hero, no chevron bounce, static stat numbers

**Related tests:** `tests/preview-smoke.spec.js` — custom cursor reduced motion

---

### BUG-015: Lighthouse Performance below threshold

| Field | Value |
|-------|-------|
| **Status** | ⬜ Open |
| **Priority** | P2 |
| **Category** | Performance |
| **Target** | ≥ 0.90 (CI warns below this) |
| **Actual** | 0.80 – 0.83 |

**Contributors:**
| Source | File | Impact |
|--------|------|--------|
| 3× animated hero layers (120% size each) | `AnimatedHeroBackground.jsx` | GPU paint, LCP |
| 40 eager-loaded tech logos, duplicated marquee | `TechStack.jsx` | Network, TBT |
| 609 KB main JS bundle (191 KB gzip) | `dist/assets/index-*.js` | Parse time |
| Infinite CSS testimonial scroll | `Testimonials.jsx` | Continuous paint |

**Suggested fixes (in order of impact):**
1. Reduce hero to 1 animated layer
2. TechStack: `loading="lazy"`, reduce duplicate marquee items
3. Code-split heavy routes (Contact chunk is 283 KB)
4. Preload only LCP image, audit unused JS

**Verification:**
- [ ] `bunx @lhci/cli autorun` → performance ≥ 0.90
- [ ] LCP < 2.5s, CLS < 0.1

**Report:** [Lighthouse CI report](https://storage.googleapis.com/lighthouse-infrastructure.appspot.com/reports/1779693498323-74695.report.html)

---

## P3 — Low / Polish

### BUG-016: Sitemap omits `/project/*` URLs

| Field | Value |
|-------|-------|
| **Status** | ⬜ Open |
| **Priority** | P3 |
| **Category** | SEO |
| **Files** | `tools/generate-sitemap.js` |

**Problem:** Sitemap lists `/`, `/contact`, `/legal`, `/data-policy` only. No project case study URLs.

**Suggested fix:** Add project slugs when BUG-003/004 are resolved and content exists.

**Verification:**
- [ ] `public/sitemap.xml` includes valid project URLs
- [ ] Google Search Console sitemap accepted

---

### BUG-017: Orphan stub pages not routed

| Field | Value |
|-------|-------|
| **Status** | ⬜ Open |
| **Priority** | P3 |
| **Category** | Code hygiene |
| **Files** | `src/pages/PrivacyPolicy.jsx`, `src/pages/CookiePolicy.jsx` |

**Problem:** Empty stub components exist but aren't routed. Actual content lives in `Legal.jsx` and `DataPolicy.jsx`.

**Suggested fix:** Delete stubs OR redirect routes to canonical pages.

**Verification:**
- [ ] No dead files in `src/pages/`
- [ ] `/legal` and `/data-policy` still work

---

### BUG-018: Custom cursor edge cases

| Field | Value |
|-------|-------|
| **Status** | ⬜ Open |
| **Priority** | P3 |
| **Category** | UX |
| **Files** | `src/lib/customCursor.js`, `src/components/CustomCursor.jsx`, `src/hooks/useMousePosition.js`, `src/index.css:52-58` |

**Issues:**
- Cursor starts at `(-100, -100)` until first `mousemove` — possible flash
- `cursor: none` only on `html, body, a, button` — not `input`, `select`, `[role=button]`
- Hybrid touch+trackpad devices may get hidden native cursor while using touch

**Verification:**
- [ ] No visible cursor flash on first page load
- [ ] Inputs show text cursor on focus
- [ ] Touch devices: no custom cursor, native cursor visible

**Related tests:** `tests/preview-smoke.spec.js`, `src/lib/customCursor.test.js`

---

### BUG-019: Testimonials marquee doesn't pause on keyboard focus

| Field | Value |
|-------|-------|
| **Status** | ⬜ Open |
| **Priority** | P3 |
| **Category** | Accessibility (WCAG 2.2.2) |
| **Files** | `src/components/Testimonials.css:16-18` |

**Problem:** Marquee pauses on `:hover` only. Keyboard users tabbing into testimonial links cannot pause animation.

**Suggested fix:**
```css
.scroller:hover .scroller-inner,
.scroller:focus-within .scroller-inner {
  animation-play-state: paused;
}
```

**Verification:**
- [ ] Tab into testimonial card → animation pauses
- [ ] Tab out → animation resumes

---

### BUG-020: Footer "Manage Consent" misleading toast

| Field | Value |
|-------|-------|
| **Status** | ⬜ Open |
| **Priority** | P3 |
| **Category** | UX |
| **Files** | `src/components/Footer.jsx:12-15` |

**Problem:** Clicking **Manage Consent** opens cookie banner immediately, but toast says "Scroll down to adjust your cookie preferences."

**Suggested fix:** Update toast to "Cookie preferences opened." or remove toast entirely.

**Verification:**
- [ ] Click Manage Consent → banner visible, toast text accurate

**Related tests:** `tests/cookie-consent.spec.js`

---

## Production vs Preview Parity

| Check | Preview (May 2026) | Production (Dec 2025) |
|-------|--------------------|-----------------------|
| Build freshness | Current | Stale — [DEPLOY-001](#deploy-001-production-deploy-is-stale) |
| OG image on `/contact` | `/og-image.png` | GitHub raw logo |
| GA after consent | Broken | Broken |
| Core routes | Pass | Pass |
| Lighthouse Performance | 0.83 | Not re-tested |

---

## Test Coverage

| Spec | Covers |
|------|--------|
| `tests/preview-smoke.spec.js` | Route rendering, reduced-motion cursor |
| `tests/navigation.spec.js` | Hash nav, mobile menu, 404 redirect |
| `tests/cookie-consent.spec.js` | Banner delay, accept, manage consent |
| `tests/contact-form.spec.js` | HTML5 validation, partial success, DB failure |
| `playwright-output/qa-*.spec.js` | Exploratory QA (throwaway) |

**Run all:** `bunx playwright test tests/`

---

## Suggested Fix Order

1. BUG-001 — GA consent (1 line)
2. BUG-002 — Contact partial success UX
3. DEPLOY-001 — Ship fixes to production
4. BUG-005 — Nested main (quick)
5. BUG-006 — scroll-margin-top (quick CSS)
6. BUG-010 — aria-labels (quick)
7. BUG-011 + BUG-012 — OG tags (SEO win)
8. BUG-008 — Mobile menu a11y
9. BUG-007 — Hash nav race
10. BUG-003 + BUG-004 + BUG-016 — Portfolio/case studies (larger effort)
11. BUG-015 — Performance (incremental)
12. Remaining P2/P3 items

---

## Changelog

| Date | Action |
|------|--------|
| 2026-05-25 | Initial tracker created from Expert QA Team session |
