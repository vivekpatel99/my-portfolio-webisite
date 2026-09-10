import { readFileSync, renameSync, mkdirSync, mkdtempSync, rmSync, writeFileSync, existsSync, lstatSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import matter from 'gray-matter';
import he from 'he';
import { marked } from 'marked';
import { imageSize } from 'image-size';
import { caseStudyImageFormatForPath, slugPattern } from './case-study-schema.js';

const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp']);
const assetDigest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const imageIssue = (filePath, message) => issue(filePath, 'image', message);
const imageDimensions = (bytes, extension, filePath) => {
  let dimensions;
  try { dimensions = imageSize(bytes); } catch { imageIssue(filePath, 'is not a valid PNG, JPEG, or WebP image'); }
  const format = String(dimensions.type || '').toLowerCase();
  if (!imageExtensions.has(extension) || !['png', 'jpg', 'jpeg', 'webp'].includes(format) || (extension === '.png' && format !== 'png') || ((extension === '.jpg' || extension === '.jpeg') && !['jpg', 'jpeg'].includes(format)) || (extension === '.webp' && format !== 'webp')) imageIssue(filePath, `extension ${extension} does not match its actual image format`);
  if (!Number.isSafeInteger(dimensions.width) || !Number.isSafeInteger(dimensions.height) || dimensions.width < 1 || dimensions.height < 1) imageIssue(filePath, 'has invalid intrinsic dimensions');
  return { width: dimensions.width, height: dimensions.height, format: format === 'jpg' ? 'jpeg' : format };
};
const defaultAssetsRoot = (sourceFile, storyId) => path.join(path.dirname(path.resolve(sourceFile)), 'assets', storyId);
const resolveCaseStudyAsset = ({ source, filePath, storyId, assetsRoot }) => {
  if (typeof source !== 'string' || source.trim() === '') imageIssue(filePath, 'source must be a non-empty local file path');
  const clean = source.trim();
  if (clean.includes('\\') || clean.includes('\0') || path.posix.isAbsolute(clean) || /^[a-z][a-z0-9+.-]*:/i.test(clean) || clean.split('/').includes('..')) imageIssue(filePath, `source ${clean} must stay inside the story asset root`);
  let rootInfo; try { rootInfo = lstatSync(assetsRoot); } catch (error) { imageIssue(filePath, `assets root could not be read (${error.message})`); }
  if (!rootInfo.isDirectory() || rootInfo.isSymbolicLink()) imageIssue(filePath, 'assets root must be a real directory');
  const root = realpathSync(assetsRoot); const candidate = path.resolve(root, ...clean.split('/')); let real;
  try { real = realpathSync(candidate); } catch (error) { imageIssue(filePath, `source ${clean} is missing (${error.message})`); }
  if (!(real === root || real.startsWith(`${root}${path.sep}`))) imageIssue(filePath, `source ${clean} escapes the story asset root`);
  const info = lstatSync(real); if (!info.isFile()) imageIssue(filePath, `source ${clean} must be a regular file`);
  const extension = path.extname(clean).toLowerCase(); if (!imageExtensions.has(extension)) imageIssue(filePath, `source ${clean} must be PNG, JPEG, or WebP`);
  const bytes = readFileSync(real); const dimensions = imageDimensions(bytes, extension, filePath); const sha256 = assetDigest(bytes); const extensionForPath = extension === '.jpeg' ? '.jpg' : extension;
  return { source: real, bytes, sha256, width: dimensions.width, height: dimensions.height, format: dimensions.format, publicPath: `/assets/case-studies/${storyId}-${sha256}${extensionForPath}` };
};

const PUBLIC_HEADINGS = [
  ['problem', 'The problem'],
  ['built', 'What I built'],
  ['outcome', 'The outcome'],
];

const sourceLabel = (filePath) => path.basename(filePath || 'source.md');
const issue = (filePath, field, message) => {
  throw new Error(`${sourceLabel(filePath)}: ${field} ${message}`);
};

const nonEmptyString = (value, filePath, field) => {
  if (typeof value !== 'string' || value.trim() === '') issue(filePath, field, 'must be a non-empty string');
  return value.trim();
};

const safeUrl = (value, filePath, field) => {
  const url = nonEmptyString(value, filePath, field);
  if (url.includes('\\') || /^[\x00-\x20]|[\x00-\x20]$|[\x00-\x1f\x7f]/.test(url)) issue(filePath, field, 'contains unsafe URL characters');
  if (url.startsWith('/') && !url.startsWith('//')) {
    let internal;
    try { internal = new URL(url, 'https://case-study-preview.invalid'); } catch { issue(filePath, field, 'must be an internal path or HTTPS URL'); }
    if (internal.href !== `https://case-study-preview.invalid${url}`) issue(filePath, field, 'must be a normalized internal path or HTTPS URL');
    return url;
  }
  let parsed;
  try { parsed = new URL(url); } catch { issue(filePath, field, 'must be an internal path or HTTPS URL'); }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password) issue(filePath, field, 'must be an internal path or HTTPS URL');
  return url;
};

