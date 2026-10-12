# Kiro review receipt and disposition

Reviewed issue #330 and PR #337 candidate `8e552f175bcf31dc9a2844580fc794e15fd78caa` against `8a80ffb834ed9f28edf7eb497f8caa12bc8c4da7`.

The tracked read-only profile requests `claude-opus-5.5`; stream metadata confirms high effort and engine v2 but does not attest a concrete served model. The process exited 0 with a nonempty final response. Its scope was the public candidate textual diff, committed synthetic evidence, and supplied public source excerpts. No tool calls or browser runs occurred. This is a source and recorded-evidence review.

## Coordinator disposition

- Accepted the low-priority ambiguity. Verified `os.release() === "27.0.0"` and `sw_vers` reports macOS 27.0.1, build 26A434. Renamed `osRelease` to `darwinRelease` in all three records without changing observations.
- The first unverified hypothesis is contradicted by `initialFocus: true` in both injected-key records. Final email focus does not establish initial email focus. The QA report now records both observations.
- The second hypothesis identifies a real measurement limit. The existing POST listener measures HTTP mutation requests only. `Contact.jsx` uses `useMutation` with `ConvexReactClient`; external HTTP and WebSockets are guarded. The independent submit-event counter detects unintended submission. Clarified the report; retained the portable no-submit assertions.
- Native-input WebKit, Safari, and iOS remain explicitly unverified. The portable Chromium and WebKit matrix passes all supported project combinations.

The following response is preserved verbatim. Its statement about unattested effort reflects the reviewer text; the coordinator independently inspected runtime metadata confirming high effort.

## Actual final response

# Review of PR #337 / issue #330: no blocking findings

**Model and effort:** The request named `portfolio_frontend_review` with `claude-opus-5.5` at high effort. Neither is attested.

**Sources used:** I read no skill files, because this request did not allow tool calls. I did not load `impeccable`, `web-design-guidelines` or `vercel-react-best-practices`. I used only the material in your prompt, plus `AGENTS.md` and `docs/design-system.md`, which were already in context. This is a review of the source and recorded evidence only, not a full critique. I ran no browser checks.

## Verdict

None of the acceptance clauses is blocked by the diff. One finding needs a fix: an OS version mismatch in the evidence record.

## Acceptance clauses

- **Committed value without a native menu choice:** `selectOption('< €5k')` sets the value. The test then checks the exact value, `data-filled="true"` (React state), and that focus stays on the select. These checks replace the weaker `not.toHaveValue('')` and are stricter.
- **Keyboard focus order:** Real Tab presses move focus from email to budget, to description, then to the submit button. The value is checked again after each move.
- **Geometry and theme:** Position (x), width and height must stay within 0.5 CSS px of the first capture. The checks cover RGB, alpha within one 8-bit step, eight gradients, corner colours, `color-scheme: normal`, and transition time for each motion setting. They match the values in `Contact.css` and FM-01.
- **Zero submits:** A capture-phase `submit` counter is installed before the page loads and must read 0. The test file adds no skips, retries or weaker assertions.
- **Engine and motion matrix:** All eight Chromium/WebKit, normal/reduced-motion results are recorded. The doc says clearly that `selectOption` does not simulate the native menu.

## Finding

**[LOW] OS version mismatch in the evidence record**
- **Where:** `docs/qa/assets/issue-330/verification.json:1055` (also lines 1077 and 1107) compared with line 7 and `docs/qa/2026-10-07-issue-330-native-budget.md:17`.
- **Acceptance clause:** "documented native-keyboard check records actual engine/platform."
- **Problem:** The host is recorded as macOS `27.0.1`, but the native-keyboard records give `osRelease` as `"27.0.0"`. Nothing says whether that field is the Darwin kernel release or the macOS version, so the platform record contradicts itself.
- **Fix:** Rename the field (for example `darwinRelease`) or record the same macOS version as the host.

## Unverified hypotheses (not counted as findings)

1. **The injected-key diagnostic may never have reached Budget.** Both `headedInjectedKeyboard` entries end with `"focus": "email"` (lines 1093 and 1123), even after two traversal key presses. If so, they show nothing about whether native keys commit a menu choice. The doc's wording at line 50 ("did not commit a value with Space, ArrowDown, Enter, and traversal") suggests the keys reached the select. The outcome is correct, since the diagnostics aren't counted as passes. Consider noting that focus never left email.
2. **The POST counter may never fire.** The existing `/api/mutation` POST listener may not catch anything if `ConvexReactClient` sends mutations over its WebSocket. That gap predates this PR. If true, "zero mutations" depends on the new submit counter and on local-only mode closing external WebSockets. A browser check of a real submit, with network access blocked, would settle it.
3. **Native-keyboard WebKit, Safari and iOS behaviour remains unverified,** as the doc already says.

The pending Kiro review wording is excluded, as you asked.
