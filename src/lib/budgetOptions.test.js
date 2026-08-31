import { describe, expect, it } from 'vitest';
import { BUDGET_OPTIONS as clientBudgetOptions } from './budgetOptions.js';
import { BUDGET_OPTIONS as serverBudgetOptions } from '../../convex/lib/leadValidation.ts';

describe('budget options', () => {
  it('keeps the contact form values aligned with Convex validation', () => {
    expect(clientBudgetOptions).toEqual([...serverBudgetOptions]);
  });
});
