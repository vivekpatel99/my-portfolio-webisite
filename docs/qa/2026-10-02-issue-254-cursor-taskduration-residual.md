# Issue #254 leftover TaskDuration residual (Attack-the-Premise)

Base: `develop` `a0622e6`. Branch: `fix/254-cursor-taskduration-residual`.
Partial delivery from #277 remains on develop: MotionValues + springs, `z-[10001]`, first-move before hiding the native cursor. Q1/Q4 visibility and the stop-per-frame-React goal are retained.

## Premise under attack

> Further optimizing the spring-driven CustomCursor path under this matched probe will bring TaskDuration under 200ms.

Failed discarded experiments already tried under that premise: frame-coalescing, CSS transition, 60Hz input cap, will-change/containment/isolation/body placement. This follow-up does **not** invent another spring tweak.

## Matched probe (Prove-It-Works)

Same harness as `tools/measure-cursor-performance.mjs`: Chromium, 1350×940, 4× CPU, seeded necessary-only consent, home scrolled to 1200px, 241 paced moves targeting a 2s window, three fresh-context runs per motion mode against the production `dist/` preview.

### Verbatim measure runs on this box (develop `a0622e6`)

Pass 1 (`docs/qa/assets/issue-254-cursor-metrics-2026-10-02-develop.json`):

| mode | run | commits | taskMs | scriptMs | styleMs | layoutMs | elapsedMs |
|------|-----|---------|--------|----------|---------|----------|-----------|
| no-preference | 1 | 1 | 839.113 | 149.695 | 30.461 | 7.725 | 3995 |
| no-preference | 2 | 1 | 902.147 | 148.372 | 40.987 | 7.812 | 4000 |
| no-preference | 3 | 1 | 892.320 | 155.018 | 31.569 | 5.053 | 4000 |
| reduce | 1 | 0 | 206.085 | 44.044 | 0 | 0 | 3992 |
| reduce | 2 | 0 | 224.252 | 37.371 | 0 | 0 | 3998 |
| reduce | 3 | 0 | 211.923 | 43.474 | 0 | 0 | 3994 |

Pass 2 (`docs/qa/assets/issue-254-cursor-metrics-2026-10-02-develop-rerun.json`):

| mode | run | commits | taskMs | scriptMs | elapsedMs |
|------|-----|---------|--------|----------|-----------|
| no-preference | 1 | 1 | 793.750 | 143.050 | 3997 |
| no-preference | 2 | 1 | 915.444 | 164.886 | 3998 |
| no-preference | 3 | 1 | 824.266 | 140.835 | 3999 |
| reduce | 1 | 0 | 232.089 | 45.855 | 3994 |
| reduce | 2 | 0 | 224.433 | 40.547 | 4000 |
| reduce | 3 | 0 | 231.741 | 42.982 | 4002 |

Normal-motion medians: commits **1** (one-shot, not 241), TaskDuration **≈892ms** / **≈824ms**. Reduced-motion control TaskDuration **≈212–232ms**. Wall-clock elapsed is **≈4.0s** on this host (pace slip ≈2s): Playwright `mouse.move` under 4× CPU cannot hold the 2s pacing window. Committed paced labs in [`issue-254-cursor-metrics.json`](assets/issue-254-cursor-metrics.json) (elapsed≈2.00–2.01s, 0 commits) still measured normal TaskDuration **232.922–355.313ms** (`delivered`) and **241.941–401.483ms** (`current_base_c4619c2`) — all above 200ms.

The measure script exit gate (`commits !== 0 || taskMs > 200` for normal motion) therefore fails here. That failure is expected under the residual conclusion below; the gate was not rewritten.

## Build the Lever — census

Rerunnable attribution script: `tools/census-cursor-taskduration.mjs`.

```bash
QA_PREVIEW_URL=http://127.0.0.1:PORT node tools/census-cursor-taskduration.mjs docs/qa/assets/issue-254-cursor-taskduration-census.json
```

