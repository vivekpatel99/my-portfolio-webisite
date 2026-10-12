# Issue #328 review: service route pending fallback

I found no blocking issues. Reading the source supports acceptance criteria 1–5 as written. The Playwright, build and test results you listed come from your session; I did not rerun anything here. There are four non-blocking findings below. The first one matters for criteria 2 and 6.

**Model:** the profile requests claude-opus-5.5. The session context says the same, but I have no served-model attestation, so I can't confirm which model was actually served.

## What the code supports

- **Criterion 1:** While the chunk is held, `RouteLoading.jsx:9-17` takes the service from the URL and shows its title, summary and Back to Services link (`RouteLoading.jsx:23-36`). It also shows a visible status message and sets the same `routeSeo` metadata the final page uses. The header stays in place because the fallback sits inside `Layout`'s `main` (`Layout.jsx:121-127`). It adds no new code to the main bundle: `serviceOffers`, `seo`, `Link` and `ArrowLeft` are already loaded there by `Services.jsx`, `CTA.jsx` and `RouteErrorBoundary.jsx`.
- **Criterion 2:** Each state has one h1. The fallback swaps out when the chunk arrives, and `ServiceDetail.jsx:17` writes the same metadata, so the title shouldn't flicker.
- **Criterion 3:** The status keeps `aria-label="Loading page"` (`RouteLoading.jsx:37`), which the retry focus check in `RouteErrorBoundary.jsx:75` looks for. The fallback reads the current location on every render, so it updates when you navigate while loading. React Router 6.16.0 has no transition flag turned on, so navigation shows the fallback rather than holding the old page.
- **Criterion 5:** `tools/generate-static-route-html.js` doesn't change. The new spec is limited to local-only and WebKit-local projects (`qa.config.js`), and `qa-artifact-config.test.js` checks that it stays out of the default projects.

## Findings

**1. MEDIUM: the loading view doesn't match the final layout, so content jumps when the chunk arrives (criteria 2 and 6).**
- `RouteLoading.jsx:22-36` copies only part of `ServiceDetailContent.js:37-64`. It leaves out the `SERVICE · OFFER 0N` eyebrow (lines 57-61, mb-6, about 40px), the divider (line 63, about 33px more than `mt-8`), the background glow (lines 38-41) and the two-column grid at the `lg` breakpoint (line 53).
- Rough estimate from the source, not measured: on all widths the h1 moves down about 40px and the summary about 73px. From 1024px up, the final h1 column is about 612px wide (1084 − 64, split 1.2:0.8) versus up to 760px while loading, so the title may also wrap differently.
- The eyebrow number can be computed immediately from `serviceOffers`, so nothing stops the loading view from showing it.
- No test checks that positions stay stable. `expectServiceContext` (`qa-service-loading.spec.js:36-56`) only checks overflow, fit and that the h1 sits below the header.
- **Acceptance criterion:** at 1440, 390 and 320px in Chromium and WebKit, the h1 and summary `getBoundingClientRect()` top, left and width change by 1px or less between loading and released. Only the status line may disappear.

**2. LOW: duplicated markup can drift.**
- The h1 classes (`RouteLoading.jsx:29` vs `ServiceDetailContent.js:62`) and summary classes (`:33` vs `:64`) are copied by hand.
- The link uses a hard-coded `"/#services"` (`RouteLoading.jsx:24`) instead of the exported `SERVICES_SECTION_HREF` (`ServiceDetailContent.js:9`).
- **Fix:** move the shared intro (eyebrow, h1, divider, summary) into a small module that both files use. Don't import `ServiceDetailContent` itself into the fallback, because that would merge the chunk into the main bundle.
- **Alternative:** the `ServiceDetail` chunk is small, and `Project` and `CaseStudies` are already loaded upfront (`App.jsx:4-6`). Loading `ServiceDetail` upfront too would remove the waiting state entirely. That conflicts with how the issue frames criteria 1–3, so it's for you to decide, not a defect.

**3. LOW: an undeclared string links two files (criterion 3).**
- `RouteErrorBoundary.jsx:75` finds the loading view with `[role="status"][aria-label="Loading page"]`, which only works if `RouteLoading.jsx:37` keeps that exact label.
- The status's accessible name ("Loading page") also differs from its visible text ("Loading service details…").
- **Fix:** export one constant or a `data-route-loading` attribute and use it in both files. Then the label can match the visible text.

**4. LOW: the change also affects other lazy routes (out of scope, no tests).**
- `/contact`, `/legal` and `/data-policy` now show a large uppercase "LOADING PAGE" h1 plus the status "Loading page…", so screen readers hear it twice. They also get route-specific SEO tags while loading.
- The new spec only covers the unknown-service version of this fallback.
- **Acceptance criterion:** with each of those chunks held, there is one h1, the title and canonical match `routeSeo`, the page is indexable, and nothing overflows at 320px. Or make the generic fallback visually quieter.

**NIT:** `qa-service-loading.spec.js:188,190` names a resolve function `reject`.

## Untested runtime hypotheses

1. **Production page swap.** `main.jsx` uses `createRoot` rather than hydration, so it throws away the content generated into `#root` at build time. On Apache-served `/services/<id>/` with JS on and the chunk held, the expected sequence is full page, then the loading view, then the full page again, with two shifts. The new spec loads paths without a trailing slash. Whether `vite preview` serves the generated HTML there is unverified.
2. **Screen reader announcement.** A `role="status"` that already contains its text when it appears may not be announced reliably, especially in VoiceOver on WebKit. The h1 still gives context either way.
3. **Cookie banner.** The spec stores consent before loading, so on a first visit at 320px the banner might cover the status or the Back link while loading. Not tested.
4. **Layout shift metric.** The jump in finding 1 might count toward CLS, since nothing is clicked shortly before the chunk arrives. I haven't measured it and I'm not claiming any loading-time or CLS numbers (criterion 6).

## Skills and references I loaded

- **AGENTS.md** (provided in context), **DESIGN.md**, and **docs/design-system.md** (provided in context). The fallback keeps the dark background, the theme tokens and the factual copy. It adds no confidence scores (OC-01).
- **impeccable:** `SKILL.md` lines 1–120 and `reference/audit.md` lines 1–80. I didn't run its context launcher or detector because shell commands weren't allowed. This was a partial technical audit, so I've given no audit scores and no complete critique.
- **web-design-guidelines:** `SKILL.md` only. I didn't fetch its remote rule list because external requests weren't allowed, so I applied its principles from memory without the latest rule text.
- **vercel-react-best-practices:** the `SKILL.md` index only, no rule files. I found no re-render, bundle or loading-waterfall issues beyond finding 2.