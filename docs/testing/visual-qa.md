# Visual QA

`tests/qa/qa-visual.spec.js` checks user-visible geometry through Playwright
bounding boxes. It uses reduced motion and fixed viewports for deterministic
results and does not use blanket screenshot snapshots.

The passive checks cover:

- the home request estimate CTA and its case-study link being visible,
  minimum-sized, inside the desktop viewport, and separate;
- the mobile cookie dialog and all four controls being visible, contained by
  the dialog, and separate from the hero CTA;
- the case-study gallery stage, selected image, thumbnail strip, and selected
  thumbnail retaining usable dimensions and containment on a phone viewport;
- the contact form being horizontally contained, with every field and the
  submit control visible and contained by the form.

`tests/qa/visual-layout.js` is the shared plain-box assertion seam. The visual
spec includes a controlled DOM fixture test showing that the same helper
rejects a hidden box, a clipped box, and an overlapping box while accepting the
normal state. This keeps the regression signal independent of PNG size or
baseline files. The spec does not request screenshots or traces; use
`QA_ARTIFACT_SAFE_MODE=1` to disable configured screenshot, trace, and video
capture. Runner-created local diagnostics are never uploaded; CI retains only
the reconstructed JSON described in [artifact retention](../qa-artifact-retention.md).

Run the focused passive checks against a loopback preview with:

```sh
QA_LOCAL_ONLY=1 QA_ARTIFACT_SAFE_MODE=1 QA_PREVIEW_URL=http://127.0.0.1:4191 \
  npx playwright test -c tests/qa/qa.config.js tests/qa/qa-visual.spec.js \
  --project=preview-desktop --project=preview-mobile
```
