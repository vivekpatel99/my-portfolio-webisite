# Performance, technical SEO & accessibility audit: vivekapatel.com

- Scope: `develop` @ `fff5306`, production build in `dist/`, served by `vite preview` at http://127.0.0.1:4173. Audit date: 2026-09-26. No source changes were made.
- Artifacts: `.kiro-audit-tmp/perf/` (Lighthouse JSON `lh-*.json`, `axe-results.json`, `runtime-results.json`, `idle-cost.txt`, plus the scripts `axe-run.js`, `runtime-run.js`, `idle-cost-run.js`, `lh-summary.mjs`, `lh-detail.mjs`).
- Realism caveats:
  - `vite preview` serves assets uncompressed (no `content-encoding`), returns 200 for every path (SPA fallback) and has no CDN, so these numbers are not production numbers.
  - The live site (`server: hcdn`) serves Brotli. The main JS is 490 KB raw, 150 KB gzip, 125 KB brotli.
  - Lighthouse mobile uses simulated 4× CPU and slow-4G throttling, so its LCP values are *relative* signals.
  - HTTP status behaviour was checked against `dist/.htaccess` and against the live site with `curl`.

## Metrics

| Page | Form | Perf | A11y | BP | SEO | FCP | LCP | TBT | CLS | LCP element | Transfer |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `/` | mobile | 89 | 93 | 100 | 100 | 1.7 s | **3.7 s** (88% render delay) | 0 ms | 0 | hero bio `<p>` | 966 KiB |
| `/` | desktop | 100 | 96 | 100 | 100 | 0.4 s | 0.7 s | 0 ms | 0 | hero portrait `<img>` | 1,003 KiB |
| `/case-studies/` | mobile | 93 | 91 | 100 | 100 | 1.7 s | **3.1 s** (LCP img lazy-loaded) | 0 ms | 0 | 1st card `<img loading=lazy>` | 846 KiB |
| `/project/yolo-computer-vision-optimization/` | mobile | 96 | 96 | 100 | 100 | 1.7 s | 2.7 s (83% render delay) | 0 ms | 0 | gallery `<img>` | 363 KiB |
| `/project/yolo-…/` | desktop | 100 | 100 | 100 | 100 | 0.4 s | 0.5 s | 0 ms | 0 | gallery `<img>` | 363 KiB |
| `/services/computer-vision-production-optimization` | mobile | 97 | 92 | 100 | 100* | 1.7 s | 2.3 s | 0 ms | 0 | summary `<p>` | 226 KiB |
| `/contact/` | mobile | 97 | 93 | 100 | 100 | 1.7 s | 2.3 s | 0 ms | 0 | header label | 236 KiB |

\* The Lighthouse SEO score of 100 on `/services/*` is misleading. Locally the preview server returns 200. **In production the same URL returns HTTP 404** (see PX-01).

axe-core 4.x violation counts. Each page was scrolled first so the in-view sections render, and the scan ran after the 1.5 s cookie-banner delay.

| Page | Desktop rules / nodes | Mobile rules / nodes | Rules hit |
|---|---|---|---|
| `/` | 2 / 24 | 2 / 24 | color-contrast (serious, 23), landmark-complementary-is-top-level (1) |
| `/case-studies/` | 2 / 10 | 2 / 10 | color-contrast (9), heading-order (1) |
| `/contact/` | 2 / 2 | 2 / 2 | color-contrast (1), landmark-complementary-is-top-level (1) |
| `/project/yolo-…/` | 0 / 0 | 0 / 0 | none |
| `/services/computer-vision-production-optimization` | 1 / 1 | 1 / 1 | color-contrast (1) |

Lighthouse also reported `target-size` (mobile) and `label-content-name-mismatch` on every page.

Other measurements:
- **Idle animation cost** on home, 5 s idle, 6× CPU throttle, measured with CDP `Performance.getMetrics`:
  - Motion on: 489 ms task time, 296 style recalcs, 296 layouts.
  - Reduced motion: 32 ms, 0 recalcs, 0 layouts.
  - Motion on, scrolled to the footer: 434 ms, 299 layouts.