const tokenContainsImage = (tokens) => (tokens ?? []).some((token) => token.type === 'image' || tokenContainsImage(token.tokens));

const inlineNodes = (tokens, filePath, field) => (tokens ?? []).flatMap((token) => {
  switch (token.type) {
    case 'text':
    case 'escape': return [{ type: 'text', value: he.decode(token.text) }];
    case 'codespan': return [{ type: 'code', value: token.text }];
    case 'strong': return [{ type: 'strong', children: inlineNodes(token.tokens, filePath, field) }];
    case 'em': return [{ type: 'emphasis', children: inlineNodes(token.tokens, filePath, field) }];
    case 'del': return [{ type: 'delete', children: inlineNodes(token.tokens, filePath, field) }];
    case 'br': return [{ type: 'break' }];
    case 'link':
      if (tokenContainsImage(token.tokens)) issue(filePath, field, 'contains an image nested inside a link; image links are created automatically');
      return [{ type: 'link', href: safeUrl(token.href, filePath, `${field} link`), children: inlineNodes(token.tokens, filePath, field) }];
    case 'image': {
      const alt = nonEmptyString(token.text, filePath, `${field} image alt`);
      return [{ type: 'image', src: nonEmptyString(token.href, filePath, `${field} image source`), alt, ...(token.title ? { caption: nonEmptyString(token.title, filePath, `${field} image caption`) } : {}) }];
    }
    case 'html': issue(filePath, field, 'contains raw HTML, which is not allowed'); break;
    case 'space': return [];
    default: issue(filePath, field, `contains unsupported Markdown token ${token.type}`);
  }
  return [];
});

const blockNodes = (tokens, filePath, field) => (tokens ?? []).flatMap((token) => {
  switch (token.type) {
    case 'space': return [];
    case 'paragraph': return [{ type: 'paragraph', children: inlineNodes(token.tokens, filePath, field) }];
    case 'text': return [{ type: 'paragraph', children: inlineNodes(token.tokens, filePath, field) }];
    case 'heading':
      if (token.depth <= 2) issue(filePath, field, 'contains a nested level-two heading');
      return [{ type: 'heading', level: token.depth, children: inlineNodes(token.tokens, filePath, field) }];
    case 'code': return [{ type: 'codeBlock', language: token.lang || '', value: token.text }];
    case 'blockquote': return [{ type: 'blockquote', children: blockNodes(token.tokens, filePath, field) }];
    case 'list': return [{
      type: 'list',
      ordered: Boolean(token.ordered),
      start: token.start ?? 1,
      items: token.items.map((item) => ({ type: 'listItem', children: blockNodes(item.tokens, filePath, field) })),
    }];
    case 'html': issue(filePath, field, 'contains raw HTML, which is not allowed'); break;
    case 'image': issue(filePath, field, 'contains an image outside a paragraph'); break;
    default: issue(filePath, field, `contains unsupported Markdown token ${token.type}`);
  }
  return [];
});

const validateImageMetadata = (image, filePath) => {
  if (image == null) return;
  if (typeof image === 'string') issue(filePath, 'image', 'must include alt text');
  if (!image || typeof image !== 'object' || Array.isArray(image)) issue(filePath, 'image', 'must be an object');
  const unexpected = Object.keys(image).filter((key) => !['src', 'alt', 'caption'].includes(key));
  if (unexpected.length) issue(filePath, 'image', `contains unsupported fields: ${unexpected.join(', ')}`);
  nonEmptyString(image.src, filePath, 'image.src');
  nonEmptyString(image.alt, filePath, 'image.alt');
  if (image.caption !== undefined) nonEmptyString(image.caption, filePath, 'image.caption');
};

