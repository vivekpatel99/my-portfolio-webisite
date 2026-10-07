# Evidence label clearance, issue #327

Inspected `develop` at `8a80ffb834ed9f28edf7eb497f8caa12bc8c4da7` on 7 October 2026. The task started from a clean, isolated worktree. [Issue #327](https://github.com/vivekpatel99/my-portfolio-webisite/issues/327) authorizes this standalone-cover spacing repair. [Issue #294](https://github.com/vivekpatel99/my-portfolio-webisite/issues/294) is related context only.

The shared label has a 16px line box centered on the frame's top edge. Standalone media began at that same edge, putting the lower 8px of the label over bright image pixels. A 12px inset on `.case-study-cover-stage` leaves 4px between the label's line box and the media. No badge, image crop, media-source change, or shared-frame change is required.

SH-02 confirms transparent `PROJECT EVIDENCE` labels and opposing corners. SH-03 confirms the shared frame geometry and transparent edge attachment. Its space reservation clause is a proposed default; its visibility and media-cropping clauses are existing references. This repair implements the ticket's scoped inset without promoting those clauses to sitewide confirmed decisions.

## Rendered evidence

Each PNG is a full viewport capture of the real locally built depth route, with its original-image link focused. Actual CSS viewport dimensions match the filename. Before captures use the inspected baseline. After captures use the 12px inset. Current installed Playwright Chromium and WebKit were tested on macOS. These are resized desktop engine checks, not historical-engine or physical-device evidence.

| Actual viewport | Chromium before | Chromium after | WebKit before | WebKit after |
| --- | --- | --- | --- | --- |
| 1440×900 | [Before](assets/evidence-labels-327/before-chromium-depth-1440x900.png) | [After](assets/evidence-labels-327/after-chromium-depth-1440x900.png) | [Before](assets/evidence-labels-327/before-webkit-depth-1440x900.png) | [After](assets/evidence-labels-327/after-webkit-depth-1440x900.png) |
| 980×1324 | [Before](assets/evidence-labels-327/before-chromium-depth-980x1324.png) | [After](assets/evidence-labels-327/after-chromium-depth-980x1324.png) | [Before](assets/evidence-labels-327/before-webkit-depth-980x1324.png) | [After](assets/evidence-labels-327/after-webkit-depth-980x1324.png) |
| 390×844 | [Before](assets/evidence-labels-327/before-chromium-depth-390x844.png) | [After](assets/evidence-labels-327/after-chromium-depth-390x844.png) | [Before](assets/evidence-labels-327/before-webkit-depth-390x844.png) | [After](assets/evidence-labels-327/after-webkit-depth-390x844.png) |
| 320×740 | [Before](assets/evidence-labels-327/before-chromium-depth-320x740.png) | [After](assets/evidence-labels-327/after-chromium-depth-320x740.png) | [Before](assets/evidence-labels-327/before-webkit-depth-320x740.png) | [After](assets/evidence-labels-327/after-webkit-depth-320x740.png) |

![Depth cover with the entire label clear of its bright image at 320×740](assets/evidence-labels-327/after-chromium-depth-320x740.png)

Codex in-app Browser also reproduced the bright-image overlap on the production build and showed the readable label after the inset. Its development preview initially appeared blank without reported console errors; the built route rendered normally. Acceptance captures and automation use the production build on loopback port 5408.

## Verification

`tests/qa/qa-evidence-labels.spec.js` tests all three current standalone image covers and the invoice multi-image gallery at each viewport in both engines. Local-only network guards block external transport. The suite is registered for Chromium preview projects and both existing local-only WebKit preview projects; safe artifact mode suppresses screenshots, and the sanitizer recognizes the suite.

- Baseline browser regression run had 24 standalone clearance failures and 8 gallery passes. The decisive assertion was `the whole edge label clears the media`; at Chromium 1440×900 the label bottom was 482.03125px and media top was 474.03125px.
- After the inset, all 32 browser cases passed. Standalone cases check transparent labels, image aspect ratio, original source link, alt, caption, real display and original decoding, keyboard focus and Enter activation, and document overflow. Gallery checks cover arrow selection, enlargement, Escape, focus return, label/control clearance, and original decoding.
- Baseline unit suite passed all 850 tests in 68 files. Targeted gallery checks passed all 30 tests. Production builds passed before and after the CSS change.
- The Impeccable detector reported the pre-existing blockquote side border. That unchanged style is outside #327.
- No lint or typecheck script or project configuration is supplied in `package.json`; no such passing result is claimed. JavaScript syntax, unit tests and production compilation cover the changed source.

The full unit suite passed all 850 tests in 68 files. The 46 QA configuration and sanitizer tests passed independently. The same 32 browser cases passed with `QA_ARTIFACT_SAFE_MODE=1`, which suppresses raw captures. After Kiro review, the native configuration's four desktop/mobile Chromium/WebKit preview projects passed all 64 cases in safe artifact mode, including an explicit lightbox-close-button clearance assertion. Targeted gallery, configuration and sanitizer checks passed all 76 tests. `git diff --check` and changed JavaScript syntax checks passed. Existing test output includes intentional React error-boundary diagnostics and jsdom navigation notices. Builds report stale Browserslist data; no dependency refresh was added to this ticket.

The original 32-case before/after runs used an external task-local config with two explicit engine projects, not the repository's desktop/mobile project names. It set `testDir` to this repository's `tests/qa`, `testMatch` to `qa-evidence-labels.spec.js`, `workers` to 2, `baseURL` to `http://127.0.0.1:5408`, `serviceWorkers` to `block`, and projects named `chromium` and `webkit` with their corresponding `browserName`. Output and list-reporter logs stayed in the external task directory. The final 64-case run imported the repository config with `QA_LOCAL_ONLY=1 QA_ARTIFACT_SAFE_MODE=1 QA_PREVIEW_URL=http://127.0.0.1:5408`, filtered each project's existing `testMatch` to this suite, and overrode only workers, output directory and reporter. Production builds were served on that loopback port.

Independent Standards and Spec reviews found no actionable findings. The Spec reviewer inspected all four depth captures. The scoped comments review found no added comments or suppressions and requested no deletions.

## Kiro review and dispositions

[Actual Kiro output](kiro-review-327.txt) records the read-only review of candidate `1355fff9eb272bcc22ec27206aa94dc430ca692d`. The configured `portfolio_frontend_review` profile requests `claude-opus-5.5`; the invocation requests high effort and engine v2 with only read, grep and glob trusted. Kiro returned successfully but supplied no runtime model attestation. It found no source-confirmed production defects.

- Accepted its native WebKit coverage finding. The original two-engine runs were real but used the external config. The final suite is now registered in both native WebKit preview projects, with a passing 64-case run.
- Removed the stale carousel-only comment, used the existing test constant convention, and replaced the report's future Kiro statement with this actual review reference.
- Verified all 16 PNGs are in the reviewed candidate using `git ls-tree`. The review diff intentionally omitted binary payloads; that omission did not mean the captures were uncommitted.
- Verified depth and healthcare captions are nonempty and exercised by the regression suite. The planning cover has no caption. The 980×1324 capture shows the complete depth cover, both opposing corners and its caption. Non-depth covers also passed the image/label bounds and overflow checks in both engines.
- Added the explicit close-button clearance assertion. Kiro's clipping observation was a verification caution, not a reproduced defect; unchanged source has no label-clipping container, and the independent Spec review confirmed the rendered captures.
- The user's explicit separate-chat/worktree authorization supersedes the ticket's earlier current-checkout default. All changes stayed in the assigned worktree. The all-side inset matches the existing gallery's 12px inset and preserves uncropped evidence.

No production deployment or live inquiry, email, lead or telemetry write was performed.