- **App rAF callbacks** in 2 s while scrolled away with no mouse: 122. There are 13 infinite animations running.
- **Console:** one warning on `/`: "…71f6723b117af5fb7e36d829dfcd6b7f.jpg was preloaded using link preload but not used…". There were no errors and no failed requests.
- **Bundles (raw / gzip / brotli):**
  - `index-j2GskmFX.js`: 490,326 / 150,500 / 125,010
  - `ContactRoute`: 85,296 / 24,424 / 21,508
  - CSS: 61,649 / 12,091 / 10,103
  - No source maps are emitted.

## Findings

Severity: P0 = the conversion or indexing path is broken; P1 = high impact, fix before the next release; P2 = fix soon; P3 = hygiene. Effort: S < ½ day, M 1–3 days, L > 3 days.

### PX-01 · P0: Service detail pages return HTTP 404 in production and are missing from the sitemap
- **Evidence:**
  - `curl -o /dev/null -w "%{http_code}" https://www.vivekapatel.com/services/computer-vision-production-optimization` returns `404`.
  - `dist/.htaccess:27-33` only rewrites `^$`, `contact|legal|data-policy` and `project/(…)`. Everything else falls through to `RewriteRule ^ - [R=404,L]`, which serves `404.html` with `<meta name="robots" content="noindex, nofollow">`.
  - There is no `dist/services/` directory because `routeSeo` in `src/lib/seoConfig.js:36-88` has no `/services/*` entries. As a result the pages are neither in `generate-static-route-html.js` output nor in `dist/sitemap.xml` (17 URLs, 0 services).
  - The React route exists (`src/App.jsx:22`) and the home Services accordion links to it (`src/components/Services.jsx:127`).
- **Impact:**
  - The three pages that describe what Vivek sells (including "Computer Vision Production Optimization") can never be indexed.
  - Link checkers and SEO tools see 404s.
  - A visitor who shares or bookmarks one gets a 404 status, even though JS repaints it.
  - This is the most direct loss of qualified CV-intent traffic.
- **Fix:**
  - Add `/services/${id}` entries built from `serviceOffers` to `routeSeo`, so the sitemap and static shells are generated.
  - Prerender the service body the same way project pages are.
  - Add `^services/(data-extraction-automation-sprint|computer-vision-production-optimization|ai-workflow-buildout)/?$` to `public/.htaccess`. Extend `assertCaseStudyRouteSources` so the build fails if a route is missing.
- **Effort:** S–M

### PX-02 · P1: Service pages have no route SEO, so they canonicalize to the home page; unknown service IDs are soft 404s
- **Evidence:**
  - `src/pages/ServiceDetail.jsx` renders no `<Seo>`.
  - A runtime check on `/services/computer-vision-production-optimization` gave `title = "Vivek Patel - Expert AI & Computer Vision Engineer"`, `canonical = https://www.vivekapatel.com/`, and no robots meta (`runtime-results.json`).
  - The "Service Not Found" branch (`ServiceDetail.jsx:11-22`) returns a 200 page with no `noindex`.
- **Impact:** Even after PX-01 is fixed, Google will fold the service pages into `/` as duplicates. Invalid IDs create indexable thin pages.
- **Fix:**
  - Render `<Seo title="Computer Vision Production Optimization – Freelance CV Engineer | Vivek Patel" path={`/services/${id}`} …/>` built from `serviceOffers`.
  - Use `noindex` on the not-found branch.
- **Effort:** S

### PX-03 · P1: Home, Contact, Legal and Data-policy HTML contain an empty `<div id="root"></div>`, so non-JS crawlers see no content
- **Evidence:**
  - Body text after tag stripping: `dist/index.html` 3 chars and 0 `<h1>`; `dist/contact/index.html` 3 chars.
  - For comparison, `dist/case-studies/index.html` has 2,218 chars and 1 h1, and `dist/project/yolo-…/index.html` has 1,469 chars and 1 h1.
  - `tools/generate-static-route-html.js:147-165` only injects markup for `/case-studies` and `/project/*`.
