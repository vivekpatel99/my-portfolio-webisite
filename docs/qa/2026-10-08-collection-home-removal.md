# Collection home-button removal

On 8 October 2026, Vivek confirmed removal of the compact Back to home button above the heading on `/case-studies/`. BT-01 records this decision and supersedes the older collection-button clauses. Individual article navigation and the other button decisions remain unchanged.

The change removes the collection anchor, its HOME edge label, leading ArrowLeft, and `mb-8` spacing from `src/components/CaseStudiesContent.js`, plus the unused Link and ArrowLeft imports. Both the client page and `tools/generate-static-route-html.js` render this component.

Verification used a production build in a temporary source copy on port 3001, from `codex/remove-collection-home-button` based on `751464d678d26335d3b9b423f39a41a227a41786`. The existing port-3000 preview remained running, and SHA-256 comparison confirmed that all 118 files in its original `dist` remained unchanged.

## Checks

- `npm run build` passed, including display-image validation, sitemap generation, 21 static routes, and 36 public-link checks.
- `npx vitest run src/pages/CaseStudies.test.jsx src/lib/caseStudyBrowsing.test.js` passed all 13 tests.
- Chromium and WebKit passed at 1440 × 900 and 320 × 740, each with JavaScript enabled and disabled. The collection has one h1, six initial cards, no Back to home anchor or HOME label, and no horizontal overflow. The heading begins 96px below the section edge, using the existing section padding without a leftover button gap.
- With JavaScript, keyboard Load more reveals all twelve cards and retains focus on the exhausted control. Explicit article returns and browser Back restore all twelve cards and the departed card's viewport position. Both article navigation links remain visible. Shared header and footer remain present.
- Without JavaScript, Load more remains natively disabled and More case studies contains six remaining story links. The static collection never included the shared header/footer shell; this change preserves that existing rendering behavior. Direct static article navigation was checked in both engines, and all twelve generated article files retain Back to home and View case studies links.
- No page errors occurred in the eight collection browser combinations. External requests were blocked during collection verification. These checks cover the scoped removal, not a full theme audit or native browser zoom.

The numeric viewport and spacing results are in [results.json](assets/collection-home-removal/results.json).

## Visual evidence

Screenshots show the initial collection with the button removed. The 320px heading and description wrap within the existing container.

| View | Evidence |
| --- | --- |
| Chromium desktop, JavaScript | [1440 × 900](assets/collection-home-removal/chromium-1440-js.png) |
| Chromium narrow, JavaScript | [320 × 740](assets/collection-home-removal/chromium-320-js.png) |
| WebKit desktop, no JavaScript | [1440 × 900](assets/collection-home-removal/webkit-1440-no-js.png) |
| WebKit narrow, no JavaScript | [320 × 740](assets/collection-home-removal/webkit-320-no-js.png) |
