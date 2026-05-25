# QA Session Insights

**Session:** Expert Website QA Team — 2026-05-25
**Environments tested:** Local preview (`127.0.0.1:4173`) + Production (`vivekapatel.com`)

---

## Executive Summary

39/56 preview-desktop automated checks passed. Lighthouse Performance **0.83** (below 0.90 target). **18 confirmed bugs/gaps** found across analytics, forms, accessibility, routing, SEO, and performance. Production deploy appears stale (Dec 2025) vs local preview.

---

## P0 — Critical (fix immediately)

### BUG-001: Google Analytics never loads after cookie consent
- **Severity:** P0 | **Env:** Preview + Prod
- **Steps:** Accept cookies → check for gtag/GA scripts
- **Expected:** GA loads on production after consent
- **Actual:** `gtag` undefined, 0 GTM scripts on prod even with analytics consent in localStorage
- **Root cause:** [`GoogleAnalytics.jsx`](src/components/GoogleAnalytics.jsx) requires `hasConsent` prop; [`Layout.jsx`](src/components/Layout.jsx) L120 renders `<GoogleAnalytics />` without it. Internal guard `if (!hasConsent) return` blocks script injection.
- **Fix:** Pass `hasConsent={true}` or remove redundant prop check since component only mounts when `gaConsent` is true.

### BUG-002: Contact form reports success when email notification fails
- **Severity:** P0 | **Env:** Preview (confirmed via console)
- **Steps:** Submit valid form → Supabase insert succeeds → edge function returns 500
- **Expected:** User warned of partial failure
- **Actual:** Form resets, success toast shown (toast auto-dismisses quickly). Console: `Error invoking email function: FunctionsHttpError`
- **Ref:** [`Contact.jsx`](src/pages/Contact.jsx) L105-116 — errors logged but success toast always shown
- **Note:** Resend API also misconfigured (testing-only domain restriction)

---

## P1 — High (professional polish)

### BUG-003: Portfolio never links to internal case studies
- **Env:** Both | **Ref:** [`Portfolio.jsx`](src/components/Portfolio.jsx) — all 6 projects `isExternal: true`
- Internal `/project/:slug` route exists but is unreachable from UI. Dead code in `handleProjectClick`.

### BUG-004: Project page has stale mock data
- **Env:** Both | **Ref:** [`Project.jsx`](src/pages/Project.jsx) L13-71
- Only `social-media-app` key exists with "Next-Gen Banking UI" content — mismatched slug/title.

### BUG-005: Nested `<main>` landmarks (invalid HTML/a11y)
- **Env:** Both | **Verified:** 2 `<main>` elements on `/project/social-media-app`
- **Ref:** [`Project.jsx`](src/components/Project.jsx) L157 inside [`Layout.jsx`](src/components/Layout.jsx) L123

### BUG-006: Header anchor scroll — fixed header covers section tops
- **Env:** Both | **Verified:** `scroll-margin-top: 0px` on `#services`
- **Ref:** Section IDs in Services/About/Portfolio/Testimonials lack `scroll-margin-top: 5rem`

### BUG-007: Cross-page hash nav race condition
- **Env:** Both | **Ref:** [`Header.jsx`](src/components/Header.jsx) L40-47 + [`ScrollToTop.jsx`](src/components/ScrollToTop.jsx)
- 100ms timeout may fail on slow devices; `ScrollToTop` scrolls to top before anchor scroll fires.

### BUG-008: Mobile menu missing a11y essentials
- **Env:** Both | **Ref:** [`Header.jsx`](src/components/Header.jsx) L117-169
- No Escape to close, no focus trap, no body scroll lock when open.

---

## P2 — Medium

### BUG-009: Whitespace-only form values bypass JS validation
- **Ref:** [`Contact.jsx`](src/pages/Contact.jsx) L65 — no `.trim()` on name/email/description

