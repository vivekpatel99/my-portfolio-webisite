# TODOs - KinSame Streaming Deployment Skill

## m25 Streaming UI / License-Gated API Recovery - 2026-06-25
- [x] Confirm backend stream health with ffmpeg process count and MediaMTX path readiness.
- [x] Confirm browser symptom: `/pages/streaming` had no useful camera tiles and showed failed data/license messaging.
- [x] Check `kwebgate` logs for `/streaming/views`, `/streaming/cameras`, `LicensedView`, `UNAVAILABLE`, and connection-refused errors.
- [x] Check `klicense` container state and port `50053`.
- [x] Start `klicense` and restart `kwebgate` after confirming the license service was down.
- [x] Avoid restarting `kalgo`; runtime proof was already healthy.
- [x] Verify browser tiles, video `readyState`, `currentTime` movement, and visual frame changes after recovery.
- [x] Update `.agents/skills/kinsame-deploy/SKILL.md` with this triage path.

## Streaming UI Recovery Learning Checklist
- [x] Problem: explain why the browser can show "streaming does not work" while `kalgo` and MediaMTX are still publishing processed streams.
- [x] Cause: explain how `kwebgate` `LicensedView` can block view/camera APIs when `klicense` is down or unreachable.
- [x] Solution: explain why starting `klicense` and restarting `kwebgate` clears this failure without touching `kalgo`.
- [x] Verification: explain why proof needs both backend runtime evidence and browser-visible video advancement.

## RTSP ReID Package Refactor - 2026-06-24
- [x] Inspect current `kinsame/kalgo` dirty tree before editing.
- [x] Delete empty placeholder package modules from `videos/rtsp_reid/`.
- [x] Fix stale `RealtimeReIDEngine` tests that still expected `match_or_add(..., quality_score=...)` and `_embedding_quality`.
- [x] Retire wrapper-compatibility-by-default plan; `videos/rtsp_reid/` is canonical.
- [x] Clean obvious stale README CLI/deploy wording introduced by the split.
- [x] Verify touched wrapper/package/test files with `py_compile`.
- [x] Confirm no real current production/service caller still depends on top-level `videos/rtsp_reid_insightface.py` or `videos/rtsp_reid_multistream_benchmark.py`.
- [x] Update service/runtime imports to `videos.rtsp_reid.*` where still needed.
- [x] Ensure `BatchFaceDetectorUnit` receives detector micro-batch explicitly.
- [x] Update deployment skill/helper for split-package cleanup and `script1_frame_processing.py`.
- [x] Deploy RTSP ReID restructure to m25 and verify files, imports, runtime paths, and browser playback.
- [x] Re-verify after fresh product redeploy; fixed helper so ReID-only refresh no longer overwrites fresh schema-aligned `kcommon`.
- [ ] Run focused pytest once `uv run --no-sync` can spawn `pytest`; current blocker: `No such file or directory`.

## RTSP ReID Refactor Learning Checklist
- [x] Problem: explain why wrapper compatibility is now retired unless a real current production/service caller needs it.
- [x] Cause: explain why empty package placeholders are review noise.
- [x] Solution: explain why direct component tests should follow the current gallery/refinement API.
- [x] Solution: explain why service/runtime imports should target `videos.rtsp_reid.*` directly.
- [x] Edge case: explain why `BatchFaceDetectorUnit` must receive detector micro-batch explicitly.
- [ ] Verification: run focused pytest once `uv run --no-sync` can spawn `pytest`; current blocker: `No such file or directory`.
- [x] Verification: explain why deploy proof needs stale-file deletion plus browser `currentTime`, not only local import success.

