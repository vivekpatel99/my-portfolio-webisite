// CENSUS PROBE: Identify which OPEN actor zeros scrollY during menu open
// Run: npx playwright test tests/qa/scroll-census-probe.spec.js --project=preview-desktop

import { test, expect } from '@playwright/test';

test('census: measure scrollY at each step during menu open', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 600 });
  await page.goto('/');
  
  // Scroll down to establish non-zero scrollY
  await page.evaluate(() => {
    window.scrollTo(0, 300);
  });
  await page.waitForTimeout(100);
  
  const scrollBefore = await page.evaluate(() => window.scrollY);
  console.log(`[CENSUS] scrollY before click: ${scrollBefore}`);
  
  const toggle = page.getByRole('button', { name: 'Toggle navigation menu' });
  
  // Click and measure scrollY immediately after
  await toggle.click();
  const scrollAfterClick = await page.evaluate(() => window.scrollY);
  console.log(`[CENSUS] scrollY IMMEDIATELY after click: ${scrollAfterClick}`);
  
  // Wait for dialog visible
  await expect(page.getByRole('dialog', { name: 'Navigation menu' })).toBeVisible();
  const scrollAfterDialog = await page.evaluate(() => window.scrollY);
  console.log(`[CENSUS] scrollY after dialog visible: ${scrollAfterDialog}`);
  
  // Check if Close focused
  await expect(page.getByRole('button', { name: 'Close navigation menu' })).toBeFocused();
  const scrollAfterFocus = await page.evaluate(() => window.scrollY);
  console.log(`[CENSUS] scrollY after Close focused: ${scrollAfterFocus}`);
  
  // Check if inert applied
  await expect(page.locator('#main-content')).toHaveAttribute('inert', '');
  const scrollAfterInert = await page.evaluate(() => window.scrollY);
  console.log(`[CENSUS] scrollY after inert applied: ${scrollAfterInert}`);
  
  console.log(`\n[CENSUS RESULT]`);
  console.log(`Before: ${scrollBefore}`);
  console.log(`After click: ${scrollAfterClick} ${scrollAfterClick !== scrollBefore ? '❌ CHANGED' : '✓'}`);
  console.log(`After dialog: ${scrollAfterDialog} ${scrollAfterDialog !== scrollBefore ? '❌ CHANGED' : '✓'}`);
  console.log(`After focus: ${scrollAfterFocus} ${scrollAfterFocus !== scrollBefore ? '❌ CHANGED' : '✓'}`);
  console.log(`After inert: ${scrollAfterInert} ${scrollAfterInert !== scrollBefore ? '❌ CHANGED' : '✓'}`);
  
  // Binary search candidates
  if (scrollAfterClick === 0 && scrollBefore !== 0) {
    console.log(`\n[DIAGNOSIS] Candidate A: Playwright click() triggers scrollIntoViewIfNeeded on sticky toggle`);
  } else if (scrollAfterDialog === 0 && scrollAfterClick !== 0) {
    console.log(`\n[DIAGNOSIS] Candidate: Dialog render/mount triggers scroll`);
  } else if (scrollAfterFocus === 0 && scrollAfterDialog !== 0) {
    console.log(`\n[DIAGNOSIS] Candidate C: focus() on Close button triggers scroll`);
  } else if (scrollAfterInert === 0 && scrollAfterFocus !== 0) {
    console.log(`\n[DIAGNOSIS] Candidate B: Setting inert on sticky header triggers scroll`);
  }
});

test('census A/B: force click vs normal click', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 600 });
  await page.goto('/');
  
  await page.evaluate(() => window.scrollTo(0, 300));
  await page.waitForTimeout(100);
  
  const scrollBefore = await page.evaluate(() => window.scrollY);
  console.log(`\n[A/B TEST] scrollY before: ${scrollBefore}`);
  
  // Test with force: true to skip scrollIntoViewIfNeeded
  const toggle = page.getByRole('button', { name: 'Toggle navigation menu' });
  await toggle.click({ force: true });
  
  const scrollAfter = await page.evaluate(() => window.scrollY);
  console.log(`[A/B TEST] scrollY after click({ force: true }): ${scrollAfter}`);
  console.log(`[A/B TEST] force:true preserves scroll: ${scrollAfter === scrollBefore ? 'YES ✓' : 'NO ❌'}`);
});