### BUG-010: Contact page social icons missing `aria-label`
- **Ref:** [`Contact.jsx`](src/pages/Contact.jsx) L352-367 (Footer icons have labels; Contact icons don't)

### BUG-011: Home page missing Open Graph / Twitter tags
- **Ref:** [`Home.jsx`](src/pages/Home.jsx) L17-28 — only title, description, keywords, canonical

### BUG-012: OG image URL inconsistency
- `index.html` uses GitHub raw URL for og:image
- Page-level Helmet uses `https://www.vivekapatel.com/og-image.png`
- Production contact page still serves old GitHub logo URL (deploy drift)

### BUG-013: NumberTicker truncates decimals
- **Ref:** [`Stats.jsx`](src/components/Stats.jsx) L20 — `Math.floor(progress * end)` shows `4/5` not `4.9/5`, `99%` not `99.9%`

### BUG-014: Reduced motion inconsistently applied
- Hero background animation, scroll chevron bounce, Stats NumberTicker ignore `prefers-reduced-motion`
- TechStack/Testimonials partially covered via CSS/MotionConfig

### BUG-015: Lighthouse Performance below threshold
- **Score:** 0.80–0.83 (target ≥ 0.90)
- **Contributors:** AnimatedHeroBackground (3× 120% layers), TechStack (40 eager logos), large JS bundle (609KB main chunk)

---

## P3 — Low / Polish

### BUG-016: Sitemap omits `/project/*` URLs
- **Ref:** [`tools/generate-sitemap.js`](tools/generate-sitemap.js)

### BUG-017: Orphan stub pages not routed
- [`PrivacyPolicy.jsx`](src/pages/PrivacyPolicy.jsx), [`CookiePolicy.jsx`](src/pages/CookiePolicy.jsx) — empty, unused

### BUG-018: Custom cursor edge cases
- Initial position (-100,-100) before first mousemove; `cursor:none` doesn't cover inputs/selects
- Hybrid touch+trackpad devices may get hidden native cursor

### BUG-019: Testimonials marquee doesn't pause on keyboard focus
- Hover-only pause in CSS; WCAG 2.2.2 concern

### BUG-020: Footer "Manage Consent" shows misleading toast
- **Ref:** [`Footer.jsx`](src/components/Footer.jsx) L12-15 — says "Scroll down" but banner opens immediately

---

## Production vs Preview Parity

| Check | Preview | Production |
|---|---|---|
| Build date | May 2026 (local) | Dec 2025 (stale) |
| OG image on /contact | og-image.png (Helmet) | GitHub raw logo (old deploy) |
| GA after consent | Broken (hasConsent) | Broken (hasConsent) |
| Core routes | Pass | Pass |
| Performance | 0.83 | Not measured (likely similar/worse) |

---

## Improvement Backlog (prioritized)

1. **Fix GA consent wiring** — one-line fix in Layout.jsx
2. **Handle contact form partial success** — warn user if email fails
3. **Wire portfolio to case studies** OR remove `/project` route until ready
4. **Replace Project.jsx mock data** with real case study content
5. **Remove nested `<main>`** — use `<div>` or `<article>` on Project page
6. **Add `scroll-margin-top: 5rem`** to section anchor IDs
7. **Increase hash nav timeout** or use `useLayoutEffect` + scroll restoration
8. **Mobile menu:** Escape handler, focus trap, `overflow:hidden` on body
9. **Add `.trim()` validation** on contact form
10. **Add aria-labels** to Contact social icon links
11. **Add OG/Twitter tags** to Home.jsx Helmet
12. **Unify OG image** to `/og-image.png` everywhere
13. **Fix NumberTicker** for decimal values
14. **Lazy-load TechStack logos** (`loading="lazy"`)
15. **Reduce AnimatedHeroBackground** layers (1 layer instead of 3)
16. **Add project URLs to sitemap** when case studies go live
17. **Deploy latest build to production**

---

## Test Artifacts

- QA scripts: `playwright-output/qa-*.spec.js` (throwaway exploration)
- Promoted regressions: `tests/navigation.spec.js`, `tests/cookie-consent.spec.js`, `tests/contact-form.spec.js`
- Lighthouse report: https://storage.googleapis.com/lighthouse-infrastructure.appspot.com/reports/1779693498323-74695.report.html
- Performance: 0.83 | Accessibility: pass (≥0.95) | SEO: pass (≥0.95)

---

## Real Submission Log

- Preview: QA Test submission created in Supabase; email function failed (Resend domain restriction); form reset with silent success behavior confirmed.
