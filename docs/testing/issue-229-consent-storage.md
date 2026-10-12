# Issue 229 consent storage verification

Date: 2026-09-30. Issue: [#229](https://github.com/vivekpatel99/my-portfolio-webisite/issues/229).
Base: `develop` at `8fe91fb930275289bfe1f8f1f1ec3d0083e226f4`.

## Failure and correction

Codex reproduced the reported failure in the local production build through the
T3 collaborative preview. A synthetic `Storage.prototype.setItem` throwing
`SecurityError` made Reject emit `Uncaught SecurityError: Synthetic denied write`.
The banner remained visible and no preferences were stored.

Before the fix, the new unit suite had eight failures and three passes. All ten
new action/error browser cases failed because the banner stayed visible.

`saveCookieConsentPreferences` now catches persistence failures at the shared
boundary. A normalized, unpersisted choice takes precedence for this document.
Analytics requires the literal value `true`. Returning copies protects that
choice from caller mutation. A successful save clears the fallback so normal
storage reads, including other-tab updates, continue to work.

No banner markup, styling, motion configuration, or Layout logic changed.
Issue [#228](https://github.com/vivekpatel99/my-portfolio-webisite/issues/228)
continues to own the separate hidden consent spacer.

## Initial verification

- Codex independently inspected the production diff and consent callers.
- `npm test` passed all 570 tests in 55 files.
- `npm run build` passed, including sitemap and static route generation.
- Production-preview edge QA passed 50 cases on desktop/mobile. The existing GA
  loading test and fake-transport-only tests skip in ordinary preview mode.
- Eight existing responsive consent checks passed, including the short-phone
  expanded manager, the unobstructed hero CTA, and reduced motion.
- Eight new keyboard cases passed at 390px and 1440px, under normal/reduced
  motion. They cover manager focus, Tab order, Enter, Space, Save, dismissal,
  restored footer focus, and the retained choice after reopening.
- Four fake-Sentry browser cases passed on desktop/mobile. Synthetic allowed
  markers reached the intercepted `telemetry.invalid` transport. Reject and
  Close suppressed later markers. A failed Reject overrode stale stored
  acceptance; first Accept with blocked writes explicitly enabled telemetry.
  No contact mutations or page errors occurred.
- `npm run qa:telemetry-boundary` passed all three desktop cases. Its existing
  CI invocation now includes the two new storage-failure tests so they do not
  always skip. This runner uses port 4174 and a Vite source server with
  `NODE_ENV=production`; CI covers desktop, while the separate port 43229 run
  verified both desktop and mobile.
- `git diff --check` passed.

The action matrix covers Reject, Close, Save with analytics off/on, and Accept
under both `SecurityError` and `QuotaExceededError`. It checks dismissal,
unwritten storage, SPA navigation, manager reopening, retained preferences, and
page errors. Unit checks also cover a throwing storage getter, stale acceptance
and rejection, the latest failed choice, strict normalization, and successful
save recovery.

Codex's T3 recheck observed no errors after Reject, keyboard Save, or keyboard
Accept. Reopening reflected the current session choice. Focus returned to
Manage Consent after Save. Before/after banner geometry matched at 1280x800
and 390x844: top 72px, heights 77px and 69px respectively, 44px-high primary
controls, and no horizontal document overflow. Codex inspected rendered desktop
and mobile screenshots.

All browser runs were local. The production preview used exclusive port 4229.
The fake transport used port 43229 with a synthetic DSN and the existing
local-only request/WebSocket guards. An initial Kiro attempt to start port 4230
failed because another process owned it; results from that target were discarded.
That unrelated process was preserved.

## Review provenance

Kiro performed implementation and follow-up corrections using
`claude-opus-5.5`, followed by separate fresh read-only requirements and code
quality reviews. Classic-session metadata confirms the selected model. The
initial V2 invocation warned that changing the model through its CLI flag was
unsupported; finalization and reviews used the classic engine with explicit
model selection. Backend served-model identity is not independently exposed.
Kiro review is source evidence; Codex owns the rendered/runtime observations.
The fresh final review found no blockers, passed the requirements, and judged
code quality sound. Codex resolved its report-clarity note. A small test setup
duplication remains as a nonblocking nit.

## Limits

- A failed write does not survive a document reload. Existing persisted values
  may remain unchanged; this correction guarantees the current document session.
- While an unpersisted local choice exists, it takes precedence over other-tab
  storage updates until a successful save in this document.
- Ordinary loopback GA network silence is not a positive analytics test because
  GA is disabled on loopback. The synthetic Sentry transport supplies the
  positive control; production GA was not exercised.
- A separate existing Sentry defect prevents telemetry from restarting after
  Accept, Reject, then Accept in one document. Codex reproduced the same failure
  with working storage and observed `Multiple Sentry Session Replay instances
  are not supported`. This PR leaves that lifecycle unchanged.
- Chromium was verified locally. Physical devices, deployed hosting, and
  production telemetry were not tested.

At initial delivery, issue 229 remained open pending PR acceptance, required CI,
and merge. Merge authorization was supplied in a later follow-up; deployment
remains a separate decision.

## PR review follow-up

Develop advanced to `1aa8bf8077051aebcb4ed9f8c67cfe87b05af0c7` during
babysitting. Its testimonial heading and case-study navigation changes were
integrated without changing the consent implementation.

A review identified undefined ordering between the file-level consent cleanup
initializer and the stale-acceptance seed. Codex reproduced both orders: cleanup
then seed preserved acceptance; seed then cleanup erased it. Opus removed the
redundant cleanup because each test has a fresh browser context without saved
storage state. This also prevents cleanup from erasing the corrupt-consent seed.
All existing assertions remain.

After the repair, 582 unit tests in 56 files and the production build passed.
The stale-consent, corrupt-consent, and fake-Sentry tests passed five repetitions
on desktop and mobile: 40 cases, with no skips. A fresh Opus requirements and
code-quality review and an independent Codex review found no blockers. The
documented limits above remain unchanged. Current-head CI and unresolved review
threads must still be checked immediately before merging.

A second review found that the default passive command also registers these
unreleased regressions against production. Opus added `QA_LOCAL_ONLY=1` guards
to every new storage-failure case, preserving existing production checks. Codex
verified all 17 callbacks skip before mutating the page when the flag is absent.
Both production projects, safely pointed at loopback for this check, skipped all
34 corresponding cases with the flag disabled. With local-only mode enabled,
44 focused preview cases passed and the telemetry-boundary command passed all
three positive synthetic transport cases. The integrated checkout at develop
`e45c0a13b062e45656a89f30396c33dcbb07223a` also passed 610 unit tests and the
production build. The earlier 40 repeated cases remain evidence for the
initializer-order repair; the target guards preserve their assertions.