Raw census: [issue-254-cursor-taskduration-census.json](assets/issue-254-cursor-taskduration-census.json).

Census absolute medians (same probe conditions; **comparative deltas withheld**):

| metric | normal median | reduce median | motion-mode Δ (whole-page) |
|--------|---------------|---------------|------------------------|
| TaskDuration | 892.769ms | 242.486ms | **null (invalid)** |
| ScriptDuration | 167.954ms | 53.187ms | **null (invalid)** |
| RecalcStyleDuration | 35.293ms | 0 | **null (invalid)** |
| LayoutDuration | 6.149ms | 0 | **null (invalid)** |
| attributedOther (task−script−style−layout) | 685.646ms | 188.990ms | **null (invalid)** |
| commits | 1 | 0 | **null (invalid)** |
| elapsedMs | 4021 | 4025 | **null (invalid)** |
| styleCount | 241 | 0 | **null (invalid)** |
| rafTicks | 243 | 243 | **null (invalid)** |

The committed census JSON was captured under the pre-fix harness (elapsed≈4s, no `movesDone` / `comparativeValid`). The final lever sets `comparativeValid: false` and nulls every `wholePageMotionModeDeltaMedian` whenever either arm misses 241 moves inside 2s — so this report must not treat those deltas as evidence. Absolute medians above remain descriptive of that incomplete sample; regenerate on a host that holds the 2s window before citing comparative Δ again.

Share of normal-motion TaskDuration (absolute only): **~77% other / TaskOtherDuration**, ~19% script, ~4% style, ~1% layout. Style recalc count tracks the 241 moves when the spring cursor is on; layout stays near zero. The one React commit is a single timestamp mid-window (~6.2–6.7s `performance.now()`), not per-move commits.

## Residual conclusion

1. **Per-frame React work is gone.** Baseline was 241 commits / 2s. Current is 0–1 one-shot commits. That part of P-4 acceptance holds in spirit; investigate the rare one-shot only if it regresses toward N≈moves.
2. **Leftover TaskDuration is unattributed whole-page main-thread work** (mostly TaskOther in the incomplete census), not a React commit storm and not layout. Absolute normal-motion TaskDuration medians on this box are **≈825–893ms** with attributedOther the majority share; the reduced-motion arm shows a similar TaskOther share and those runs are also incomplete (~4s elapsed), so **do not use whole-page motion-mode Δ from this census as gate evidence** and **do not attribute the residual to the spring** until a complete cursor-only control exists. When a future complete sample sets `comparativeValid: true`, treat any Δ as whole-page (not cursor-only): testimonials carousel and other motion-gated actors also differ under `prefers-reduced-motion`.
3. **The absolute ≤200ms gate is wrong for this probe + spring + 4× CPU combination.** Evidence:
   - Committed paced runs in `docs/qa/assets/issue-254-cursor-metrics.json`: `delivered` **232.922–355.313ms** and `current_base_c4619c2` **241.941–401.483ms** (0 commits, elapsed≈2s).
   - This host’s pace slip (~4s) inflates both cursor-on and control; even the reduced-motion control alone can exceed 200ms here.
   - Further spring-path micro-optimizations share the failed premise and the discarded experiment set.
4. **No deletable critical-path actor** showed up in the census that prior experiments did not already try. Do not ship another spring tweak to chase 200ms.

## Recommendation (do not close #254)

Revise leftover acceptance to:

- **0 React commits during movement** (document ≤1 one-shot if it remains non-per-frame), and
- **Document the measured TaskDuration residual** (median, range, reduced-motion control, and motion-mode Δ (whole-page) **only when `comparativeValid`**), and
- **Owner feel** for the spring cursor (side-by-side / physical mouse) as the remaining product gate.

Keep `tools/measure-cursor-performance.mjs`’s 200ms exit check until product acceptance is explicitly revised; treat current nonzero exit as documenting the residual, not as a mandate for another spring experiment.

