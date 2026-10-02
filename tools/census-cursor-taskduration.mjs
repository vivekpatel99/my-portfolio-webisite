/**
 * Census lever for issue #254 leftover TaskDuration residual.
 * Attributes CDP Performance.getMetrics during the matched cursor probe
 * (Chromium 1350x940, 4x CPU, 241 paced moves / ~2s target) to:
 *   scripting | style | layout | other(=task - script - style - layout)
 * and reports normal vs reduced-motion control delta (whole-page motion-mode delta, not cursor-only).
 *
 * Usage:
 *   QA_PREVIEW_URL=http://127.0.0.1:PORT node tools/census-cursor-taskduration.mjs [out.json]
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import { assertLoopbackPreviewUrl } from '../tests/qa/qa-local-only.js';

const baseURL = process.env.QA_PREVIEW_URL || 'http://127.0.0.1:3000';
assertLoopbackPreviewUrl(baseURL);

const RUNS = Number(process.env.CENSUS_RUNS || 3);
const MOVES = 241;
const WINDOW_MS = 2000;
// Final paced sleep targets start+WINDOW_MS exactly; timer jitter often lands at 2001–2008ms.
const PACE_SLIP_TOLERANCE_MS = 32;

const metricDeltaMs = (before, after, name) =>
  ((after[name] ?? 0) - (before[name] ?? 0)) * 1000;

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const summarize = (rows, key) => {
  const values = rows.map((row) => row[key]);
  return {
    min: Math.min(...values),
    max: Math.max(...values),
    median: median(values),
    values,
  };
};

const browser = await chromium.launch({ headless: true });
const runs = [];

try {
  for (const reducedMotion of ['no-preference', 'reduce']) {
    for (let run = 1; run <= RUNS; run++) {
      const context = await browser.newContext({
        viewport: { width: 1350, height: 940 },
        reducedMotion,
      });
      try {
        const page = await context.newPage();
        await page.addInitScript(() => {
          localStorage.setItem(
            'cookie_consent_preferences',
            JSON.stringify({ necessary: true, analytics: false }),
          );
          window.cursorCommits = 0;
          window.cursorCommitTimes = [];
          window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
            supportsFiber: true,
            renderers: new Map(),
            inject(renderer) {
              this.renderers.set(1, renderer);
              return 1;
            },
            onCommitFiberRoot() {
              window.cursorCommits++;
              window.cursorCommitTimes.push(performance.now());
            },
            onCommitFiberUnmount() {},
          };
        });

        await page.goto(baseURL);
        await page.waitForTimeout(2000);
        await page.evaluate(() => window.scrollTo(0, 1200));
        await page.mouse.move(300, 500);
        await page.waitForTimeout(1000);

        const initialized = await page.evaluate(
          () =>
            window.__REACT_DEVTOOLS_GLOBAL_HOOK__.renderers.size > 0
            && window.cursorCommits > 0,
        );
        if (!initialized) {
          throw new Error('React commit counter did not observe the initial render');
        }

        const cdp = await context.newCDPSession(page);
        await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
        await cdp.send('Performance.enable');

        const metrics = async () => Object.fromEntries(
          (await cdp.send('Performance.getMetrics')).metrics.map(({ name, value }) => [
            name,
            value,
          ]),
        );

        // Do not inject a self-scheduling rAF loop into the measured window;
        // that harness work would inflate TaskDuration / TaskOtherDuration.
        const before = await metrics();
        // Reset the commit counter at the same boundary as the metrics window
        // start so testimonials/carousel commits during getMetrics are excluded.
        const windowStart = await page.evaluate(() => {
          window.cursorCommits = 0;
          window.cursorCommitTimes = [];
          return performance.now();
        });
        const start = Date.now();
        let movesDone = 0;
        for (let move = 0; move < MOVES; move++) {
          if (Date.now() - start >= WINDOW_MS) break;
          await page.mouse.move(300 + move * 2, 500 + Math.sin(move / 15) * 60);
          movesDone += 1;
          const remaining = start + ((move + 1) * WINDOW_MS) / MOVES - Date.now();
          if (remaining > 0) {
            await new Promise((resolve) => setTimeout(resolve, remaining));
          }
        }
        // Workload elapsed time must exclude CDP getMetrics latency, or
        // sampleComplete falsely fails after a paced 2s move loop.
        const elapsedMs = Date.now() - start;
        const paceSlipMs = Math.max(0, elapsedMs - WINDOW_MS);
        // Take the after metrics snapshot first so TaskDuration and commit
        // filtering share the same trailing boundary (CDP wait included).
        const after = await metrics();
        const windowEnd = await page.evaluate(() => performance.now());

        // Keep only commits whose timestamps fall inside the metrics window.
        const census = await page.evaluate(({ windowStart, windowEnd }) => {
          const commitTimes = window.cursorCommitTimes.filter(
            (t) => t >= windowStart && t <= windowEnd,
          );
          return {
            commits: commitTimes.length,
            commitTimes,
            rafTicks: 0,
          };
        }, { windowStart, windowEnd });

        const scriptMs = metricDeltaMs(before, after, 'ScriptDuration');
        const styleMs = metricDeltaMs(before, after, 'RecalcStyleDuration');
        const layoutMs = metricDeltaMs(before, after, 'LayoutDuration');
        const taskMs = metricDeltaMs(before, after, 'TaskDuration');
        const taskOtherMs = metricDeltaMs(before, after, 'TaskOtherDuration');
        const attributedOtherMs = Math.max(0, taskMs - scriptMs - styleMs - layoutMs);

        runs.push({
          reducedMotion,
          run,
          moves: MOVES,
          elapsedMs,
          movesDone,
          paceSlipMs,
          windowTargetMs: WINDOW_MS,
          commits: census.commits,
          commitTimesMs: census.commitTimes,
          rafTicks: census.rafTicks,
          scriptMs,
          styleMs,
          layoutMs,
          taskMs,
          taskOtherMs,
          attributedOtherMs,
          styleCount: (after.RecalcStyleCount ?? 0) - (before.RecalcStyleCount ?? 0),
          layoutCount: (after.LayoutCount ?? 0) - (before.LayoutCount ?? 0),
          share: {
            script: taskMs > 0 ? scriptMs / taskMs : 0,
            style: taskMs > 0 ? styleMs / taskMs : 0,
            layout: taskMs > 0 ? layoutMs / taskMs : 0,
            other: taskMs > 0 ? attributedOtherMs / taskMs : 0,
          },
        });
      } finally {
        await context.close();
      }
    }
  }
} finally {
  await browser.close();
}

const normal = runs.filter((row) => row.reducedMotion === 'no-preference');
const reduced = runs.filter((row) => row.reducedMotion === 'reduce');

const delta = (key) => {
  const n = summarize(normal, key);
  const r = summarize(reduced, key);
  return {
    normalMedian: n.median,
    reducedMedian: r.median,
    wholePageMotionModeDeltaMedian: n.median - r.median,
    normal: n,
    reduced: r,
  };
};

const census = {
  taskMs: delta('taskMs'),
  scriptMs: delta('scriptMs'),
  styleMs: delta('styleMs'),
  layoutMs: delta('layoutMs'),
  attributedOtherMs: delta('attributedOtherMs'),
  taskOtherMs: delta('taskOtherMs'),
  commits: delta('commits'),
  elapsedMs: delta('elapsedMs'),
  movesDone: delta('movesDone'),
  paceSlipMs: delta('paceSlipMs'),
  rafTicks: delta('rafTicks'),
  styleCount: delta('styleCount'),
};

const paceSlipMedian = census.paceSlipMs.normalMedian;
const movesDoneMedian = census.movesDone.normalMedian;
const reducedPaceSlipMedian = census.paceSlipMs.reducedMedian;
const reducedMovesDoneMedian = census.movesDone.reducedMedian;

// Completeness: all moves done. Allow tiny slip only when the full move count
// finished — that is final pacing-sleep jitter, not a movement overrun.
const armWorkloadComplete = (arm) =>
  census.movesDone[arm].values.every((n, i) => {
    const slip = census.paceSlipMs[arm].values[i] ?? 0;
    return n === MOVES && slip <= PACE_SLIP_TOLERANCE_MS;
  });

const normalSampleComplete =
  movesDoneMedian === MOVES &&
  paceSlipMedian <= PACE_SLIP_TOLERANCE_MS &&
  armWorkloadComplete('normal');
const reducedSampleComplete =
  reducedMovesDoneMedian === MOVES &&
  reducedPaceSlipMedian <= PACE_SLIP_TOLERANCE_MS &&
  armWorkloadComplete('reduced');
const comparativeSampleComplete = normalSampleComplete && reducedSampleComplete;

if (!comparativeSampleComplete) {
  for (const key of Object.keys(census)) {
    census[key].wholePageMotionModeDeltaMedian = null;
    census[key].comparativeValid = false;
  }
} else {
  for (const key of Object.keys(census)) {
    census[key].comparativeValid = true;
  }
}

const residualConclusionNotes = (() => {
  const notes = [];
  const commitMax = census.commits.normal.max;
  const commitValues = census.commits.normal.values;
  const taskMax = census.taskMs.normal.max;
  const taskValues = census.taskMs.normal.values;
  const taskMedian = census.taskMs.normalMedian;
  const reducedTaskMedian = census.taskMs.reducedMedian;
  const commitsNearZero = commitMax <= 1;
  const taskWithinGate = taskValues.every((ms) => ms <= 200);
  const movesValues = census.movesDone.normal.values;

  // Commit attribution needs a complete normal workload. Short incomplete runs
  // (e.g. 2 moves / 1 commit) are not enough evidence against per-frame work.
  if (!normalSampleComplete) {
    notes.push(
      `Withholding React commit-attribution conclusions until every normal run completes ${MOVES} moves with paceSlipMs<=${PACE_SLIP_TOLERANCE_MS} (scheduler jitter after the final paced sleep) (commits ${JSON.stringify(commitValues)}, movesDone ${JSON.stringify(movesValues)}). Short incomplete samples can look near-zero without proving non-per-frame React work.`,
    );
  } else if (commitsNearZero) {
    notes.push(
      `Near-zero React commits on every normal run (max ${commitMax}, values ${JSON.stringify(commitValues)}, not ${MOVES}) means leftover TaskDuration is not per-frame React commit work.`,
    );
  } else {
    notes.push(
      `React commits still high on at least one normal run (max ${commitMax}, values ${JSON.stringify(commitValues)} vs ${MOVES} moves). Residual TaskDuration cannot be attributed away from React until every run is near zero.`,
    );
  }
  notes.push(
    'attributedOtherMs is TaskDuration minus Script minus Style minus Layout for the whole page under the probe window.',
  );
  notes.push(
    'IMPORTANT: normal vs reduced-motion delta is a whole-page motion-mode delta, not a cursor-only attribution. Other motion-gated actors (e.g. testimonials carousel) also change under prefers-reduced-motion. Cursor-only disable is a follow-up harness improvement, not required to reject the absolute <=200ms gate.',
  );
  notes.push(
    'Harness no longer injects a self-scheduling rAF loop into the measured window (rafTicks stay 0).',
  );
  if (!normalSampleComplete) {
    notes.push(
      `Incomplete normal-motion sample vs declared workload/window (median movesDone ${movesDoneMedian}/${MOVES}, paceSlipMs ${paceSlipMedian}; per-run movesDone ${JSON.stringify(census.movesDone.normal.values)}, paceSlipMs ${JSON.stringify(census.paceSlipMs.normal.values)}). Discard or flag slipped runs; withhold absolute-gate conclusions until every normal run completes ${MOVES} moves with paceSlipMs<=${PACE_SLIP_TOLERANCE_MS} (scheduler jitter after the final paced sleep).`,
    );
  }
  if (!reducedSampleComplete) {
    notes.push(
      `Incomplete reduced-motion control vs declared workload/window (median movesDone ${reducedMovesDoneMedian}/${MOVES}, paceSlipMs ${reducedPaceSlipMedian}; per-run movesDone ${JSON.stringify(census.movesDone.reduced.values)}, paceSlipMs ${JSON.stringify(census.paceSlipMs.reduced.values)}). Mark reduced control medians and wholePageMotionModeDeltaMedian invalid; do not compare arms until every reduced run completes ${MOVES} moves with paceSlipMs<=${PACE_SLIP_TOLERANCE_MS}.`,
    );
  }
  // Absolute gate: normal arm only. Cite reduce control / deltas only when both arms complete.
  // Match measure-cursor-performance: any normal run >200ms fails the gate.
  if (normalSampleComplete && commitsNearZero && !taskWithinGate) {
    const reduceCite = comparativeSampleComplete
      ? ` (reduce control ${reducedTaskMedian}ms)`
      : ' (reduced control incomplete — not cited)';
    notes.push(
      `Normal-motion TaskDuration exceeds 200ms on at least one run (max ${taskMax}ms, values ${JSON.stringify(taskValues)}, median ${taskMedian}ms) while every run has near-zero commits${reduceCite}. Absolute <=200ms gate is wrong for this probe+spring+4xCPU combination; prefer 0 commits + documented residual + owner feel.`,
    );
  } else if (normalSampleComplete && commitsNearZero && taskWithinGate) {
    notes.push(
      `Normal-motion TaskDuration meets <=200ms on every run (max ${taskMax}ms, values ${JSON.stringify(taskValues)}, median ${taskMedian}ms) with near-zero commits.`,
    );
  }
  return notes;
})();

const report = {
  premise:
    'Further optimizing the spring-driven CustomCursor path under this matched probe will bring TaskDuration under 200ms.',
  probe: {
    browser: 'Chromium',
    viewport: { width: 1350, height: 940 },
    cpuThrottlingRate: 4,
    moves: MOVES,
    windowTargetMs: WINDOW_MS,
    scrollY: 1200,
    consent: { necessary: true, analytics: false },
    samplingPolicy: 'stop-at-window-deadline',
    paceSlipToleranceMs: PACE_SLIP_TOLERANCE_MS,
    motionControl: 'whole-page-prefers-reduced-motion',
  },
  runs,
  census,
  comparativeValid: comparativeSampleComplete,
  residualConclusionNotes,
};

const output = `${JSON.stringify(report, null, 2)}\n`;
if (process.argv[2]) fs.writeFileSync(process.argv[2], output);
console.log(output);
