# Contact submission confirmation after navigation

Issue [#321](https://github.com/vivekpatel99/my-portfolio-webisite/issues/321), verified on 7 October 2026.

The Contact route now observes the completed submission result in the same document-memory store as its draft. A successful request shows and focuses one "Request received" receipt after returning, including when success completed while Contact was absent. A failed request preserves the draft and supplies persistent error text described by the focused retry button. Editing a field clears the previous result. Submission completion preserves newer draft objects.

Each completed outcome claims presentation once per browser document. Later Contact visits retain the receipt with `aria-live="off"` and use normal route focus. Feedback toast ownership also survives route remount: a successful retry dismisses the prior failure toast. The route focus handoff preserves an already focused Contact outcome only when Contact is the destination. This covers success resolving between Contact remount and the router's queued frame. Form fields and result data never enter localStorage or sessionStorage. The transport, payload, and backend are unchanged.

## Inspected baseline and scope

- Clean task-owned managed worktree `/Users/viv/.codex/worktrees/4714/horizons-website`, initially detached at `8a80ffb834ed9f28edf7eb497f8caa12bc8c4da7`.
- Fetched `origin/develop` matched that SHA. Task branch `codex/issue-321`, PR base `develop`.
- Native GitHub blockers were empty. The live issue remained open.
- Final integrated code candidate `a77ea4858ef1fb9817cfee9b94fdb54a811ad408`, based on develop `189084336c77da6108c2abbf642f1c82b75ca265`. Later delivery changes only this report and review evidence.
- Scope is the contact draft store, Contact, one route-focus guard, unit regressions, and the lifecycle QA spec/config. WebKit at 390px now uses the iPhone 13 mobile profile instead of resized desktop Safari.

## Regression evidence

Before the implementation, the strengthened contact unit suite failed three assertions covering success before return, success after return, and failure retry focus. The browser assertion for pending navigation/remount/success failed with expected receipt count 1 and observed count 0.

An integration test then reproduced a narrower focus race. Contact had focused the receipt, but the router's queued frame moved focus to main. The same Contact, MemoryRouter, and ScrollToTop journey passes with the route guard. The regression resolves success before flushing the queued navigation frame.

The browser success-after-remount test observes one receipt insertion, one receipt focus event, one mutation, and a polite live region. The away-completion journeys also check the final state on return, persistent failure feedback, new-draft clearing, preserved values, and unchanged browser storage.

## Verification

All lead fields, transport responses, and errors were synthetic. Browser HTTP/WebSocket guards block external transport in the lifecycle suite. Ports 4402, 5402, and 6402 were checked before use. Dependencies were installed only in this worktree.

| Check | Result |
| --- | --- |
| `npm test -- --maxWorkers=2` | 867 tests passed across 69 files |
| `VITE_CONVEX_URL=https://qa-contact-lifecycle.convex.cloud npm run build` | Passed; 21 static routes generated |
| Full contact lifecycle matrix | 128 checks passed across Chromium and WebKit, 1280px desktop and 390px mobile, normal/reduced motion; WebKit mobile uses iPhone 13 emulation |
| `QA_MOTION_PORT=6402 npm run qa:motion -- --grep 'contact validation, pending'` | 8 production-build feedback checks passed across Chromium/WebKit desktop/mobile, normal/reduced motion |
| ESLint on all changed JS/JSX/config files | Passed explicit correctness rules for unreachable code, duplicate cases, `typeof`, and unsafe finally |
| `tsc --noEmit --project convex/tsconfig.json` | Passed |
| `git diff --check` | Passed |

The repository has no lint script/configuration or frontend typecheck script. ESLint used explicit correctness rules; this was not a claim of a configured full-project lint pass. The available Convex typecheck was run without backend edits.

The initial sandboxed full unit run failed only at prohibited loopback listener bindings. The full suite passed with scoped escalation. Existing Browserslist, Node deprecation, color-environment, React/jsdom diagnostics remained visible; no warnings were hidden or package metadata changed.

The broader motion run exposed an ambiguous failure-toast selector because the persistent error also had a status role. Removing that redundant role keeps the existing toast as the live announcement and keeps persistent text connected to the retry button. The superseded broad run was stopped. The eight affected production-build contact feedback checks were rerun and passed; a complete motion suite pass is not claimed here.

Codex's in-app browser independently exercised a held in-memory synthetic request, SPA navigation to Services, Back before success, release, receipt focus, and receipt removal on a new draft. The synthetic preview never used an external backend. Its draft was cleared, tab closed, and server stopped.

WebKit mobile profiles provide browser emulation. They do not establish physical iPhone behavior. DOM/live-region/focus assertions establish the announcement structure and one insertion/focus event; actual spoken screen-reader output was not tested. No production submission, email delivery, telemetry record, deployment, or release was performed.

## Standards review

An isolated read-only reviewer inspected the pinned diff against AGENTS.md, React conventions, DESIGN.md FM-01 and BT-01. Final verdict had no actionable standards findings. A separate comment review identified two newly added explanatory comments; both were removed. Existing comments and unrelated files were preserved.

## Spec review

An isolated read-only reviewer found the queued route-focus race and the desktop-only WebKit configuration. Both findings were verified and fixed. Final review found no additional actionable spec defects. The reviewer required the final candidate browser rerun and retained the physical-device/screen-reader limits above.

## Kiro review gate

Requested configuration was Kiro CLI's `portfolio_frontend_review` read-only profile, `claude-opus-5.5`, effort `high`, tools `read,grep,glob`. The exact candidate diff, acceptance criteria, baseline/candidate SHA, and synthetic evidence were prepared outside the repository. Shared/global settings and the repository wrapper were not changed.

A source review ran after the user requested PR babysitting. Kiro attested `claude-opus-5.5` and read/grep/glob tools, but could not attest effort and did not load skills or inspect an exact pinned diff. Its output is retained in [kiro-source-review.txt](assets/issue-321/kiro-source-review.txt). This is a source review, not a complete final critique.

Two medium findings reproduced in both unit and browser tests: an old failure toast survived a remounted retry, and repeated visits presented the saved outcome again. Both were fixed with shared toast ownership and an atomic presentation claim. A low-priority destination guard finding was fixed and covered positively and negatively in router tests. The newer-draft suppression observation was retained intentionally: pending fields are disabled, and stale completions must preserve newer unsent draft objects without presenting an unrelated receipt.

Native standards review then replaced a rendered ref-derived flag with component state. The state refinement initially lost focus for success completed away from Contact. Its browser regression failed, then passed after separating presentation claiming from a dependent focus effect that runs after state commits. Final native standards/spec review and independent production browser verification found no further actionable defects. The final exact-diff Kiro recovery was rejected by automatic approval review because the external destination and payload needed direct approval. Approval is pending; no final Kiro verdict is claimed.

The PR uses `Refs #321` while actual spoken-announcement verification remains open. Merge targets develop only; no production release is authorized. The task-owned managed worktree will be archived after verified merge, and disposable local evidence removed after required evidence is committed.

## Follow-up review: clearing a failed draft

A GitHub review found that editing cleared persistent error text while leaving the prior failure toast visible. Four store regressions reproduced the defect for each editable field. `setFormState` now dismisses and clears the feedback handle when clearing an existing completed outcome. Validation feedback still dismisses on the next valid send. Eight browser checks across Chromium/WebKit desktop/mobile and both motion settings verify that a failure completed away from Contact disappears within one second of starting a new draft. Native standards and spec reviews found no additional defects.