## Q1 / Q4 spot-check (this session)

- **Q4** (1280×800, 1.2s, no pointer move): `body`/`html` cursor `auto`, `custom-cursor-enabled` absent, dot `visibility: hidden`. Pass.
- **Q1** (lightbox via `button.case-gallery-open`, Chromium): dot `z-index: 10001`, centered on pointer over gallery image, `elementsFromPoint` top after hit-test enable = custom cursor. Pass.

## Codex Sol 6.1 review

Ran on Mac CLI: `codex exec review -m gpt-6.1-sol --commit 52a255c` (Sol 6.1). Findings addressed in follow-up commit:

1. **[P2] Isolate cursor state before attributing motion-mode delta** — **Addressed by labeling.** Census and this report now call the normal vs reduced-motion comparison a **whole-page motion-mode delta**, not cursor-only cost. Testimonials carousel and other motion-gated actors also change under reduced motion. A cursor-only on/off control was not added (smallest change that removes the overclaim). Committed paced TaskDuration evidence in `issue-254-cursor-metrics.json` (`delivered` 232.922–355.313ms; `current_base_c4619c2` 241.941–401.483ms; 0 commits) remains independent of this census delta.
2. **[P2] Derive residual conclusions from measured results** — **Addressed.** `tools/census-cursor-taskduration.mjs` now builds `residualConclusionNotes` from the measured commit/TaskDuration medians instead of unconditional near-zero-commit claims.

Do **not** use Cursor CloudAgent / Background Agent.

## Limits

No application code change in this follow-up (census + QA docs only). Physical cursor feel still needs owner acceptance. Issue #254 must stay open. Use `Refs #254` on any PR — not `Closes #254`.

Principles: Attack-the-Premise, Build-the-Lever, Prove-It-Works, Laziness Protocol.

## Harness follow-up (Codex review on PR #287)

Addressed in the census lever before merge:

- Stop mouse sampling at the 2s deadline (`paceSlipMs` / `movesDone`).
- Remove self-scheduling rAF from the measured window.
- Require both motion arms complete before comparative Δ (`comparativeValid`); otherwise null `wholePageMotionModeDeltaMedian`.
- Withhold commit-attribution and absolute-gate notes until every normal run completes 241 moves inside 2s.
- Keep whole-page `prefers-reduced-motion` control labeled as such (cursor-only disable is follow-up).
- Gate `cursorCommits` behind `__censusMeasuring`, but validate hook injection with ungated `__censusHookCommits` so init does not require the measuring flag.
- Pause testimonials by clicking the real **Pause testimonials** control (`isUserPaused`) **before** establishing scrollY 1200 / pointer (300,500), so click-induced scroll does not desync the normal-motion probe; reduced-motion arm already has autoplay off.
- Enable measuring before the before-snapshot and disable only after the after-snapshot so TaskDuration and `cursorCommits` share the same boundaries.
- Describe leftover TaskDuration as unattributed whole-page work (not spring/compositor-adjacent) until a complete cursor-only control exists.

## Artifact validity

The committed census JSON under `docs/qa/assets/` is a **pre-fix incomplete sample**. It now carries `comparativeValid: false` and nulled whole-page deltas so it cannot be misread as a valid arm comparison. Absolute TaskDuration / commit figures remain for context. Gate-revision evidence leans on committed paced labs in `issue-254-cursor-metrics.json` (`delivered` 232.922–355.313ms; `current_base_c4619c2` 241.941–401.483ms; 0 commits; elapsed≈2s) plus the develop measure tables above — not on nulled census Δ.

Absolute-gate conclusions in the live census lever require a complete sample: every normal run finishes all 241 moves with `paceSlipMs <= 32` (scheduler jitter after the final paced sleep; movement overruns that stop early still fail). Commit attribution uses the **max** across normal runs (not the median), so one failed run cannot hide per-frame React work.