const parseFrontmatter = (data, filePath) => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) issue(filePath, 'frontmatter', 'must be an object');
  const id = nonEmptyString(data.id, filePath, 'id');
  if (!slugPattern.test(id)) issue(filePath, 'id', 'must contain lowercase letters, numbers, and hyphens only');
  const slug = data.slug == null ? id : nonEmptyString(data.slug, filePath, 'slug');
  if (!slugPattern.test(slug)) issue(filePath, 'slug', 'must contain lowercase letters, numbers, and hyphens only');
  const title = nonEmptyString(data.title, filePath, 'title');
  const summary = nonEmptyString(data.summary, filePath, 'summary');
  const category = data.category == null ? undefined : nonEmptyString(data.category, filePath, 'category');
  validateImageMetadata(data.image, filePath);
  const image = data.image;
  return { id, slug, title, summary, ...(category ? { category } : {}), ...(image ? { image: { src: image.src.trim(), alt: image.alt.trim(), ...(image.caption === undefined ? {} : { caption: image.caption.trim() }) } } : {}) };
};

const candidateIssue = (label, message) => { throw new Error(`${label}: ${message}`); };
const candidateObject = (value, keys, label) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) candidateIssue(label, 'must be an object');
  const unexpected = Object.keys(value).filter((key) => !keys.includes(key));
  if (unexpected.length) candidateIssue(label, `contains unsupported fields: ${unexpected.join(', ')}`);
};
const candidateString = (value, label) => {
  if (typeof value !== 'string') candidateIssue(label, 'must be a string');
};
const candidateNonEmptyString = (value, label) => {
  candidateString(value, label);
  if (value.trim() === '') candidateIssue(label, 'must be a non-empty string');
};
const candidateContainsImage = (nodes) => (nodes ?? []).some((node) => node.type === 'image' || candidateContainsImage(node.children));

const validateCandidateInline = (node, label) => {
  if (!node || typeof node !== 'object' || Array.isArray(node)) candidateIssue(label, 'must be an object');
  switch (node.type) {
    case 'text': candidateObject(node, ['type', 'value'], label); candidateString(node.value, `${label}.value`); break;
    case 'code': candidateObject(node, ['type', 'value'], label); candidateString(node.value, `${label}.value`); break;
    case 'break': candidateObject(node, ['type'], label); break;
    case 'strong':
    case 'emphasis':
    case 'delete':
      candidateObject(node, ['type', 'children'], label);
      validateCandidateInlineChildren(node.children, `${label}.children`);
      break;
    case 'link':
      candidateObject(node, ['type', 'href', 'children'], label);
      safeUrl(node.href, label, 'href');
      if (candidateContainsImage(node.children)) candidateIssue(label, 'cannot contain an image inside a link; image links are created automatically');
      validateCandidateInlineChildren(node.children, `${label}.children`);
      break;
    case 'image':
      candidateObject(node, ['type', 'src', 'alt', 'caption', 'width', 'height'], label);
      candidateNonEmptyString(node.src, `${label}.src`); candidateNonEmptyString(node.alt, `${label}.alt`);
      if (!/^\/assets\/case-studies\/[a-z0-9][a-z0-9._-]*$/.test(node.src) || !caseStudyImageFormatForPath(node.src)) candidateIssue(`${label}.src`, 'must use a safe public case-study image path ending in .png, .jpg, .jpeg, or .webp');
      if (node.caption !== undefined) candidateNonEmptyString(node.caption, `${label}.caption`);
      if (!Number.isSafeInteger(node.width) || node.width < 1) candidateIssue(`${label}.width`, 'must be a positive integer');
      if (!Number.isSafeInteger(node.height) || node.height < 1) candidateIssue(`${label}.height`, 'must be a positive integer');
      break;
    default: candidateIssue(label, `has unsupported inline node type ${node.type}`);
  }
};
const validateCandidateInlineChildren = (children, label) => {
  if (!Array.isArray(children) || children.length === 0) candidateIssue(label, 'must be a non-empty array');
  children.forEach((node, index) => validateCandidateInline(node, `${label}[${index}]`));
};
const validateCandidateBlocks = (nodes, label) => {
  if (!Array.isArray(nodes) || nodes.length === 0) candidateIssue(label, 'must be a non-empty array');
  nodes.forEach((node, index) => {
    const nodeLabel = `${label}[${index}]`;
    if (!node || typeof node !== 'object' || Array.isArray(node)) candidateIssue(nodeLabel, 'must be an object');
    switch (node.type) {
      case 'paragraph': candidateObject(node, ['type', 'children'], nodeLabel); validateCandidateInlineChildren(node.children, `${nodeLabel}.children`); break;
      case 'heading':
        candidateObject(node, ['type', 'level', 'children'], nodeLabel);
        if (!Number.isInteger(node.level) || node.level < 3 || node.level > 6) candidateIssue(`${nodeLabel}.level`, 'must be a subordinate heading level');
        validateCandidateInlineChildren(node.children, `${nodeLabel}.children`);
        break;
      case 'codeBlock': candidateObject(node, ['type', 'language', 'value'], nodeLabel); candidateString(node.language, `${nodeLabel}.language`); candidateString(node.value, `${nodeLabel}.value`); break;
      case 'blockquote': candidateObject(node, ['type', 'children'], nodeLabel); validateCandidateBlocks(node.children, `${nodeLabel}.children`); break;
      case 'list':
        candidateObject(node, ['type', 'ordered', 'start', 'items'], nodeLabel);
        if (typeof node.ordered !== 'boolean') candidateIssue(`${nodeLabel}.ordered`, 'must be a boolean');
        if (!((typeof node.start === 'number' && Number.isInteger(node.start)) || node.start === '')) candidateIssue(`${nodeLabel}.start`, 'must be an integer or empty string');
        if (!Array.isArray(node.items) || node.items.length === 0) candidateIssue(`${nodeLabel}.items`, 'must be a non-empty array');
        node.items.forEach((item, itemIndex) => {
          const itemLabel = `${nodeLabel}.items[${itemIndex}]`;
          candidateObject(item, ['type', 'children'], itemLabel);
          if (item.type !== 'listItem') candidateIssue(itemLabel, 'must be a list item');
          validateCandidateBlocks(item.children, `${itemLabel}.children`);
        });
        break;
      default: candidateIssue(nodeLabel, `has unsupported block node type ${node.type}`);
    }
  });
};

