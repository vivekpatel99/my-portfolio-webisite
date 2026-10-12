import { chromium } from '@playwright/test';
import fs from 'node:fs';
import { assertLoopbackPreviewUrl } from '../tests/qa/qa-local-only.js';

const baseURL = process.env.QA_PREVIEW_URL || 'http://127.0.0.1:3000';
assertLoopbackPreviewUrl(baseURL);

const browser = await chromium.launch({ headless: true });
const results = [];

try {
  for (const reducedMotion of ['no-preference', 'reduce']) {
    for (let run = 1; run <= 3; run++) {
      const context = await browser.newContext({
        viewport: { width: 1350, height: 940 }, reducedMotion,
      });
      try {
        const page = await context.newPage();
        await page.addInitScript(() => {
          localStorage.setItem('cookie_consent_preferences', JSON.stringify({ necessary: true, analytics: false }));
          window.cursorCommits = 0;
          window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
            supportsFiber: true,
            renderers: new Map(),
            inject(renderer) { this.renderers.set(1, renderer); return 1; },
            onCommitFiberRoot() { window.cursorCommits++; },
            onCommitFiberUnmount() {},
          };
        });
        await page.goto(baseURL);
        await page.waitForTimeout(2000);
        await page.evaluate(() => window.scrollTo(0, 1200));
        await page.mouse.move(300, 500);
        await page.waitForTimeout(1000);
        const initialized = await page.evaluate(() => (
          window.__REACT_DEVTOOLS_GLOBAL_HOOK__.renderers.size > 0 && window.cursorCommits > 0
        ));
        if (!initialized) throw new Error('React commit counter did not observe the initial render');

        const cdp = await context.newCDPSession(page);
        await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
        await cdp.send('Performance.enable');
        const metrics = async () => Object.fromEntries(
          (await cdp.send('Performance.getMetrics')).metrics.map(({ name, value }) => [name, value]),
        );
        await page.evaluate(() => { window.cursorCommits = 0; });
        const before = await metrics();
        const start = Date.now();
        for (let move = 0; move < 241; move++) {
          await page.mouse.move(300 + move * 2, 500 + Math.sin(move / 15) * 60);
          const remaining = start + (move + 1) * 2000 / 241 - Date.now();
          if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining));
        }
        const after = await metrics();
        results.push({
          reducedMotion, run, moves: 241, elapsedMs: Date.now() - start,
          commits: await page.evaluate(() => window.cursorCommits),
          scriptMs: (after.ScriptDuration - before.ScriptDuration) * 1000,
          taskMs: (after.TaskDuration - before.TaskDuration) * 1000,
          styleMs: (after.RecalcStyleDuration - before.RecalcStyleDuration) * 1000,
          layoutMs: (after.LayoutDuration - before.LayoutDuration) * 1000,
          styleCount: after.RecalcStyleCount - before.RecalcStyleCount,
          layoutCount: after.LayoutCount - before.LayoutCount,
        });
      } finally {
        await context.close();
      }
    }
  }
} finally {
  await browser.close();
}

const output = JSON.stringify(results, null, 2);
if (process.argv[2]) fs.writeFileSync(process.argv[2], `${output}\n`);
console.log(output);
if (results.some(({ reducedMotion, commits, taskMs }) => (
  reducedMotion === 'no-preference' && (commits !== 0 || taskMs > 200)
))) process.exitCode = 1;
