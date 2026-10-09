import { expect } from '@playwright/test';
import { BUDGET_LABELS, BUDGET_OPTIONS } from '../../src/lib/budgetOptions.js';

export async function chooseBudget(page, value, { touch = false, keyboard = false } = {}) {
  const trigger = page.locator('#budget');
  const option = page.getByRole('option', { name: BUDGET_LABELS[value] || 'Select your budget range', exact: true });
  if (keyboard) {
    await trigger.scrollIntoViewIfNeeded();
    await trigger.press('Space');
    const menu = page.getByRole('listbox');
    await expect(menu).toBeFocused();
    await menu.press('Home');
    const optionIndex = value === '' ? 0 : BUDGET_OPTIONS.indexOf(value) + 1;
    for (let index = 0; index < optionIndex; index += 1) {
      await menu.press('ArrowDown');
    }
    await expect(option).toHaveAttribute('data-focus', '');
    await menu.press('Enter');
  } else if (touch) {
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