export const validatePreparedCaseStudies = (stories, label = 'candidate') => {
  if (!Array.isArray(stories) || stories.length === 0) candidateIssue(label, 'stories must be a non-empty array');
  const ids = new Set();
  const slugs = new Set();
  stories.forEach((story, index) => {
    const storyLabel = `${label}.stories[${index}]`;
    candidateObject(story, ['id', 'slug', 'title', 'summary', 'category', 'image', 'sections'], storyLabel);
    candidateString(story.id, `${storyLabel}.id`); candidateString(story.slug, `${storyLabel}.slug`);
    if (!slugPattern.test(story.id) || !slugPattern.test(story.slug)) candidateIssue(storyLabel, 'id and slug must be safe lowercase hyphenated values');
    if (ids.has(story.id)) candidateIssue(storyLabel, `id ${story.id} is duplicated`);
    if (slugs.has(story.slug)) candidateIssue(storyLabel, `slug ${story.slug} is duplicated`);
    ids.add(story.id); slugs.add(story.slug);
    candidateNonEmptyString(story.title, `${storyLabel}.title`); candidateNonEmptyString(story.summary, `${storyLabel}.summary`);
    if (story.category !== undefined) candidateNonEmptyString(story.category, `${storyLabel}.category`);
    if (story.image !== undefined) {
      candidateObject(story.image, ['src', 'alt', 'caption', 'width', 'height'], `${storyLabel}.image`);
      candidateNonEmptyString(story.image.src, `${storyLabel}.image.src`); candidateNonEmptyString(story.image.alt, `${storyLabel}.image.alt`);
      if (!/^\/assets\/case-studies\/[a-z0-9][a-z0-9._-]*$/.test(story.image.src) || !caseStudyImageFormatForPath(story.image.src)) candidateIssue(`${storyLabel}.image.src`, 'must use a safe public case-study image path ending in .png, .jpg, .jpeg, or .webp');
      if (story.image.caption !== undefined) candidateNonEmptyString(story.image.caption, `${storyLabel}.image.caption`);
      if (!Number.isSafeInteger(story.image.width) || story.image.width < 1) candidateIssue(`${storyLabel}.image.width`, 'must be a positive integer');
      if (!Number.isSafeInteger(story.image.height) || story.image.height < 1) candidateIssue(`${storyLabel}.image.height`, 'must be a positive integer');
    }
    if (!Array.isArray(story.sections) || story.sections.length !== PUBLIC_HEADINGS.length) candidateIssue(`${storyLabel}.sections`, 'must contain exactly the three public sections');
    story.sections.forEach((section, sectionIndex) => {
      const sectionLabel = `${storyLabel}.sections[${sectionIndex}]`;
      const [key, heading] = PUBLIC_HEADINGS[sectionIndex];
      candidateObject(section, ['key', 'heading', 'nodes'], sectionLabel);
      if (section.key !== key || section.heading !== heading) candidateIssue(sectionLabel, `must be ${heading}`);
      validateCandidateBlocks(section.nodes, `${sectionLabel}.nodes`);
      if (section.nodes.length === 0) candidateIssue(`${sectionLabel}.nodes`, 'must be non-empty');
    });
  });
  return stories;
};