## Streaming/ReID Throughput Optimization - 2026-06-23
- [x] Inspect current `kinsame/kalgo` dirty tree before editing.
- [x] Run focused local tests for current profiling/runtime instrumentation.
- [x] Capture read-only m25 runtime baseline: ffmpeg processes, Docker stats, GPU pmon, MediaMTX paths, and kalgo logs.
- [x] Verify local runtime files match m25 deployed runtime checksums.
- [x] Verify deployed runtime Python files compile inside `kalgo`.
- [x] Verify browser playback after deploy: two processed 1920x1080 video elements advanced 5.535s over a 5.5s wait.
- [x] Identify measured dominant bottleneck: `BatchDetectorUnit`, especially small-face refinement windows, not publisher copy or tracker/ReID.
- [x] Deploy only `videos/batch_detector_unit.py` after confirming other runtime dirty files already matched m25.
- [x] Confirm small-face refinement crop detection is batched and has a focused test.
- [x] Probe m25 detector micro-batch 4 in an isolated process: batch 4 fit and improved 1024-pass per-frame session time versus batch 2.
- [x] Add local bounded detector micro-batch selection: 3+ stream batches use 4, 1-2 stream batches keep 2.
- [x] Run focused local tests for the bounded micro-batch selection.
- [x] Fix and verify legacy MediaMTX cleanup for same-stream source URL replacement without raw fallback or API-mode path churn.
- [x] Rerun changed-file local verification: 110 streaming/ReID tests passed and changed runtime files compile.
- [x] Capture read-only m25 pre-deploy snapshot and narrow changed runtime deploy manifest to `reid_runtime.py` and `rtsp_reid_insightface.py`.
- [x] Confirm live deployed detector still runs two chunks per detector pass per 4-frame pipeline batch, making the micro-batch-4 deploy the next measured step.
- [x] Reject further local-only hot-path edits for now: sync is measured tiny, and gallery/protected-PID changes are identity-risky.
- [ ] Get explicit approval before deploying/restarting the live detector micro-batch selection change.

## Multi-Camera FPS Fairness Loop
- [x] Run loop iteration 1 (observe only): `docs/streaming-multicam-fps-loop.md` → **O → C**, no code.
- [x] Record artifacts under `results/mcam-fps-20260623-1/`.
- [x] Classify: **C3 mux starvation** (C2 partial detector bound; not C1).
- [x] Iteration 2: implement mux fairness (branch **F**) + tests locally.
- [x] Deploy `rtsp_reid_insightface.py` to m25 → **V** partial pass (fairness 0.81–0.90 steady-state).
- [x] Iteration 3: **D** already live (micro-batch=4); investigated stream 3 RTSP.
- [ ] Ops: review camera `e2055ac3` H264 POC warnings + 25fps source on m25 VMS.
- [ ] Optional iteration 3: detector micro-batch (**D**) if aggregate still low after fair mux.

## Current Streaming Learning Checklist
- [x] Problem: explain why processed FPS is bounded by detector/refinement work, not publisher copy.
- [x] Cause: explain why preserving 640/1024 passes leaves batching/refinement as the safe optimization surface.
- [x] Branches: distinguish safe batching from forbidden skipping, resizing down, or processing fewer cameras.
- [x] Solution: explain why batching existing 320x320 refinement crops preserves detector quality while reducing per-crop overhead.
- [ ] Solution: after approval, deploy detector micro-batch 4 selection and compare before/after live `BatchDetectorUnit` stats.
- [ ] Verification: after deploy, prove only processed publisher paths are browser-facing and 4 saved-view cameras continue background processing.
- [x] Edge case: explain why same-stream URL replacement must close the old publisher and clean legacy paths without deleting API-mode publisher paths.
- [x] Impact: verify backend/runtime paths and browser-visible playback separately.

## m25 Streaming FPS/Playback Investigation - 2026-06-22
- [x] Read project/deploy guidance and current streaming runbook.
- [x] Spawn backend, browser, code-path, architecture, and safety subagents.
- [x] Capture active view/camera count and current processed paths.
- [x] Capture ffmpeg process state, MediaMTX paths, docker stats, CPU/memory, GPU/pmon.
- [x] Verify browser `currentTime`, readyState, dimensions, path, and image movement.
- [x] Trace current live symptom to misleading source-FPS metadata plus CPU/raw-frame throughput pressure, not current HLS freeze.
- [x] Build ranked hypotheses with one cheap falsifiable check each.
- [x] Decide whether instrumentation is needed before code changes.
- [x] Apply one minimal `kinsame/kalgo` runtime change: normalize impossible source FPS before overlay/tracker timing.
- [x] Verify deployed runtime change with backend proof plus browser-visible movement.

## Current Learning Checklist
- [x] Problem: restate why overlay FPS can disagree with visible playback.
- [x] Solution: explain the chosen FPS normalization and why broader optimization remains a measured next loop.
- [x] Impact: explain what the change affects across readers, publishers, MediaMTX/HLS, and browser playback.

## Session Reset
- [x] Replace stale FPS/playback review notes with deployment-skill session notes.
- [x] Keep writable scope to `.kiro/context.md`, `.kiro/todos.md`, and `.kiro/insights.md`.
- [x] Record concise assumptions and ambiguities for continuation.