- **Impact:**
  - Link-preview bots, AI crawlers (GPTBot, ClaudeBot, PerplexityBot) and the first indexing wave see the home page as meta tags only: no H1 "Computer Vision & AI Engineer", no services, no internal links to case studies.
  - It also forces the mobile home LCP to wait for the full JS bundle (render delay 3,227 ms, 88% of LCP).
- **Fix:**
  - Extend the generator to `renderToStaticMarkup` a crawlable home body (Hero text and H1, the featured case-study cards with links, the service summaries and links, a contact CTA) plus a minimal header and footer nav.
  - Do the same for Contact (H1, what-happens-next copy, email link).
  - Long-term, prerender every route through the real `Layout` (vite-ssg / react-router `StaticRouter` over `App`).
- **Effort:** M

### PX-04 · P1: Prerendered HTML is thrown away on boot (`createRoot`, not `hydrateRoot`), so LCP waits for JS even on prerendered pages
- **Evidence:**
  - `src/main.jsx:9` calls `ReactDOM.createRoot(...).render(...)`.
  - The prerendered article has no Layout: no header, cookie spacer or footer (`generate-static-route-html.js:161`). The client tree therefore cannot match it, and React replaces it.
  - LCP phases: `/project/yolo-…/` has 2,263 ms render delay (83%); `/case-studies/` has 1,625 ms render delay plus 849 ms load delay.
- **Impact:** Prerendering currently helps SEO but not Core Web Vitals. On a real low-end phone the static article paints, then gets torn down and re-inserted below a header that suddenly appears.
- **Fix:**
  - Prerender with the same `<Layout>` shell (header, main, footer) and switch to `hydrateRoot` for prerendered routes.
  - Until then, add the static header height to the prerendered shell so the swap does not move content.
- **Effort:** M–L

