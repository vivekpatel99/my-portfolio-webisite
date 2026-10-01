import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

const [outputPath, baseURL = 'http://127.0.0.1:4178'] = process.argv.slice(2);
if (!outputPath) throw new Error('Provide an output JSON path and optional local preview URL.');
if (!['localhost', '127.0.0.1'].includes(new URL(baseURL).hostname)) {
  throw new Error('Measurements require a local production preview.');
}

const profiles = [
  { route: '/case-studies/', viewport: { width: 412, height: 823 }, deviceScaleFactor: 1.75 },
  { route: '/project/n8n-openai-data-extraction/', viewport: { width: 1350, height: 940 }, deviceScaleFactor: 1 },
  { route: '/', viewport: { width: 1350, height: 940 }, deviceScaleFactor: 1 },
];
const conditions = { cpu: 4, rtt: 150, down: 1600000, coldCache: true };
const browser = await chromium.launch();
const runs = [];
try {
  for (const profile of profiles) {
    for (let iteration = 0; iteration < 3; iteration++) {
      const context = await browser.newContext({
        viewport: profile.viewport, deviceScaleFactor: profile.deviceScaleFactor, serviceWorkers: 'block',
      });
      try {
        const page = await context.newPage();
        const cdp = await context.newCDPSession(page);
        await cdp.send('Network.enable');
        await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
        await cdp.send('Network.emulateNetworkConditions', {
          offline: false, latency: conditions.rtt, downloadThroughput: conditions.down / 8,
          uploadThroughput: 750000 / 8, connectionType: 'cellular4g',
        });
        await cdp.send('Emulation.setCPUThrottlingRate', { rate: conditions.cpu });
        await page.addInitScript(() => {
          window.__lcp = [];
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              window.__lcp.push({ time: entry.startTime, url: entry.url, tag: entry.element?.tagName });
            }
          }).observe({ type: 'largest-contentful-paint', buffered: true });
        });
        await page.goto(new URL(profile.route, baseURL).href, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);
        const measured = await page.evaluate(() => ({
          lcp: window.__lcp.at(-1),
          images: [...document.images].map((image) => ({
            src: image.currentSrc, natural: [image.naturalWidth, image.naturalHeight],
            rendered: [image.width, image.height],
          })),
          resources: performance.getEntriesByType('resource').filter((entry) => entry.initiatorType === 'img')
            .map((entry) => ({ url: entry.name, bytes: entry.encodedBodySize, duration: entry.duration })),
        }));
        if (!measured.lcp) throw new Error(`No LCP entry for ${profile.route}`);
        runs.push({ ...profile, iteration, ...measured });
        console.log(JSON.stringify({ route: profile.route, iteration, lcp: measured.lcp.time }));
      } finally {
        await context.close();
      }
    }
  }
  await writeFile(outputPath, `${JSON.stringify({ conditions, runs }, null, 2)}\n`);
} finally {
  await browser.close();
}
