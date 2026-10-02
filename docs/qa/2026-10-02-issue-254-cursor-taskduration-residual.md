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

Normal-motion medians: commits **1** (one-shot, not 241), TaskDuration **≈892ms** / **≈824ms**. Reduced-motion control TaskDuration **≈212–232ms**. Wall-clock elapsed is **≈4.0s** on this host (pace slip ≈2s): Playwright `mouse.move` under 4× CPU cannot hold the 2s pacing window. Prior #277 lab runs that held elapsed≈2s still measured normal TaskDuration **227–423ms**, all above 200ms, with **0** commits.

The measure script exit gate (`commits !== 0 || taskMs > 200` for normal motion) therefore fails here. That failure is expected under the residual conclusion below; the gate was not rewritten.

## Build the Lever — census

Rerunnable attribution script: `tools/census-cursor-taskduration.mjs`.

```bash
QA_PREVIEW_URL=http://127.0.0.1:PORT node tools/census-cursor-taskduration.mjs docs/qa/assets/issue-254-cursor-taskduration-census.json
```

Raw census: [issue-254-cursor-taskduration-census.json](assets/issue-254-cursor-taskduration-census.json).

Census medians (same probe conditions):

| metric | normal median | reduce median | motion-mode Δ (whole-page) |
|--------|---------------|---------------|------------------------|
| TaskDuration | 892.769ms | 242.486ms | **650.283ms** |
| ScriptDuration | 167.954ms | 53.187ms | 114.767ms |
| RecalcStyleDuration | 35.293ms | 0 | 35.293ms |
| LayoutDuration | 6.149ms | 0 | 6.149ms |
| attributedOther (task−script−style−layout) | 685.646ms | 188.990ms | **496.656ms** |
| commits | 1 | 0 | 1 |
| elapsedMs | 4021 | 4025 | ≈0 |
| styleCount | 241 | 0 | 241 |
| rafTicks | 243 | 243 | 0 |

Share of normal-motion TaskDuration: **~77% other / TaskOtherDuration**, ~19% script, ~4% style, ~1% layout. Style recalc count tracks the 241 moves when the spring cursor is on; layout stays near zero. The one React commit is a single timestamp mid-window (~6.2–6.7s `performance.now()`), not per-move commits.

## Residual conclusion

1. **Per-frame React work is gone.** Baseline was 241 commits / 2s. Current is 0–1 one-shot commits. That part of P-4 acceptance holds in spirit; investigate the rare one-shot only if it regresses toward N≈moves.
2. **Leftover TaskDuration is spring/compositor-adjacent main-thread bookkeeping** (TaskOther), not a React commit storm and not layout. Normal vs reduced-motion delta ≈ **500–650ms** of TaskDuration on this box, mostly in `attributedOtherMs`. That delta is a **whole-page motion-mode delta** (not cursor-only): other motion-gated actors such as the testimonials carousel also differ under `prefers-reduced-motion`.
3. **The absolute ≤200ms gate is wrong for this probe + spring + 4× CPU combination.** Evidence:
   - Prior paced (elapsed≈2s) post-#277 runs still sat at 227–423ms with 0 commits.
   - This host’s pace slip (~4s) inflates both cursor-on and control; even the reduced-motion control alone can exceed 200ms here.
   - Further spring-path micro-optimizations share the failed premise and the discarded experiment set.
4. **No deletable critical-path actor** showed up in the census that prior experiments did not already try. Do not ship another spring tweak to chase 200ms.

## Recommendation (do not close #254)

Revise leftover acceptance to:

- **0 React commits during movement** (document ≤1 one-shot if it remains non-per-frame), and
- **Document the measured TaskDuration residual** (median, range, reduced-motion control, motion-mode Δ (whole-page)), and
- **Owner feel** for the spring cursor (side-by-side / physical mouse) as the remaining product gate.

Keep `tools/measure-cursor-performance.mjs`’s 200ms exit check until product acceptance is explicitly revised; treat current nonzero exit as documenting the residual, not as a mandate for another spring experiment.

## Q1 / Q4 spot-check (this session)

- **Q4** (1280×800, 1.2s, no pointer move): `body`/`html` cursor `auto`, `custom-cursor-enabled` absent, dot `visibility: hidden`. Pass.
- **Q1** (lightbox via `button.case-gallery-open`, Chromium): dot `z-index: 10001`, centered on pointer over gallery image, `elementsFromPoint` top after hit-test enable = custom cursor. Pass.

## Codex Sol 6.1 review

Ran on Mac CLI: `codex exec review -m gpt-6.1-sol --commit 52a255c` (Sol 6.1). Findings addressed in follow-up commit:

1. **[P2] Isolate cursor state before attributing motion-mode delta** — **Addressed by labeling.** Census and this report now call the normal vs reduced-motion comparison a **whole-page motion-mode delta**, not cursor-only cost. Testimonials carousel and other motion-gated actors also change under reduced motion. A cursor-only on/off control was not added (smallest change that removes the overclaim). Prior #277 paced TaskDuration evidence (227–423ms, 0 commits) remains independent of this census delta.
2. **[P2] Derive residual conclusions from measured results** — **Addressed.** `tools/census-cursor-taskduration.mjs` now builds `residualConclusionNotes` from the measured commit/TaskDuration medians instead of unconditional near-zero-commit claims.

Do **not** use Cursor CloudAgent / Background Agent.

## Limits

No application code change in this follow-up (census + QA docs only). Physical cursor feel still needs owner acceptance. Issue #254 must stay open. Use `Refs #254` on any PR — not `Closes #254`.

Principles: Attack-the-Premise, Build-the-Lever, Prove-It-Works, Laziness Protocol.

## Harness follow-up (Codex review on PR #287)

Addressed in the census lever before merge:

- Build  /  with real bindings (fixes ).
- Stop mouse sampling at the 2s deadline ( + ).
- Remove self-scheduling rAF from the measured window.
- Keep whole-page  control labeled as such (cursor-only disable is follow-up).

Committed census JSON under  may still reflect the pre-fix harness until a fresh preview run regenerates it; conclusions in this report remain tied to the prior #277 paced labs + develop probe medians already cited above.

## Harness validity (Codex follow-up)

Absolute-gate conclusions in the census lever now require a complete sample: every normal run finishes all 241 moves inside the 2s window (`paceSlipMs == 0`). Commit attribution uses the **max** across normal runs (not the median), so one failed run cannot hide per-frame React work.
