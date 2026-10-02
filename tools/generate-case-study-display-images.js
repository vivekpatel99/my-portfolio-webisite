import { createHash } from 'node:crypto';
import { copyFileSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { compileCaseStudyPublication, repositoryRoot } from '../publication/compile-case-studies.js';
import { caseStudyThumbnailRegistry } from '../publication/case-study-derivatives.js';

export const MAX_DISPLAY_BYTES = 100_000;
const LANDSCAPE_SHORT_EDGE = 600;
const PORTRAIT_WIDTH = 720;
const QUALITY_STEPS = [86, 84, 82, 80, 78, 76, 74, 72, 70, 68, 66, 64, 62, 60];
const IMAGE_EXTENSION = /\.(?:avif|jpe?g|png|webp)$/i;
const reviewedProfilesBySourceHash = Object.freeze({
  // Resampling this workflow's 2448x684 dot grid erases the pattern at card size.
  // Preserve its natural dimensions while converting the approved PNG to bounded WebP.
  'f36fee637d46a13baffb79337b87cb4ac1f7a1a6d29a330be71e4217a1633275': Object.freeze({
    resize: false,
    webp: Object.freeze({ quality: 59, nearLossless: true, effort: 6 }),
  }),
});

sharp.cache(false);
sharp.concurrency(1);
sharp.simd(false);

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

export const caseStudyImageSources = (publication) => {
  const sources = [];
  const add = (media) => {
    if (media?.src && IMAGE_EXTENSION.test(media.src)) sources.push(media.src);
    if (media?.poster && IMAGE_EXTENSION.test(media.poster)) sources.push(media.poster);
  };
  const visit = (nodes = []) => nodes.forEach((node) => {
    if (node.type === 'image' || node.type === 'video') add(node);
    if (node.children) visit(node.children);
    if (node.items) node.items.forEach((item) => visit(item.children));
  });
  publication.forEach((record) => {
    add(record.image);
    record.gallery?.forEach(add);
    record.sections?.forEach((section) => visit(section.nodes));
  });
  return [...new Set(sources)];
};

export const encodeCaseStudyDisplay = async (sourceBytes) => {
  const metadata = await sharp(sourceBytes, { failOn: 'error' }).metadata();
  if (!(metadata.width > 0 && metadata.height > 0)) throw new Error('Cannot read case-study source dimensions');
  const reviewedProfile = reviewedProfilesBySourceHash[sha256(sourceBytes)];
  if (reviewedProfile) {
    const source = sharp(sourceBytes, { failOn: 'error' });
    const encoder = reviewedProfile.resize ? source.resize(reviewedProfile.resize) : source;
    const { data, info } = await encoder
      .webp(reviewedProfile.webp)
      .toBuffer({ resolveWithObject: true });
    if (data.byteLength > MAX_DISPLAY_BYTES) {
      throw new Error(`Reviewed case-study display profile exceeds the ${MAX_DISPLAY_BYTES}-byte limit`);
    }
    return { data, quality: reviewedProfile.webp.quality, width: info.width, height: info.height };
  }
  const resize = metadata.width < metadata.height
    ? { width: PORTRAIT_WIDTH }
    : { height: LANDSCAPE_SHORT_EDGE };

  for (const quality of QUALITY_STEPS) {
    const { data, info } = await sharp(sourceBytes, { failOn: 'error' })
      .resize({
        ...resize,
        withoutEnlargement: true,
        fastShrinkOnLoad: false,
        kernel: sharp.kernel.lanczos3,
      })
      .webp({
        quality,
        alphaQuality: 100,
        effort: 6,
        smartSubsample: true,
        preset: 'text',
      })
      .toBuffer({ resolveWithObject: true });
    if (data.byteLength <= MAX_DISPLAY_BYTES) {
      return { data, quality, width: info.width, height: info.height };
    }
  }
  throw new Error(`Case-study display image cannot meet the ${MAX_DISPLAY_BYTES}-byte limit`);
};

const assertRegularFile = (file, publicPath) => {
  const info = lstatSync(file);
  if (!info.isFile() || info.isSymbolicLink()) throw new Error(`Case-study display asset must be a regular file: ${publicPath}`);
};

const assertRegisteredSource = (registry, sourcePath, sourceSha256) => {
  const entry = registry[sourcePath];
  if (!entry?.display) throw new Error(`Published case-study image has no display derivative binding: ${sourcePath}`);
  if (entry.sourceSha256 !== sourceSha256) throw new Error(`Case-study source changed without regenerating its display derivative: ${sourcePath}`);
  return entry;
};

const assertGeneratedBinding = ({ publicDirectory, sourcePath, sourceSha256, derivative, registry }) => {
  const entry = assertRegisteredSource(registry, sourcePath, sourceSha256);
  const expectedPath = `/assets/case-studies/case-study-display-${sourceSha256.slice(0, 12)}-${derivative.displaySha256.slice(0, 12)}.webp`;
  if (entry.display.src !== expectedPath) throw new Error(`Case-study display filename is stale: ${sourcePath}`);
  if (entry.display.sha256 !== derivative.displaySha256) throw new Error(`Case-study display hash is stale: ${sourcePath}`);
  if (entry.display.width !== derivative.displayWidth || entry.display.height !== derivative.displayHeight) {
    throw new Error(`Case-study display dimensions are stale: ${sourcePath}`);
  }
  const committedFile = path.join(publicDirectory, entry.display.src.replace(/^\//, ''));
  assertRegularFile(committedFile, entry.display.src);
  const committedBytes = readFileSync(committedFile);
  if (!committedBytes.equals(derivative.data)) {
    throw new Error(`Committed case-study display derivative does not match regenerated bytes: ${entry.display.src}`);
  }
};

export const generateCaseStudyDisplayImages = async ({
  root = repositoryRoot,
  publication = compileCaseStudyPublication({ root }),
  registry = caseStudyThumbnailRegistry,
  mode = 'check',
  temporaryDirectoryParent = os.tmpdir(),
} = {}) => {
  if (!['check', 'report', 'write'].includes(mode)) throw new Error(`Unsupported case-study display generator mode: ${mode}`);
  const projectRoot = path.resolve(root);
  const publicDirectory = path.join(projectRoot, 'public');
  const assetDirectory = path.join(publicDirectory, 'assets/case-studies');
  const tempParent = path.resolve(temporaryDirectoryParent);
  mkdirSync(tempParent, { recursive: true });
  const temporaryDirectory = mkdtempSync(path.join(tempParent, 'case-study-display-'));

  try {
    const derivatives = new Map();
    const bindings = [];
    for (const sourcePath of caseStudyImageSources(publication)) {
      const sourceFile = path.resolve(publicDirectory, `.${sourcePath}`);
      if (!sourceFile.startsWith(`${publicDirectory}${path.sep}`)) throw new Error(`Invalid case-study source path: ${sourcePath}`);
      assertRegularFile(sourceFile, sourcePath);
      const sourceBytes = readFileSync(sourceFile);
      const sourceSha256 = sha256(sourceBytes);
      if (mode === 'check') assertRegisteredSource(registry, sourcePath, sourceSha256);
      let derivative = derivatives.get(sourceSha256);

      if (!derivative) {
        const encoded = await encodeCaseStudyDisplay(sourceBytes);
        const displaySha256 = sha256(encoded.data);
        const filename = `case-study-display-${sourceSha256.slice(0, 12)}-${displaySha256.slice(0, 12)}.webp`;
        const temporaryFile = path.join(temporaryDirectory, filename);
        writeFileSync(temporaryFile, encoded.data);
        derivative = {
          data: encoded.data,
          temporaryFile,
          displayPath: `/assets/case-studies/${filename}`,
          displaySha256,
          displayWidth: encoded.width,
          displayHeight: encoded.height,
          displayBytes: encoded.data.byteLength,
          quality: encoded.quality,
        };
        derivatives.set(sourceSha256, derivative);
        if (mode === 'write') copyFileSync(temporaryFile, path.join(assetDirectory, filename));
      }

      if (mode === 'check') {
        assertGeneratedBinding({ publicDirectory, sourcePath, sourceSha256, derivative, registry });
      }
      bindings.push({
        sourcePath,
        sourceSha256,
        displayPath: derivative.displayPath,
        displaySha256: derivative.displaySha256,
        displayWidth: derivative.displayWidth,
        displayHeight: derivative.displayHeight,
        displayBytes: derivative.displayBytes,
        quality: derivative.quality,
      });
    }

    return { mode, uniqueAssets: derivatives.size, bindings };
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
};

const argumentValue = (name) => {
  const index = process.argv.indexOf(name);
  if (index === -1) return undefined;
  const value = process.argv[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`${name} requires a path`);
  return value;
};

const isMain = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) {
  const write = process.argv.includes('--write');
  const check = process.argv.includes('--check');
  if (write && check) throw new Error('Use either --write or --check, not both');
  const mode = write ? 'write' : check ? 'check' : 'report';
  const result = await generateCaseStudyDisplayImages({
    mode,
    temporaryDirectoryParent: argumentValue('--temp-directory') ?? os.tmpdir(),
  });
  if (mode === 'check') {
    process.stdout.write(`Verified ${result.uniqueAssets} regenerated display derivatives for ${result.bindings.length} published image sources.\n`);
  } else {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  }
}
