# Replay consent withdrawal

Issue [#320](https://github.com/vivekpatel99/my-portfolio-webisite/issues/320) was inspected on 7 October 2026 at `develop` commit `8a80ffb834ed9f28edf7eb497f8caa12bc8c4da7`.

## Lifecycle and SDK constraint

SDK 7.120.4 gives Replay a separate recorder lifecycle. Closing its core client leaves Replay enabled. The public Replay `stop()` removes recorder listeners and destroys its buffer, but also force-flushes session recordings. Its `setupOnce()` schedules a later call to the protected `_initialize()` method.

The consent module keeps one SDK client and one Replay integration. A small Replay subclass disables that scheduled startup and exposes consent-owned startup through the SDK's protected initializer. Sampling remains 5% session and 100% on error. Withdrawal closes the transport gate synchronously, disables core capture, and stops Replay before reopening the client on reaccept. The gate suppresses Replay's stop-time flush, including direct transport sends that bypass the core client's enabled flag. Reaccept waits for teardown and reuses the integration, avoiding SDK-wide duplicate integration state.

A request already dispatched while consent was granted may finish. Withdrawal prevents subsequent dispatches and discards unsent recording. This change cannot recall a request already sent. No test uses a vendor transport.

SDK 7 also resumes buffer recording unconditionally after an awaited error send. The adapter guards the container's recorder startup and tracks its buffer-promotion promises, including automatic error promotion and retries. Withdrawal waits for every tracked transition to settle. An independent spec review identified this additional race, and the real fixture reproduced premature reaccept in WebKit before the adapter was added.

The adapter depends on SDK 7's protected initialization contract and private container lifecycle methods and buffer. It also guards sampling initialization, which SDK 7 calls after asynchronously stopping an expired session. This dependency is confined to `ConsentReplay`. The real-SDK browser suite asserts the installed version and must be updated with any SDK upgrade. No application caller accesses the SDK container.

Terminating SDK 7's compression worker during a pending `finish()` leaves its promise unresolved. The adapter detaches the unsent buffer before stopping, waits for the SDK's flush lock in both sampling modes, and destroys the buffer after pending work settles. Detaching prevents the forced flush from reading optional recording. Keeping the session until the flush settles also avoids retrying a completed compression operation against a cleared session. The transport wrapper preserves the SDK's send annotations so failed error responses do not promote Replay.

## Repeat the browser regression

Run `npm run qa:replay-consent` after `npm ci` and installing Playwright Chromium and WebKit. `QA_REPLAY_PORT` selects an available loopback port, defaulting to 5401. The runner builds a production fixture in a unique OS temporary directory, serves it with a strict port, runs both engines, and removes its server and artifacts. CI runs this command in the existing telemetry QA job.

The fixture imports the real installed SDK. Its adapter changes sampling to deterministic session or buffer mode, disables recording compression for readable DOM assertions, and replaces network transport with an in-memory transport. Separate session and buffer cases use the real compression worker and hold its `finish` message. The fixture retains the production default for sticky sessions and verifies that withdrawal clears persisted Replay state. The fixture also exposes a controlled lazy-import gate and a pending-send gate. The browser permits loopback requests and loopback-origin blob workers, and blocks external requests.

Twelve journeys run in each engine, for twenty-four checks in total:

- Session and buffer recording are asserted active before withdrawal, with a full DOM checkout present. Withdrawal removes the recorder, disables Replay, destroys its buffer, reduces active listener count, and prevents later interactions and errors from sending recording.
- Public text and inputs are masked, and the sensitive contact region is excluded from recorded DOM. Tagged contact errors are filtered while background errors are delivered.
- Two reaccept cycles retain one SDK initialization and the same active listener count. The buffer journey also proves that an error promotes recording to session mode.
- Withdrawal during the SDK download prevents initialization. Withdrawal during synchronous SDK setup defeats the SDK's later startup timer.
- Held session and buffer transport sends complete after withdrawal, but newly buffered events are discarded. Immediate reaccept waits for teardown and does not dispatch that unsent recording.
- Successful and failed automatic error-triggered buffer sends cannot resume a withdrawn recorder. A failed send exercises the real SDK retry path; the consent gate suppresses retry dispatches, and reaccept retains the original active listener count.
- Withdrawal during an expired-session refresh prevents the asynchronous continuation from setting up another recorder. A positive assertion confirms that the guarded sampling initializer was reached.
- A rejected error response does not promote Replay. Withdrawal during real worker compression stops recording immediately, discards the unsent segment, and permits reaccept after the pending worker message completes.

## Verification on this Mac

The unchanged baseline passed 850 tests and the production build. Before the fix, both session and buffer withdrawal checks failed with `getReplayId()` still defined; the setup-race check also observed recording after withdrawal. The corrected fixture assertions inspect Replay's actual DOM event buffer rather than the custom-event callback, which receives only custom events in SDK 7.

The candidate passes 851 unit tests across 68 files, 20 targeted telemetry/privacy/consent tests, the production build with a synthetic DSN, and all twenty-four browser checks in installed Chromium and WebKit. Three existing fake-Sentry browser tests also pass, covering sensitive-region error filtering and session consent during localStorage write failures. ESLint's recommended rules pass on owned JavaScript and JSX files with the existing underscore-unused-variable convention. The repository has no lint or application typecheck package script. No Convex code changed.

The initial full unit run failed because the sandbox prevented its local HTTP servers from listening. A scoped rerun passed. Expected test-console errors and dependency deprecation warnings remain unchanged. Browser results establish current desktop engines on macOS, without claiming historical browser or physical-device coverage.

## Independent review

The implement skill's isolated Standards review found no standards violation. Its Spec review identified the pending buffer-promotion race. The adapter and real successful/rejected-send regressions resolve that finding. The no-comments review removed one redundant fixture comment and retained comments describing verified SDK constraints.

Kiro was invoked with the tracked `portfolio_frontend_review` profile configured for `claude-opus-5.5`, `--effort high`, engine v2, and read-only tool trust. Its first process timed out at 600 seconds after emitting a substantive review of the earlier candidate. It independently identified the buffer race and the transport annotation regression, and raised the compression-worker hypothesis. The buffer race and worker deadlock were reproduced and fixed; the real rejected-error-response test verifies the annotation repair. Reaccept waits for any already dispatched send to settle, including an SDK retry delay if the send fails. This keeps the gate closed through old work.

The original review output is retained in [kiro-initial-review.txt](assets/issue-320/kiro-initial-review.txt). The review names its runtime model as Opus 5.5, but cannot independently attest the effort level or routing. The configured profile and command establish the requested configuration.

A single controlled recovery completed a read-only review of staged tree `31dc4d9df2cf43713af7efd7756017f2f434014c`. [kiro-final-review.txt](assets/issue-320/kiro-final-review.txt) contains its actual response. Kiro found no blocking defects and confirmed the earlier fixes. Its remaining coverage concerns prompted stronger expired-session assertions, verification of sticky-session cleanup, and worker compression coverage in both sampling modes. Those supplemental fixture changes passed all twenty-four checks; the application implementation is unchanged from the reviewed tree.

Kiro did not read the separate storage or targeted-unit logs and could not establish lint success from an empty successful log. [validation.txt](assets/issue-320/validation.txt) retains the actual check summaries and structured ESLint results. The report now states the correct per-engine and total browser counts. A permanently hung vendor fetch can delay reaccept while the consent gate stays closed; that failure is unverified and no timeout policy is added here.
