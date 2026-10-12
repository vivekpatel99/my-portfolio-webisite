import { expect } from './qa-test.js';

export async function waitForConsentBannerEntrance(banner) {
  await expect.poll(() => banner.evaluate((el) => {
    const style = getComputedStyle(el);
    return Number(style.opacity) === 1 && (style.transform === 'none' || new DOMMatrixReadOnly(style.transform).m42 === 0);
  })).toBe(true);
}