export function parseMarkdownCaseStudy({ source, filePath = 'source.md' }) {
  if (typeof source !== 'string') issue(filePath, 'source', 'must be a string');
  source = source.replace(/^\uFEFF+/, '');
  if (!/^---\r?\n/.test(source)) issue(filePath, 'frontmatter', 'must start with the YAML delimiter (---)');
  let parsed;
  try { parsed = matter(source); } catch (error) { issue(filePath, 'frontmatter', `could not be parsed (${error.message})`); }
  const identity = parseFrontmatter(parsed.data, filePath);
  let tokens;
  try { tokens = marked.lexer(parsed.content, { gfm: true, breaks: false }); } catch (error) { issue(filePath, 'body', `could not be parsed (${error.message})`); }
  const sections = new Map();
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token.type !== 'heading' || token.depth !== 2) continue;
    const heading = token.text.trim();
    const match = PUBLIC_HEADINGS.find(([, expected]) => expected === heading);
    if (!match) continue;
    const [key, expectedHeading] = match;
    if (sections.has(key)) issue(filePath, expectedHeading, 'must appear exactly once');
    const body = [];
    for (let next = index + 1; next < tokens.length; next += 1) {
      if (tokens[next].type === 'heading' && tokens[next].depth === 2) break;
      body.push(tokens[next]);
    }
    const nodes = blockNodes(body, filePath, expectedHeading);
    if (!nodes.length) issue(filePath, expectedHeading, 'must contain Markdown content');
    sections.set(key, { key, heading: expectedHeading, nodes });
  }
  for (const [, heading] of PUBLIC_HEADINGS) {
    if (!sections.has(PUBLIC_HEADINGS.find(([, expected]) => expected === heading)[0])) issue(filePath, heading, 'is required exactly once');
  }
  const story = {
    ...identity,
    sections: PUBLIC_HEADINGS.map(([key]) => sections.get(key)),
  };
  return story;
}

const mapStoryAssets = (story, filePath, assetsRoot) => {
  const assets = {};
  const resolve = (media) => {
    const resolved = resolveCaseStudyAsset({ source: media.src, filePath, storyId: story.id, assetsRoot });
    assets[resolved.publicPath] = {
      source: resolved.source, bytes: resolved.bytes, sha256: resolved.sha256, width: resolved.width, height: resolved.height, format: resolved.format,
    };
    return { src: resolved.publicPath, alt: media.alt, ...(media.caption ? { caption: media.caption } : {}), width: resolved.width, height: resolved.height };
  };
  const mapInline = (nodes) => nodes.map((node) => ({
    ...node,
    ...(node.type === 'image' ? resolve(node) : {}),
    ...(node.children ? { children: mapInline(node.children) } : {}),
    ...(node.items ? { items: node.items.map((item) => ({ ...item, children: mapInline(item.children) })) } : {}),
  }));
  return { story: { ...story, ...(story.image ? { image: resolve(story.image) } : {}), sections: story.sections.map((section) => ({ ...section, nodes: mapInline(section.nodes) })) }, assets };
};

