# Contact submission confirmation after navigation

Issue [#321](https://github.com/vivekpatel99/my-portfolio-webisite/issues/321), verified on 7 October 2026.

The Contact route now observes the completed submission result in the same document-memory store as its draft. A successful request shows and focuses one "Request received" receipt after returning, including when success completed while Contact was absent. A failed request preserves the draft and supplies persistent error text described by the focused retry button. Editing a field clears the previous result. Submission completion preserves newer draft objects.

The route focus handoff preserves an already focused Contact outcome. This covers success resolving between Contact remount and the router's queued frame. Form fields and result data never enter localStorage or sessionStorage. The transport, payload, and backend are unchanged.

## Inspected baseline and scope

- Clean task-owned managed worktree `/Users/viv/.codex/worktrees/4714/horizons-website`, initially detached at `8a80ffb834ed9f28edf7eb497f8caa12bc8c4da7`.
- Fetched `origin/develop` matched that SHA. Task branch `codex/issue-321`, PR base `develop`.
- Native GitHub blockers were empty. The live issue remained open.
- Frozen code candidate `54b239584a87d790570fc5c5e18e03fdc828d87d`. This is an unreferenced review commit. The delivered branch adds this report to the same code tree.
- Scope is the contact draft store, Contact, one route-focus guard, unit regressions, and the lifecycle QA spec/config. WebKit at 390px now uses the iPhone 13 mobile profile instead of resized desktop Safari.

## Regression evidence

Before the implementation, the strengthened contact unit suite failed three assertions covering success before return, success after return, and failure retry focus. The browser assertion for pending navigation/remount/success failed with expected receipt count 1 and observed count 0.

An integration test then reproduced a narrower focus race. Contact had focused the receipt, but the router's queued frame moved focus to main. The same Contact, MemoryRouter, and ScrollToTop journey passes with the route guard. The regression resolves success before flushing the queued navigation frame.

The browser success-after-remount test observes one receipt insertion, one receipt focus event, one mutation, and a polite live region. The away-completion journeys also check the final state on return, persistent failure feedback, new-draft clearing, preserved values, and unchanged browser storage.

## Verification

All lead fields, transport responses, and errors were synthetic. Browser HTTP/WebSocket guards block external transport in the lifecycle suite. Ports 4402, 5402, and 6402 were checked before use. Dependencies were installed only in this worktree.

| Check | Result |
| --- | --- |
| `npm test -- --maxWorkers=2` | 851 tests passed across 68 files |
| `VITE_CONVEX_URL=https://qa-contact-lifecycle.convex.cloud npm run build` | Passed; 21 static routes generated |
| Full contact lifecycle matrix | 104 checks passed across Chromium and WebKit, 1280px desktop and 390px mobile, normal/reduced motion; WebKit mobile uses iPhone 13 emulation |
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

Automatic approval review rejected two launch requests before CLI execution. It classified the source diff and test evidence as private data exported to Kiro and required authorization directly in this chat. The second request included the originating chat's user authorization retrieved with `read_thread`; the reviewer rejected that evidence as untrusted tool output. A direct approval question is pending. No Kiro review ran, no model was attested, and no Kiro findings/output exist. This required review gate remains incomplete.

The PR uses `Refs #321` while this gate and actual spoken-announcement verification remain open. Keep the worktree and the unique external evidence directory available for that review and remote CI. After those dependencies end, verify recoverability and archive the managed worktree. Creating the PR does not authorize merge or production release.
