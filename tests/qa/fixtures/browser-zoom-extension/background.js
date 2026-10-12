// MV3 service worker so Playwright can call chrome.tabs.setZoom from the worker.
// Kept intentionally tiny: no UI, no messaging — evaluate() drives setZoom.
chrome.runtime.onInstalled.addListener(() => {});
