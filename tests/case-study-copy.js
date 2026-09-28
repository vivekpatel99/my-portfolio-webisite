import { createHash } from 'node:crypto';

const clientNameSha256 = 'd979885447a413abb6d606a5d0f45c3b7809e6fde2c83f0df3426f1fc9bfed97';
const editorialCopy = /not for proposals|not client-ready evidence|this story replaces|temporary stand-in|engagement screenshots/i;

export function containsCaseStudyCopyLeak(text) {
  return editorialCopy.test(text) || (text.match(/\b[a-z]+\b/gi) ?? []).some((word) =>
    createHash('sha256').update(word.toLowerCase()).digest('hex') === clientNameSha256);
}
