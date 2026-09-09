export const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const fail = (message) => { throw new Error(`Case-study publication manifest: ${message}`); };
export const exactKeys = (value, allowed, label) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(`${label} must be an object`);
  const unexpected = Object.keys(value).filter((key) => !allowed.includes(key));
  if (unexpected.length) fail(`${label} contains unsupported fields: ${unexpected.join(', ')}`);
};
export const assertString = (value, label) => {
  if (typeof value !== 'string' || !value) fail(`${label} must be a non-empty string`);
};
export const assertMedia = (media, label) => {
  exactKeys(media, ['src', 'alt', 'poster', 'caption', 'width', 'height'], label);
  assertString(media.src, `${label} src`); assertString(media.alt, `${label} alt`);
  if (media.poster != null) assertString(media.poster, `${label} poster`);
  if (media.caption != null) assertString(media.caption, `${label} caption`);
  if (media.width != null && (!Number.isSafeInteger(media.width) || media.width < 1)) fail(`${label} width must be a positive integer`);
  if (media.height != null && (!Number.isSafeInteger(media.height) || media.height < 1)) fail(`${label} height must be a positive integer`);
};
export const assertStat = (stat, label) => {
  exactKeys(stat, ['value', 'suffix', 'label', 'description'], label);
  if (typeof stat.value !== 'number' || !Number.isFinite(stat.value)) fail(`${label} value must be a finite number`);
  if (typeof stat.suffix !== 'string') fail(`${label} suffix must be a string`);
  for (const field of ['label', 'description']) assertString(stat[field], `${label} ${field}`);
};
export const assertSafeExternalUrl = (value, label) => {
  if (typeof value !== 'string' || value.trim() !== value || /[\\\x00-\x1f\x7f]/.test(value)) fail(`${label} has unsafe URL characters`);
  let url;
  try { url = new URL(value); } catch { fail(`${label} is not a valid URL`); }
  if (url.protocol !== 'https:' || url.username || url.password || !url.hostname || url.href !== value) fail(`${label} must be a renderer-safe canonical HTTPS URL without credentials`);
};
