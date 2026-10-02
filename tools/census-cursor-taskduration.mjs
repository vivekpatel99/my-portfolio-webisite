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

        await page.evaluate(() => {
          window.cursorCommits = 0;
          window.cursorCommitTimes = [];
          // Do not inject a self-scheduling rAF loop into the measured window;
          // that harness work would inflate TaskDuration / TaskOtherDuration.
        });

        const before = await metrics();
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
        const after = await metrics();
        const elapsedMs = Date.now() - start;
        const paceSlipMs = Math.max(0, elapsedMs - WINDOW_MS);

        const census = await page.evaluate(() => {
          return {
            commits: window.cursorCommits,
            commitTimes: window.cursorCommitTimes.slice(),
            rafTicks: 0,
          };
        });

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
          paceSlipMs: Math.max(0, elapsedMs - WINDOW_MS),
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

const residualConclusionNotes = (() => {
  const notes = [];
  const commitMax = census.commits.normal.max;
  const commitValues = census.commits.normal.values;
  const taskMedian = census.taskMs.normalMedian;
  const reducedTaskMedian = census.taskMs.reducedMedian;
  const sampleComplete =
    movesDoneMedian === MOVES &&
    paceSlipMedian === 0 &&
    census.movesDone.normal.values.every((n) => n === MOVES) &&
    census.paceSlipMs.normal.values.every((n) => n === 0);
  const commitsNearZero = commitMax <= 1;

  if (commitsNearZero) {
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
  if (!sampleComplete) {
    notes.push(
      `Incomplete sample vs declared workload/window (normal median movesDone ${movesDoneMedian}/${MOVES}, paceSlipMs ${paceSlipMedian}; per-run movesDone ${JSON.stringify(census.movesDone.normal.values)}, paceSlipMs ${JSON.stringify(census.paceSlipMs.normal.values)}). Discard or flag slipped runs; withhold absolute-gate conclusions until every normal run completes ${MOVES} moves inside ${WINDOW_MS}ms.`,
    );
  }
  // Gate conclusions only when the declared workload/window is fully satisfied.
  if (sampleComplete && commitsNearZero && taskMedian > 200) {
    notes.push(
      `Normal-motion median TaskDuration ${taskMedian}ms stays >200ms while every run has near-zero commits (reduce control ${reducedTaskMedian}ms). Absolute <=200ms gate is wrong for this probe+spring+4xCPU combination; prefer 0 commits + documented residual + owner feel.`,
    );
  } else if (sampleComplete && commitsNearZero && taskMedian <= 200) {
    notes.push(
      `Normal-motion median TaskDuration ${taskMedian}ms meets <=200ms with near-zero commits on every normal run.`,
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
    motionControl: 'whole-page-prefers-reduced-motion',
  },
  runs,
  census,
  residualConclusionNotes,
};

const output = `${JSON.stringify(report, null, 2)}\n`;
if (process.argv[2]) fs.writeFileSync(process.argv[2], output);
console.log(output);