test('census C: DOM click (no Playwright actionability)', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 600 });
  await page.goto('/');
  
  await page.evaluate(() => window.scrollTo(0, 300));
  await page.waitForTimeout(100);
  
  const scrollBefore = await page.evaluate(() => window.scrollY);
  console.log(`\n[DOM CLICK] scrollY before: ${scrollBefore}`);
  
  // Click via DOM (no scrollIntoViewIfNeeded, no actionability checks)
  await page.evaluate(() => {
    document.querySelector('[aria-label="Toggle navigation menu"]').click();
  });
  
  const scrollAfterClick = await page.evaluate(() => window.scrollY);
  console.log(`[DOM CLICK] scrollY IMMEDIATELY after DOM click: ${scrollAfterClick}`);
  
  await expect(page.getByRole('dialog', { name: 'Navigation menu' })).toBeVisible();
  const scrollAfterDialog = await page.evaluate(() => window.scrollY);
  console.log(`[DOM CLICK] scrollY after dialog visible: ${scrollAfterDialog}`);
  
  await expect(page.getByRole('button', { name: 'Close navigation menu' })).toBeFocused();
  const scrollAfterFocus = await page.evaluate(() => window.scrollY);
  console.log(`[DOM CLICK] scrollY after Close focused: ${scrollAfterFocus}`);
  
  await expect(page.locator('#main-content')).toHaveAttribute('inert', '');
  const scrollAfterInert = await page.evaluate(() => window.scrollY);
  console.log(`[DOM CLICK] scrollY after inert: ${scrollAfterInert}`);
  
  console.log(`\n[DOM CLICK RESULT]`);
  console.log(`Before: ${scrollBefore}`);
  console.log(`After click: ${scrollAfterClick} ${scrollAfterClick !== scrollBefore ? '❌ CHANGED' : '✓ PRESERVED'}`);
  console.log(`After dialog: ${scrollAfterDialog} ${scrollAfterDialog !== scrollBefore ? '❌ CHANGED' : '✓ PRESERVED'}`);
  console.log(`After focus: ${scrollAfterFocus} ${scrollAfterFocus !== scrollBefore ? '❌ CHANGED' : '✓ PRESERVED'}`);
  console.log(`After inert: ${scrollAfterInert} ${scrollAfterInert !== scrollBefore ? '❌ CHANGED' : '✓ PRESERVED'}`);
  
  if (scrollAfterClick === scrollBefore && scrollAfterDialog === scrollBefore && scrollAfterFocus === scrollBefore && scrollAfterInert === scrollBefore) {
    console.log(`\n[WINNER] DOM click preserves scroll → HARNESS WAS ACTOR → Change qa-focus/qa-a11y to use page.evaluate click`);
  } else if (scrollAfterClick === scrollBefore && scrollAfterDialog !== scrollBefore) {
    console.log(`\n[WINNER] Product dialog render zeros scroll → Fix product component mount`);
  } else if (scrollAfterClick === scrollBefore && scrollAfterDialog === scrollBefore && scrollAfterFocus !== scrollBefore) {
    console.log(`\n[WINNER] Product focus() zeros scroll → Fix closeButtonRef.focus() in Header.jsx`);
  } else if (scrollAfterClick === scrollBefore && scrollAfterDialog === scrollBefore && scrollAfterFocus === scrollBefore && scrollAfterInert !== scrollBefore) {
    console.log(`\n[WINNER] Product inert on sticky header zeros scroll → Remove headerRef from backgroundElements in Header.jsx`);
  } else {
    console.log(`\n[INCONCLUSIVE] Scroll changed at multiple points`);
  }
});
