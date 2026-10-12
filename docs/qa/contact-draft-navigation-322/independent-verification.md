PASS+NOTES — independent runtime verification of PR #338 / #322

Candidate: 458328e4ef7af6c53ee9490081f79a5b26d0f11a
Base inspected: 045cff49c761f02b2f982333517801a8c421976c (origin/develop)
Stable full-diff patch ID: 499590e1e1afc5c72f0f1aa6f39bf83bffa52541

I did not author or edit this implementation. Independently inspected the base article's native anchors, candidate article/router-aware links, collection home link and regression assertions. Prior red.log from /tmp/horizons-322.IHkCtU reproduced empty Full Name after the article inquiry return in Chromium and WebKit; this is inherited historical runtime evidence, not a fresh before-run by this verifier.

Fresh runtime run exercised Chromium and WebKit at 1280x800 and 390x800 with reduced motion through synthetic contact -> home -> featured article -> inquiry, then collection load-more -> last article -> explicit collection return, browser Back, article home, collection home and inquiry return. All four journey cases passed, checking preserved name/email/budget/message, zero document navigation requests and unload warnings, dirty unload handler still preventing unload, no synthetic PII in local/session/history state, zero synthetic transport mutations, twelve restored cards, scroll restoration within 100px, and home scroll zero.

All four native Ctrl/Cmd popup cases passed, retaining source URL and correct new-tab destination. All four modified-event delegation cases passed their assertions. Initial matrix: 10 passed, 2 failed in Chromium afterEach context.unrouteAll({behavior:'wait'}) request drainage, not behavior assertions. Fresh bounded rerun of those exact two cases: 2 passed in 2.2s. Initial runtime.log and qa-results.json retain the failures; recovery.log and recovery/qa-results.json retain recovery. No guards or tests were weakened.

Remaining notes: macOS headless WebKit native middle-click navigation limitation remains; no fresh middle-click or actual Safari check was performed here. Real tab-close/reload and generated no-JavaScript routes were not rerun by this verifier; inherited durable report describes those checks and browser limits. Current WebKit and desktop-width emulation do not establish actual historical Safari/device behavior. No product defect found in examined runtime surface. Source ownership stayed read-only; preview listener 4403 stopped automatically after tests and was verified unused.
