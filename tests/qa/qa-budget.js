import { expect } from '@playwright/test';
import { BUDGET_LABELS } from '../../src/lib/budgetOptions.js';

export async function chooseBudget(page, value) {
  await page.locator('#budget').click();
  await page.getByRole('option', { name: BUDGET_LABELS[value] || 'Select your budget range', exact: true }).click();
  await expectBudget(page, value);
}

export async function expectBudget(page, value) {
  await expect(page.locator('input[name="budget"]')).toHaveValue(value);
  await expect(page.locator('#budget')).toContainText(BUDGET_LABELS[value] || 'Select your budget range');
}
