import { expect } from '@playwright/test';
import { BUDGET_LABELS } from '../../src/lib/budgetOptions.js';

export async function chooseBudget(page, value, { touch = false } = {}) {
  const trigger = page.locator('#budget');
  const option = page.getByRole('option', { name: BUDGET_LABELS[value] || 'Select your budget range', exact: true });
  if (touch) {
    await trigger.tap();
    await option.tap();
  } else {
    await trigger.click();
    await option.click();
  }
  await expectBudget(page, value);
}

export async function expectBudget(page, value) {
  await expect(page.locator('input[name="budget"]')).toHaveValue(value);
  await expect(page.locator('#budget')).toContainText(BUDGET_LABELS[value] || 'Select your budget range');
}
