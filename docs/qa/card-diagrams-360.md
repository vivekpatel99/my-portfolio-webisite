# Readable card overview diagrams — issue #360

## Later owner decision

On 16 October 2026, Vivek requested the earlier detection-field shadow effect.
The card scrim, top gradient, and overlaid title/arrow placement are restored
from before #375. The summary-first copy and compact illustration notes from
#383 remain. SH-03 records the changed decision. The before/after captures and
verification below describe the historical #360 implementation, not the current
selected appearance. Current browser assertions cover the selected shadow
treatment while retaining image fitting, copy, destinations, responsive bounds,
and JavaScript-disabled collection navigation checks.

The restoration was checked against the saved pre-#375 desktop screenshots and
fresh localhost home/collection renders at 1440px and 320px. The two media
styles were restored directly from the pre-#375 diff. Targeted card and
collection unit tests passed all 17 cases. The production build passed, and
12 Chromium card checks passed at 1440, 980, 390, and 320px, including the
JavaScript-disabled collection. No production deployment was performed.

## Scope and implementation

The home and collection cards previously darkened their overview diagrams with
a 32px top overlay and a full-stage scrim. Both are removed. The title and arrow
now share a normal-flow row below the complete image; 24px above the media keeps
the transparent category label clear, including its two-line narrow layout.

This implements the confirmed IM-01 readability direction and SH-03 card
geometry. Image assets, `object-contain`/top alignment, the 300px media stage,
opposing corners, captions, destinations, accessible names, and focus outlines
remain in place. Old cover-replacement issues #122–124 are outside this change.

## Evidence

Before: production build of `develop` commit
`24804ad0af0fc2ea9d25d36bb3795f0b1c91f428`. After: production build of the final
card implementation. The PR records its delivered commit. Runtime source hashes:

```text
615ad2ea10575bf5e2f88970de0170b0dda593abe3c4012de26cc47fde55da97  src/components/CaseStudyCard.js
df0149f526469d5b6b50d3a12dc87138b0a6a010c0aeb588532f264a161b562e  src/components/DetectionFrame.css
```

Chromium 148.0.7778.96, reduced motion, local production preview. Captures show
the three home cards and the initial six collection cards; measurements inspect
all twelve collection cards after Load more. Only loopback requests were allowed.

| Viewport | Home before / after | Collection before / after |
| --- | --- | --- |
| 1440 × 900 | [Before](assets/card-diagrams-360/before-home-1440.png) / [After](assets/card-diagrams-360/after-home-1440.png) | [Before](assets/card-diagrams-360/before-collection-1440.png) / [After](assets/card-diagrams-360/after-collection-1440.png) |
| 980 × 1324 | [Before](assets/card-diagrams-360/before-home-980.png) / [After](assets/card-diagrams-360/after-home-980.png) | [Before](assets/card-diagrams-360/before-collection-980.png) / [After](assets/card-diagrams-360/after-collection-980.png) |
| 390 × 844 | [Before](assets/card-diagrams-360/before-home-390.png) / [After](assets/card-diagrams-360/after-home-390.png) | [Before](assets/card-diagrams-360/before-collection-390.png) / [After](assets/card-diagrams-360/after-collection-390.png) |
| 320 × 740 | [Before](assets/card-diagrams-360/before-home-320.png) / [After](assets/card-diagrams-360/after-home-320.png) | [Before](assets/card-diagrams-360/before-collection-320.png) / [After](assets/card-diagrams-360/after-collection-320.png) |

[Before measurements](assets/card-diagrams-360/before-measurements.json) and
[after measurements](assets/card-diagrams-360/after-measurements.json) record
every card. All 60 after observations decode complete images with `contain`
fitting and no scrim or media pseudo-element. Category-to-media clearance is at
least 16px at 1440, 980, and 390px and 8px at 320px. Title-to-media clearance is
at least 16px at every width. Desktop and 320px layouts were also inspected in
the T3 browser.

## Verification

- The new diagram test fails against the baseline scrim and top overlay.
- Focused card, collection, and home unit tests: 37 passed.
- Artifact sanitizer unit tests, including registration of this suite: 38 passed.
- Full Node 24 unit run: 999 passed; two publication fixture subprocesses failed
  under concurrent host load. Isolated rerun of the publication suite: all 19
  passed, including both affected tests. All 1,001 unit cases were therefore
  exercised successfully across the full run and the targeted rerun; final CI
  must still pass its complete run with the normal limits.
- Production build: passed; 43 display derivatives checked, 39 public links
  validated, and 21 static routes generated.
- The new browser suite checks every public home and loaded collection card at
  the four viewports, plus the six prerendered collection cards without JavaScript.
  Final suite: 12 Chromium checks and 12 WebKit checks passed. The geometry
  harness uses instant DOM scrolling, matching the collection-return helpers,
  to avoid a Linux WebKit animation-frame stability wait. Collection expansion
  uses the actual Load more control through focus and Enter.
- Existing collection checks exercise pointer and keyboard navigation, Load more
  focus, loaded-count restoration, article return position, browser Back, and
  both motion preferences. Existing label alignment and contrast checks also run.
- JavaScript-disabled Chromium collection checks: 8 passed across desktop/mobile
  projects. A corrected selector targets the prerendered `#root` section rather
  than the JavaScript application's `main` wrapper.
- ESLint recommended checks, syntax checks, `git diff --check`, and the layout
  detector run on the changed source. The layout detector reports no findings.
- Independent standards and issue-spec reviews found no code findings; the
  sanitizer and static-selector follow-up review also found no findings.

The host runs Node 22 and lacks `ffprobe` and WebKit system libraries. Its full
unit run was replaced with the repository's Node 24 Playwright container plus
`ffmpeg`, with local test/hook timeouts of 30 seconds to accommodate host load;
CI limits remain unchanged. Browser runs on the host also encountered transient request resets and
timeouts; affected checks were rerun. Final PR CI is required on the delivered
head before merge and supplies the production-like full-suite and WebKit gate.
The pre-existing Browserslist age notice and jsdom unsupported-browser-operation
messages were observed. This scoped verification does not establish native
browser zoom or production deployment.
