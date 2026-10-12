# Kiro source review for issue 329

Captured on 7 October 2026. Requested `claude-opus-5.5` using the tracked
`portfolio_frontend_review` profile, with `--effort high`, read/grep/glob tools,
and `includeMcpJson: false`. CLI exit status was 0. Stream metadata confirmed
high effort but did not attest a model identifier. No model identity is claimed.

Reviewed baseline `8a80ffb834ed9f28edf7eb497f8caa12bc8c4da7` and unreferenced
candidate commit object `a0e4a78ceed66945e1d59f458e5c746b63577200`, using its
exact frozen diff. The final delivery subsequently strengthens tests as
recorded in [the verification report](2026-10-07-issue-329-consent-opener.md).
Kiro did not execute runtime checks. The response below is preserved verbatim;
its old line references and hypotheses refer to that frozen candidate.

---

# Issue #329 candidate review

I read the source only. I ran nothing and didn't check the browser at runtime. I found one acceptance gap in the CI tests, one minor test-strength gap and one nit. I found no problems with the product code.

## Findings

**1. The WebKit focus fix has no CI test to catch a regression (MEDIUM)**
- **Evidence:** You report that the native-button-only version failed WebKit mouse focus return. The fix is `event.currentTarget.focus({ preventScroll: true })` at `src/pages/DataPolicy.jsx:11`. The tests that cover it are in `tests/qa/qa-consent.spec.js:103-140`.
  - Those tests don't run in CI WebKit. `tests/qa/qa.config.js:92-102` limits `preview-webkit-desktop` and `preview-webkit-mobile` to `qa-focus.spec.js`, `qa-cursor.spec.js` and `qa-route-recovery.spec.js`.
  - In CI, `npm run qa:playwright:ci` runs the new spec only in the Chromium projects.
  - In jsdom, `user.click` already focuses buttons, so `src/pages/DataPolicy.test.jsx:64-65` would still pass without line 11.
  - As a result, deleting line 11 would pass every CI check.
- **Fix:** Move the mouse→close opener case into `qa-focus.spec.js`. You could instead add a small dedicated spec to the WebKit `testMatch`.
- **Acceptance:** `qa:playwright:ci` with `QA_LOCAL_ONLY=1` runs the mouse→close opener case in both WebKit projects at 390 and 1440px. Removing line 11 makes it fail, and restoring the line makes it pass.

**2. The consent-value checks can't spot a reset to defaults (LOW)**
- **Evidence:** Both suites start with `{ necessary: true, analytics: false }` (`DataPolicy.test.jsx:21`, `qa-consent.spec.js:104`). Reject, close and an untouched Save Preferences all write that same value.
  - The unchanged-storage checks (`DataPolicy.test.jsx:74,88`; spec lines 113 and 139) therefore pass even if the manager ignored the saved preferences.
  - The Options check (`DataPolicy.test.jsx:78`) has the same blind spot. I haven't confirmed that `DEFAULT_COOKIE_CONSENT_PREFERENCES` has `analytics: false`, so treat this part as unverified.
- **Fix:** In the jsdom test only, add one case that starts with `analytics: true`. GA and Sentry are already mocked there. Check that the Analytics checkbox opens checked and that Save Preferences keeps `analytics: true`.
- **Acceptance:** A version where opening the manager falls back to defaults fails that case.

**3. `exact` probably does nothing in the RTL test (NIT)**
- **Evidence:** `DataPolicy.test.jsx:82`. As far as I know, Testing Library's `getByRole` doesn't accept `exact`, so it's probably ignored. String names already match exactly. The same option is valid in the Playwright spec.
- **Fix:** Remove it from the RTL test.

## Checked, no finding

- **Button semantics:** The opener is a native `type="button"`. `Slot` is no longer used (`button.jsx:35-36`). The test's `<form>` wrapper (`DataPolicy.test.jsx:44`) checks that nothing submits. The Playwright spec checks the URL doesn't change.
- **Focus return:** Focusing the button before dispatching the event (lines 11-12) means the banner records the opener as `previousFocusRef` (`CookieConsentBanner.jsx:74`). Its cleanup then returns focus there (line 81). The Reject, Save and close handlers all go through `setIsManaging(false)` and `onHide`.
- **Appearance:** The utility classes are the same as before (`DataPolicy.jsx:52`). Your observation of identical 306.367×48 dimensions matches this.
- **Event wiring:** The `manage-cookies` event and Layout's listener (`Layout.jsx:77,84`) are unchanged, so consent values and vendor setup aren't touched. The footer opener and the policy copy at line 47 are unchanged, and the copy is still accurate. No other code depends on the old link.
- **Scope:** No Convex files changed. The page's identity, content and the other approved design elements aren't affected.
- **React performance:** Nothing applicable from vercel-react-best-practices.

## Runtime hypotheses (unverified)

- **H1:** If the user activates the opener again while the manager is already open, the state doesn't change and the focus effect doesn't re-run. Focus would stay on the opener rather than move to the dialog. The footer opener already behaves the same way.
- **H2:** After a mouse dismissal, focus returns to the opener in code. Whether WebKit shows the `focus-visible:ring-2` focus ring then may differ from Chromium. This is cosmetic, but it should be checked against BT-01's visible-focus rule.
- **H3:** You only described the toast shown after Save Preferences, and the jsdom test mocks it out. It could take focus from the opener when it appears. Your WebKit and Chromium passes suggest it doesn't.

## Skills and references loaded

- **impeccable:** only the first 120 lines of `SKILL.md`. I didn't run the `impeccable context` launcher, because shell commands weren't allowed, and I didn't load `reference/audit.md` or `critique.md`. So this is not a full impeccable audit or critique.
- **web-design-guidelines:** `SKILL.md` only. I couldn't fetch its remote guideline rules, since I had no web tool, so this isn't a full guideline check.
- **vercel-react-best-practices:** the first 60 lines of `SKILL.md`.
- **References:**
  - `DESIGN.md`: the BT-01 section
  - The candidate diff
  - `DataPolicy.jsx`, `button.jsx`, `CookieConsentBanner.jsx`, `Footer.jsx`
  - `Layout.jsx`: lines 60-109
  - `qa-consent.spec.js`: lines 1-110
  - `qa.config.js`: lines 1-129

**Model:** The session context names claude-opus-5.5, but nothing from the runtime confirms which model I am.