export function prepareMarkdownCaseStudies({ sourceFiles, outputDirectory, assetsRoot }) {
  if (!Array.isArray(sourceFiles) || sourceFiles.length === 0) throw new Error('Preparation requires at least one explicit --source file');
  if (typeof outputDirectory !== 'string' || outputDirectory.trim() === '') throw new Error('Preparation requires an output directory');
  const parsedSources = sourceFiles.map((filePath) => {
    let source;
    try { source = readFileSync(filePath, 'utf8'); } catch (error) { throw new Error(`${sourceLabel(filePath)}: source could not be read (${error.message})`); }
    return { filePath, story: parseMarkdownCaseStudy({ source, filePath }) };
  });
  const ids = new Set();
  const slugs = new Set();
  const firstById = new Map();
  const firstBySlug = new Map();
  for (const { filePath, story } of parsedSources) {
    if (ids.has(story.id)) throw new Error(`${sourceLabel(filePath)}: id ${story.id} is duplicated with ${sourceLabel(firstById.get(story.id))}`);
    if (slugs.has(story.slug)) throw new Error(`${sourceLabel(filePath)}: slug ${story.slug} is duplicated with ${sourceLabel(firstBySlug.get(story.slug))}`);
    ids.add(story.id); slugs.add(story.slug);
    firstById.set(story.id, filePath);
    firstBySlug.set(story.slug, filePath);
  }
  const stories = [];
  const assets = {};
  mkdirSync(outputDirectory, { recursive: true });
  const outputRoot = realpathSync(outputDirectory);
  const snapshotDirectory = path.join(outputRoot, 'assets');
  if (existsSync(snapshotDirectory) && lstatSync(snapshotDirectory).isSymbolicLink()) throw new Error('Candidate asset directory must not be a symlink');
  mkdirSync(snapshotDirectory, { recursive: true });
  if (realpathSync(snapshotDirectory) !== snapshotDirectory) throw new Error('Candidate asset directory must remain inside the preview output');
  const newSnapshots = [];
  try {
    for (const { filePath, story } of parsedSources) {
      const mapped = mapStoryAssets(story, filePath, assetsRoot ?? defaultAssetsRoot(filePath, story.id));
      stories.push(mapped.story);
      for (const [publicPath, asset] of Object.entries(mapped.assets)) {
        const extension = asset.format === 'jpeg' ? '.jpg' : `.${asset.format}`;
        const snapshotSource = path.posix.join('assets', `${asset.sha256}${extension}`);
        const snapshotPath = path.join(outputRoot, snapshotSource);
        mkdirSync(path.dirname(snapshotPath), { recursive: true });
        let snapshotInfo; try { snapshotInfo = lstatSync(snapshotPath); } catch (error) { if (error.code !== 'ENOENT') throw error; }
        if (snapshotInfo) {
          if (!snapshotInfo.isFile() || snapshotInfo.isSymbolicLink()) imageIssue(filePath, `candidate snapshot ${snapshotSource} must be a regular file`);
          if (assetDigest(readFileSync(snapshotPath)) !== asset.sha256) imageIssue(filePath, `candidate snapshot ${snapshotSource} has changed bytes`);
        } else { writeFileSync(snapshotPath, asset.bytes); newSnapshots.push(snapshotPath); }
        assets[publicPath] = { source: snapshotSource, sha256: asset.sha256, width: asset.width, height: asset.height, format: asset.format };
      }
    }
  } catch (error) {
    for (const snapshotPath of newSnapshots) rmSync(snapshotPath, { force: true });
    throw error;
  }
  try { validatePreparedCaseStudies(stories, 'prepared candidate'); } catch (error) { for (const snapshotPath of newSnapshots) rmSync(snapshotPath, { force: true }); throw error; }
  const candidate = `${JSON.stringify({ schemaVersion: 1, stories, assets }, null, 2)}\n`;
  const candidatePath = path.join(outputDirectory, 'candidate.json');
  const temporaryDirectory = mkdtempSync(path.join(outputDirectory, '.candidate-'));
  const temporaryPath = path.join(temporaryDirectory, 'candidate.json');
  try {
    writeFileSync(temporaryPath, candidate, 'utf8');
    if (!existsSync(candidatePath) || readFileSync(candidatePath, 'utf8') !== candidate) renameSync(temporaryPath, candidatePath);
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
  return { candidatePath, stories, assets };
}

export const readPreparedCaseStudies = (candidatePath) => {
  let candidate;
  try { candidate = JSON.parse(readFileSync(candidatePath, 'utf8')); } catch (error) { throw new Error(`Preview candidate could not be read: ${error.message}`); }
  if (candidate?.schemaVersion !== 1) throw new Error('Preview candidate has an unsupported schema version');
  return validatePreparedCaseStudies(candidate.stories, path.basename(candidatePath));
};