## Skill Creation Checklist
- [x] Have the human restate the intended deployment/testing workflow before building the skill.
- [x] Use `skill-creator` to implement the resolved project-local skill and validation path.
- [x] Use `grill-with-docs` to challenge vague terms: deployment, testing, verification, frontend, target, and source tree.
- [x] Read `.kiro/ssh-deploy.md`, `docs/DEPLOYMENT_ARCHITECTURE.md`, and `kinsame/kalgo/videos/README.md`.
- [x] Resolve local path assumptions: `kinsame/kalgo` versus root `kalgo`.
- [x] Resolve grill Q1: machine 22 / `192.168.210.22` is not a supported SSH deployment target. Skill targets are documented `m25`, `m21`, and EC2; after deploy, use that target's own IP/URL for frontend access. If a user says `machine 22`, ask for an SSH alias/IP instead of guessing.
- [x] Resolve grill Q2: deploy backend/streaming by default (`kinsame/kalgo`, `kinsame/kcommon`, relevant `kinsame/kbackend/kwebgate`). Frontend is verify-only unless `kinsame/kfrontend` source/config changed or the user asks for frontend deploy.
- [x] Resolve container targets for each file family: `kalgo`, `kbackend`, `kwebgate`, or frontend.
- [x] Resolve grill Q3: deploy minimal changed files by default. Use `kinsame/kalgo/videos/deploy_to_ec2.sh` only for full streaming bundle refreshes, core ReID streaming bundle changes, or explicit user request. The skill may update/change the script when changed files show its deploy list is stale.
- [x] Resolve grill Q4: split restart behavior. Service deployments restart affected services after deploy, usually `kalgo kbackend`; add `kwebgate` only when gateway files changed. One-off benchmark/script tests copied into `kalgo:/workspace` do not restart unless explicitly needed because `.kiro/run-guide.md` warns restart can wipe `/workspace`.
- [x] Resolve grill Q5: deployment verification requires layered proof: remote file content/mtime inside the target container, Python compile inside the container, restarted services staying running with no new crash-loop logs, streaming runtime proof via ffmpeg/MediaMTX/process/log evidence, and browser proof at the deployed machine URL when browser-visible and browser/auth access is available. Keep backend/runtime proof separate from frontend/browser proof.
- [x] Resolve grill Q6: create the skill as project-local `.agents/skills/kinsame-deploy`, not global Codex, because KinSame paths, containers, targets, and verification rules are repo-specific.
- [x] Decide whether forward-testing or subagents may touch live machines; dry-runs are allowed, but live modifying tests require approval.
- [x] Validate the created skill and update these notes with the final skill path: `.agents/skills/kinsame-deploy` with `SKILL.md` and `agents/openai.yaml`.
- [x] Confirm validator passed with `uv run --no-project --with pyyaml ...quick_validate.py`.
- [x] Patch dry-run forward-test gaps: kwebgate layout verification, restart ordering, `/pages/streaming` browser route hint, selected-view ffmpeg count expectation, and optional live backup.
- [x] Record two fresh read-only expert reviews of `.agents/skills/kinsame-deploy`: deployment expert and skill/harness portability expert.
- [x] Patch expert findings into `SKILL.md`: Codex/Cursor/Kiro portability, optional subagent/fresh-pass wording, conditional doc reads, m21 sudo preflight, EC2-only `deploy_to_ec2.sh` limit, harness command limits, benchmark isolation/PID cleanup, MediaMTX target-network query context, and backup checksum/restore notes.
- [x] Confirm validator passed after the expert-review patch.
- [x] Record `.agents/skills/kinsame-deploy` update: deployment preflight must inspect full `kinsame/` production supertree and all recursive submodules, not only `kinsame/kalgo`.
- [x] Record required preflight commands: `git -C kinsame status --short` and `git -C kinsame submodule foreach --recursive 'git status --short'`.
- [x] Record deployment classification rule: every changed file is deployed, deliberately not deployed, or blocked by unknown mapping.
- [x] Record deploy-by-default rule: every changed runtime/source/config file with a known target should be deployed.
- [x] Record added mappings/restart guidance for `kbackend/kbackend`, `kbackend/kdbserver`, `kfrontend`, `klicense`, and `kinstall`; validation passed.

## Learning Checklist
- [x] Problem: explain why stale deployment notes cause wrong-path or wrong-target changes.
- [x] Solution: explain the skill's source-of-truth order, deployment decision tree, and verification gates.
- [x] Impact: explain how the skill protects streaming uptime, processed-only output, and future agent handoffs.