### PX-05 · P1: Home preloads an unused 100 KB third-party JPG that competes with the JS bundle
- **Evidence:**
  - `index.html:23-25` has `<link rel="preload" as="image" href="https://horizons-cdn.hostinger.com/…/71f6723b117af5fb7e36d829dfcd6b7f.jpg">`. `curl` returned 200 with 102,299 bytes.
  - It is referenced only by `AnimatedHeroBackground.jsx` and `AnimatedCtaBackground.jsx`, and neither component is imported anywhere (grep shows no importer). Both are dead code.
  - Chrome warns that the preload was not used (console, `runtime-results.json`).
  - Lighthouse `uses-long-cache-ttl` flags the same resource.
  - The live site fetches it before consent (Playwright on https://www.vivekapatel.com/).
- **Impact:**
  - On slow 4G it steals bandwidth from `index-*.js`, and LCP on home is JS-bound.
  - It adds an extra third-party origin (TLS and DNS).
  - It is a third-party request made before consent.
- **Fix:**
  - Delete the preload (and the stale "ASSET CONFIGURATION" comment) from `index.html`.
  - Remove the two dead background components and `backgrounds` from `src/config/links.js`.
- **Effort:** S

### PX-06 · P1: Case-study card images ship 1–3k-px PNG screenshots into 332 px slots, with no srcset or modern formats
- **Evidence:**
  - Runtime `naturalWidth` vs `clientWidth` on a 390 px viewport:
    - `n8n-openai-data-extraction-b11f…png`: 2984 px shown at 332 CSS px, 510 KB
    - `ai-invoice-processing-automation-f36f…png`: 2448 px shown at 332, 257 KB
    - `healthcare-…png`: 1098 px shown at 332, 286 KB
    - Portrait `vivek-black-and-white.webp`: 1008×1367 shown at 86 px on mobile
    - Logo `mylogo.png`: 500×500, 50 KB
  - Lighthouse `uses-responsive-images` estimates savings of 649 KiB on `/`, 501 KiB on `/case-studies/` and 119 KiB on the project page. `modern-image-formats` estimates 243 KiB on `/` and 375 KiB on `/case-studies/`.
  - `CaseStudyCard.js:62-66` uses `project.image.src`, the full original, with no `srcset`/`sizes`.
  - The publication plugin already produces 320 px `-thumb-*.jpg` derivatives (`src/lib/caseStudyThumbnails.js`), but only the gallery filmstrip uses them.
  - `dist/assets/case-studies` is 8.2 MB.
- **Impact:** Mobile data waste of about 0.5–0.65 MB per landing page, slower LCP on `/case-studies/`, and a heavier "above the fold" portfolio on home.
- **Fix:**
  - In the publication plugin, emit 480/800/1200 px WebP (optionally AVIF) variants per image, then render `srcset` and `sizes="(min-width:1024px) 360px, 90vw"` in `CaseStudyCard` and in the gallery stage.
  - Serve a roughly 600 px portrait variant and a 64 px or SVG logo.
- **Effort:** M

### PX-07 · P2: The LCP image is lazy-loaded on `/case-studies/`, and the hero portrait lacks priority hints and dimensions
- **Evidence:**
  - Lighthouse `lcp-lazy-loaded` fails. The LCP element is the first card `<img loading="lazy">` (`CaseStudyCard.js:65`), with 849 ms load delay.
  - The hero `<img src="/assets/images/vivek-black-and-white.webp">` (`Hero.jsx:356-360`) has no `width`/`height` and no `fetchpriority`. It is the desktop LCP element, and `prioritize-lcp-image` estimates 120 ms savings.
- **Fix:**
  - Accept a `priority` prop in `CaseStudyCard`. The first 2–3 cards in the grid, and the featured cards on home, should use `loading="eager" fetchpriority="high"`.
  - Add `width="1008" height="1367" fetchpriority="high" decoding="async"` to the hero portrait.
- **Effort:** S

### PX-08 · P2: Home animations run permanently, even off-screen and with no pointer, which costs about 10% of the main thread on low-end phones
- **Evidence:**
  - `Hero.jsx:17-62`: the parallax `tick()` re-queues `requestAnimationFrame` forever, even with no mouse (touch devices), and writes 2 CSS vars × 8 boxes each frame. 122 app rAF callbacks were counted in 2 s while scrolled to the footer.
  - 13 infinite CSS animations run: `bg-drift*`, `ghost-trail-*`, and `photo-scan`, which animates `top` (`Hero.jsx:462-467`) and forces layout every frame.
  - At 6× CPU throttle: 489 ms task time and 296 layouts per 5 s idle, versus 32 ms and 0 layouts with reduced motion.
  - `prefers-reduced-motion` is honoured correctly (verified: 0 running animations), and `CustomCursor` is disabled on coarse pointers.
- **Impact:** Battery and jank on the mid- or low-end Android phones clients use. It competes with INP when a user taps the CTA.
- **Fix:**
  - Start the rAF loop from `mousemove` and stop once `|target-cur| < 0.1`.
  - Skip parallax entirely on `(pointer: coarse)`.
  - Pause all hero animations with an IntersectionObserver when the hero is off-screen (toggle `animation-play-state`).
  - Animate the scan line with `transform: translateY()` instead of `top`.
  - Drop `willChange` on 12+ static elements.
- **Effort:** S–M

### PX-09 · P2: The single 150 KB-gzip entry chunk includes every non-contact page and framer-motion
- **Evidence:**
  - `src/App.jsx:4-7` eagerly imports `Home`, `NotFound`, `Project` and `CaseStudies`. Only Contact, ServiceDetail, Legal and DataPolicy are `lazy()`.
  - `vite.config.js` has no `manualChunks`.
  - Lighthouse `unused-javascript` reports 48–66 KiB per page.
  - Fingerprint grep of `dist/assets/index-*.js`:
    - **Not present** in the client bundle: `gray-matter`, `marked`, `@babel/*`, Sentry SDK (tree-shaken, because `VITE_SENTRY_DSN` was not set at build time), and Convex (it appears only in `ContactRoute-*.js`).
    - **Present:** React DOM, react-router, react-helmet, radix (toast, checkbox, collapsible), lucide, framer-motion (used only for fades, the cursor spring and the banner fade-in), and the case-study data (about 35 KB raw / 9.5 KB gzip).
  - `package.json` lists build-only packages under `dependencies`: `gray-matter`, `marked`, `@babel/traverse`, `image-size`, `he`.
- **Impact:** The home page parses code for Project, CaseStudies and the gallery that it never renders. That lengthens the JS-bound LCP from PX-03.
- **Fix:**
  - `lazy()` `Project` and `CaseStudies`.
  - Replace `SectionAnimator` and the banner `motion.div` with CSS plus IntersectionObserver, or use `LazyMotion` + `m` with `domAnimation` (about −25–30 KB gzip).
  - Add `manualChunks: { react: ['react','react-dom','react-router-dom'] }` so vendor code stays cached across deploys.
  - Move the build-only packages to `devDependencies`.
  - Remove the leftover Horizons `rollupOptions.external` for `@babel/*`.
- **Effort:** M

### PX-10 · P2: Contrast failures on the brand CTA and on the tiny grey mono labels
- **Evidence (axe, serious):**
  - `#6b7280` on `#0c0d0d` is 4.02:1 on 10–11 px labels ("ABOUT · DETECTED", "KEY DIFFERENTIATORS", every card `time` "Completed …") and on 13.4 px process copy. On `#161718` it drops to 3.71:1.
  - The hero primary CTA "Request a Project Estimate" is white on `#8B5CF6`, 4.23:1 (`Hero.jsx:420`).
  - The service page CTA is `#0f172a` on `#7c3aed`, 3.13:1 (`ServiceDetail.jsx:74`, shadcn `text-primary-foreground`).
  - Contact `.sub` is 3.53:1 at 9 px.
  - Contact field labels are 9 px `#6b7280` (`Contact.jsx:244,267,290,312`).
  - Hero invoice labels are 9 px `text-gray-500` over a gradient; axe reports them as "incomplete", but they are the same colour pair.
- **Impact:** This fails WCAG 1.4.3 AA on the primary conversion button and on the contact form. The 9–10 px labels are hard to read on phones for every visitor, not only low-vision users.
- **Fix:**
  - Use `#9ca3af` (gray-400, about 7.4:1 on `#0c0d0d`) for labels, with a minimum of 11 px, and 12 px for form labels.
  - Change CTA backgrounds to `#7C3AED` (white is 5.7:1) and keep `#8B5CF6` for hover or borders.
  - Set white text on the service-page button.
- **Effort:** S

### PX-11 · P2: Heading structure is broken on home, case-studies and services
- **Evidence:**
  - Home has 2× `<h1>`: "Computer Vision & AI Engineer" and Testimonials "CLIENT RESULTS" (`Testimonials.jsx:47`).
  - `/case-studies/` has card `<h3>` directly after the `<h1>` with no `<h2>` (axe `heading-order`).
  - The cookie banner uses `<h3>` (`CookieConsentBanner.jsx:127`).
  - The service accordion `<h3>` sits inside `role="button"` (`Services.jsx:50-60`), which strips heading semantics because button children are presentational.
- **Impact:** Weaker topical signal for "computer vision engineer", and a confusing outline for screen-reader users.
- **Fix:**
  - Make Testimonials an `<h2>`.
  - Add a visually-hidden or real `<h2>` ("Featured case studies") on `/case-studies/`.
  - Make the banner title a `<p>`/`<h2>`.
  - Use the WAI accordion pattern: an `<h3><button aria-expanded>…</button></h3>`.
- **Effort:** S

### PX-12 · P2: Structured data is site-wide boilerplate only, with no per-page schema
- **Evidence:**
  - Every route carries the same two blocks from the `index.html` shell: `Person` and `ProfessionalService` (runtime `ldTypes` on all six routes).
  - There is no `Article`/`CreativeWork` for the 12 case studies, no `BreadcrumbList`, no `Service`/`Offer` for service pages and no `FAQPage`. `grep -rn "ld+json" src` returns nothing.
  - `ProfessionalService` lacks `address`, `image`, `@id` and a `provider` link to the Person.
  - `priceRange: "€45/hour"`.
- **Impact:** No rich-result eligibility (breadcrumbs, article dates, author entity), and Google gets a weaker entity connection between "Vivek Patel" and "computer vision".
- **Fix:** Emit JSON-LD per route in `generate-static-route-html.js`, and mirror it in Helmet:
  - Project pages: `Article` (`headline`, `image`, `datePublished` = `completedAt`, `author: {"@id": "https://www.vivekapatel.com/#person"}`, `about` = category) plus a `BreadcrumbList` (Home › Case studies › title).
  - Service pages: `Service` with `provider` → Person and `areaServed: Europe`.
  - Give Person and ProfessionalService stable `@id`s and `PostalAddress` (Linz, AT).
- **Effort:** M

### PX-13 · P2: Titles and descriptions under-target the CV niche; project titles truncate and hide the keywords
- **Evidence:**
  - Home `<title>` is "Vivek Patel - Expert AI & Computer Vision Engineer": no "Freelance", "YOLO" or "OCR".
  - The meta description leads with "web scraping, n8n automation" before YOLO/PyTorch (`seoConfig.js:8-10`).
  - Project titles are 70–90 chars with the suffix " | AI Case Study - Vivek Patel" (for example, "Reviewable Body-Pose Detection for Fitness Images | AI Case Study - Vivek Patel" is 79 chars), so they truncate at about 60 chars in the SERP.
  - The slug `yolo-computer-vision-optimization` has a title with no "YOLO".
  - `sports-video-analytics-yolo` has no image at all.
  - `<meta name="keywords">` is ignored by Google.
- **Impact:** Weaker ranking and click-through for "freelance computer vision engineer", "YOLO developer" and "OCR invoice extraction".
- **Fix:**
  - Home: "Freelance Computer Vision Engineer – YOLO, OCR & Edge AI | Vivek Patel" (≤ 60 chars), with a description that leads with CV outcomes.
  - Project titles: "{≤45-char title with the key tech} | Vivek Patel", and category-specific wording ("Computer Vision Case Study").
  - Drop meta keywords.
- **Effort:** S

### PX-14 · P3: OG images are not share-optimized
- **Evidence:**
  - 3 of 12 project `og:image` values are WebP (`ai-project-planning-assistant`, `invoice-ocr-extraction`, `yolo-…`).
  - Sizes are arbitrary (960×720, 1654×2339 portrait, 2984×874 panoramas) rather than 1200×630.
  - There is no `og:image:width`/`height`/`alt` or `twitter:image:alt`.
  - Only the default `og-image.png` is 1200×630.
- **Impact:** LinkedIn and some chat clients render WebP or extreme aspect ratios poorly or not at all. Shared case-study links, the main outreach channel, look broken or cropped.
- **Fix:** Generate a 1200×630 JPG/PNG card per case study at build time (title, category and hero crop), and add the dimension and alt tags.
- **Effort:** M

### PX-15 · P3: Mobile touch targets are too small
- **Evidence:**
  - Lighthouse `target-size` fails: footer "Privacy Policy" and "Manage consent" are 98×15 px (need ≥ 24 px, WCAG 2.2 SC 2.5.8).
  - Cookie "Save Preferences" is `h-9` (36 px).
- **Fix:** Add `py-2 inline-block min-h-[24px]` (44 px preferred) to the footer legal links, and `min-h-[44px]` to Save.
- **Effort:** S

### PX-16 · P3: ARIA and alt-text details
- **Evidence:**
  - The header logo has `aria-label="Vivek Patel Logo"` while its visible text is "VP" (`label-content-name-mismatch`, `Header.jsx:183,241`).
  - `<aside>` elements are nested inside other landmarks (`Testimonials.jsx:69`, `Contact.jsx:199`).
  - The hero portrait alt is "Tracked engineer portrait" (`Hero.jsx:358`): it has no name.
  - The decorative bbox, ghost and bracket layers *are* correctly `aria-hidden` (`Hero.jsx:86,309,338`).
  - The in-card "field · 0.99" confidence labels and the "REC"/"ID 001 · TRACKED" badges are *not* hidden, so screen readers announce "field · 0.99" noise.
- **Fix:**
  - Logo: `aria-label="VP – Vivek Patel, home"`.
  - Change the nested `<aside>` elements to `<div>`s.
  - Portrait alt: "Vivek Patel, computer vision engineer".
  - Add `aria-hidden="true"` to the decorative confidence and badge spans.
- **Effort:** S

### PX-17 · P3: Six byte-identical images are duplicated across slugs (2.2 MB)
- **Evidence:** `md5` of `dist/assets/case-studies/*` finds 6 duplicate pairs, for example `n8n-openai-data-extraction-b11f…png` and `n8n-python-ai-agents-b11f…png` (510 KB each). They are shared between `n8n-openai-data-extraction`, `n8n-python-ai-agents` and `ai-invoice-processing-automation`.
- **Impact:**
  - Browsers download and cache the same bytes twice.
  - More importantly, the same screenshot appears in different case studies, which a technical buyer will notice (credibility).
- **Fix:**
  - Key delivered assets by content hash only, not `slug-hash`.
  - Review whether each case study should reuse the screenshot at all.
- **Effort:** S

### PX-18 · P3: Cache rules mark non-hashed files immutable
- **Evidence:**
  - `public/.htaccess:48-51` applies `public, max-age=31536000, immutable` to every `/assets/*` path, including the unhashed `/assets/logos/mylogo.png` and `/assets/images/vivek-black-and-white.webp`.
  - HTML is `no-cache` (good).
  - Compression is not configured in `.htaccess`, but the live CDN serves `content-encoding: br` (verified with curl).
- **Fix:** Content-hash those two files (import them through Vite) or give them `max-age=86400`.
- **Effort:** S

### PX-19 · P3: Content stays hidden until in view
- **Evidence:**
  - Before scrolling, the Portfolio, Services, Testimonials and CTA wrappers all have computed `opacity: 0` (`SectionAnimator.jsx`, `initial {opacity:0, y:50}`; runtime `hiddenUntilInView`).
  - Reduced-motion users get them visible (verified).
- **Impact:**
  - Small. Googlebot renders with a tall viewport so the IntersectionObserver fires.
  - Screenshot and preview tools and short-viewport renderers capture blank sections.
  - Featured case studies, the strongest trust signal, fade in late on mobile.
- **Fix:** Start sections visible and apply the reveal only when JS adds a class (`html.js-reveal .reveal{opacity:0}`), or keep the first below-the-fold section visible.
- **Effort:** S

### PX-20 · P3: Cookie banner UX details
- **Evidence:**
  - A 60/72 px spacer is rendered immediately (`Layout.jsx:62-64`), but the banner only mounts after 1.5 s (`CookieConsentBanner.jsx:30`). This leaves an empty strip, and then the page jumps up by 60–72 px on accept or reject.
  - The jump is user-initiated, so CLS is 0, but it is still visible.
  - The banner is non-modal (`aria-modal="false"`) and does not take focus on first show. That is acceptable, but keyboard users meet it only after tabbing through the header.
  - Focus return when it is opened from the footer is implemented correctly.
- **Fix:**
  - Render the spacer only while the banner is visible (lift `isManaging` state), or overlay without a spacer.
  - Place the banner in the DOM before `<header>`, or add a "skip to cookie settings" link.
- **Effort:** S

### PX-21 · P3: Security header and CSP hygiene
- **Evidence:**
  - `public/.htaccess:40` CSP `script-src 'self' 'unsafe-inline' https://www.googletagmanager.com`. The build emits no inline executable scripts (JSON-LD is non-executable), so `'unsafe-inline'` is unnecessary.
  - There is no `worker-src`, so Sentry Replay's `blob:` compression worker is blocked by `default-src 'self'` and Replay falls back or fails silently.
  - HSTS, nosniff, Referrer-Policy, Permissions-Policy and `frame-ancestors` are all present on the live site (verified with curl).
  - No source maps in `dist/`.
  - Env scan of `dist/assets/*.js`: only `VITE_CONVEX_URL` values are present (in `ContactRoute-*.js`; public by design). `CONVEX_DEPLOYMENT` and `VITE_CONVEX_SITE_URL` values are not present. No `sk_`/`AKIA`/private-key patterns were found.
  - `<meta name="generator" content="Hostinger Horizons">` advertises the stack.
- **Fix:**
  - Drop `'unsafe-inline'` from `script-src`.
  - Add `worker-src 'self' blob:`.
  - Consider `script-src` hashes if the Horizons banner script is ever enabled.
  - Remove the generator meta.
- **Effort:** S

### PX-22 · P3: Telemetry consent gating is sound in code, but live production still loads third parties before consent
- **Evidence:**
  - GA is injected only when consent is given, `NODE_ENV === 'production'` and the host is not local (`GoogleAnalytics.jsx:49-81`). Sentry is dynamically imported only after consent (`sentryTelemetry.js:30`).
  - In this `dist`, `VITE_GA_TRACKING_ID` and `VITE_SENTRY_DSN` were absent at build time (`.env.local` defines only `CONVEX_DEPLOYMENT`, `VITE_CONVEX_URL`, `VITE_CONVEX_SITE_URL`). Both SDKs were therefore tree-shaken, and runtime gating could not be exercised locally.
  - If production builds also lack the DSN, consenting users get `console.warn("Sentry DSN not configured…")`.
  - Live https://www.vivekapatel.com/ (older build `index-DGrbefch.js`) requested `fonts.googleapis.com`, `fonts.gstatic.com` (DM Sans) and the Hostinger hero JPG before any consent. `develop` no longer loads Google Fonts: it uses the system stack and `document.fonts` is empty.
- **Impact:** Loading Google Fonts before consent from an Austrian site is a known GDPR exposure (LG München I, 2022). Promoting `develop` removes it; PX-05 removes the remaining third-party request.
- **Fix:**
  - Release `develop` together with PX-05.
  - Add a CI check that the production build contains `googletagmanager` only behind the consent path and that `VITE_SENTRY_DSN` is set, or remove the warn.
- **Effort:** S

### PX-23 · P3: SEO and crawl hygiene
- **Evidence:**
  - The hero CTA "Request a Project Estimate" is a `<button onClick={navigate('/contact/')}>` (`Hero.jsx:12-14,419`). It is not a crawlable link and cannot be opened in a new tab.
  - `/case-studies/` cards link to `?from=collection` variants (10 URLs, `CaseStudyCard.js:52`), creating duplicate crawl paths. Canonical mitigates this.
  - The 404 page has `canonical https://www.vivekapatel.com/404/`, which is itself a 404.
  - Every sitemap `<lastmod>` is the same build date and `<priority>` is ignored by Google.
  - `Hero.jsx:445` uses `<style jsx>`, but styled-jsx is not installed, so a `<style jsx="true">` is injected into the body on every render.
- **Fix:**
  - Make the CTA `<Button asChild><Link to="/contact/">`.
  - Pass the collection state only via router `state` (no query string).
  - Omit the canonical on 404.
  - Use the per-case-study `completedAt`/`updatedAt` as `lastmod`.
  - Move the keyframes to `index.css`.
- **Effort:** S

## What is already good
- `prefers-reduced-motion` is honoured by every animation (0 running animations under reduce), and the custom cursor is disabled on coarse pointers and under reduced motion.
- A skip link exists, keyboard focus is visible on every tab stop tested (14), and the gallery modal handles Escape and inert.
- The contact form has proper `<label htmlFor>`, `aria-invalid`, `aria-describedby` and `role="alert"` errors, and Convex is split into the Contact chunk.
- TBT is 0 ms and CLS is 0 on every page. There are no console errors and no failed requests.
- There are no web fonts (system stack), so there is no FOIT/FOUT and no font preconnects are needed.
- Canonical, OG and Twitter tags are generated per route for home, contact, legal, case-studies and every project. The sitemap and robots.txt are valid.
