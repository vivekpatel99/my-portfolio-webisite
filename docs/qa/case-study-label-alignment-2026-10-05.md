# Case-study label alignment

Vivek's 5 October 2026 review decision lowers the case-study category labels so their line boxes are centered on the top-edge guide established by the corner strokes. Label backgrounds remain transparent. This supersedes the former 3px gap in SH-03.

The shared card-specific offset was removed. Homepage and collection cards now inherit the shared label anchor. Wording, typography, corner strokes, media cropping, card links, and grid spacing are unchanged.

## Verification

- Full unit suite passed before and after the change: 68 files, 850 tests.
- Display-image validation and the production Vite build passed. The build used a separate temporary output and preview port 3105 to preserve the ongoing review on port 3000.
- Six Chromium browser checks passed across homepage and collection at 320px, 768px, and 1280px. They cover top-edge centering, transparent backgrounds, unchanged media position, viewport containment, neighboring-card clearance, and wrapped mobile labels after loading more collection cards.
- Separate standards and specification reviews found no actionable issues.

Desktop and mobile captures below show the centered labels. Transparent text now crosses the image edge as requested. On the homepage's light invoice thumbnail, the lower half of the Document AI label crosses invoice detail and has less contrast than on dark thumbnails. The existing typography and image crop are preserved; visual acceptance of that tradeoff remains with the owner. These captures establish Chromium rendering only, not production deployment or a completed accessibility audit.

## Visual evidence

Homepage, 1280px:

![Homepage card labels](case-study-label-alignment-2026-10-05/homepage-desktop.png)

Collection, 1280px:

![Collection card labels](case-study-label-alignment-2026-10-05/collection-desktop.png)

Collection, 320px:

![Mobile collection card label](case-study-label-alignment-2026-10-05/collection-mobile.png)
