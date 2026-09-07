import { test as base, expect } from '@playwright/test';
import { guardLocalNavigation } from './qa-navigation-guard.js';

export const test = base.extend({
  localNavigationGuard: [async ({ context }, use) => {
    if (process.env.QA_LOCAL_ONLY !== '1') return use();
    await context.route('**/*', guardLocalNavigation);
    await use();
    await context.unroute('**/*', guardLocalNavigation);
  }, { auto: true }],
});

export { expect };
