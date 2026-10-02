import { createHash } from 'node:crypto';
import { lstatSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { imageSize } from 'image-size';
import { compileCaseStudyPublication, renderPublicCaseStudyModule } from '../publication/compile-case-studies.js';
import { caseStudyThumbnailRegistry } from '../publication/case-study-derivatives.js';

const normalize = (value) => path.resolve(value).split(path.sep).join('/');
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const IMAGE_EXTENSION = /\.(?:avif|jpe?g|png|webp)$/i;
const MAX_DISPLAY_BYTES = 100_000;
const assertRegularAsset = (assetPath, publicPath) => {
  const info = lstatSync(assetPath);
  if (!info.isFile() || info.isSymbolicLink()) throw new Error(`Case-study delivery asset must be a regular file: ${publicPath}`);
};
export const assertThumbnailDimensions = (dimensions, thumbnailPath) => {
  if (String(dimensions.type).toLowerCase() !== 'jpg' || dimensions.width > 320 || dimensions.height > 320) {
    throw new Error(`Case-study thumbnail must be a JPEG no larger than 320px on either edge: ${thumbnailPath}`);
  }
};
export const assertThumbnailFilenameHash = (thumbnailPath, thumbnailSha256) => {
  const filenameHash = path.posix.basename(thumbnailPath).match(/-thumb-([a-f0-9]{12})\.jpg$/i)?.[1]?.toLowerCase();
  if (filenameHash !== thumbnailSha256.slice(0, 12)) throw new Error(`Case-study thumbnail filename must contain its derivative hash: ${thumbnailPath}`);
};
export const assertDisplayDimensions = (dimensions, displayPath, display) => {
  if (String(dimensions.type).toLowerCase() !== 'webp') {
    throw new Error(`Case-study display derivative must be WebP: ${displayPath}`);
  }
  if (dimensions.width !== display.width || dimensions.height !== display.height) {
    throw new Error(`Case-study display derivative dimensions do not match its registry: ${displayPath}`);
  }
};
export const assertDisplayFilenameHash = (displayPath, sourceSha256, displaySha256) => {
  const hashes = path.posix.basename(displayPath)
    .match(/^case-study-display-([a-f0-9]{12})-([a-f0-9]{12})\.webp$/i)
    ?.slice(1)
    .map((value) => value.toLowerCase());
  if (hashes?.[0] !== sourceSha256.slice(0, 12) || hashes?.[1] !== displaySha256.slice(0, 12)) {
    throw new Error(`Case-study display filename must contain its source and derivative hashes: ${displayPath}`);
  }
};
export const assertCaseStudyBinding = (publicDirectory, sourcePath, { requireDisplay = false } = {}) => {
  const entry = caseStudyThumbnailRegistry[sourcePath];
  if (!entry) {
    if (requireDisplay) throw new Error(`Published case-study image has no display derivative binding: ${sourcePath}`);
    return;
  }
  const sourceFile = path.join(publicDirectory, sourcePath.replace(/^\//, ''));
  assertRegularAsset(sourceFile, sourcePath);
  const sourceBytes = readFileSync(sourceFile);
  if (digest(sourceBytes) !== entry.sourceSha256) throw new Error(`Case-study source changed without updating its derivative registry: ${sourcePath}`);

  const thumbnailPath = entry.src;
  const thumbnailFile = path.join(publicDirectory, thumbnailPath.replace(/^\//, ''));
  assertThumbnailFilenameHash(thumbnailPath, entry.thumbnailSha256);
  assertRegularAsset(thumbnailFile, thumbnailPath);
  const thumbnailBytes = readFileSync(thumbnailFile);
  if (digest(thumbnailBytes) !== entry.thumbnailSha256) throw new Error(`Case-study thumbnail changed without updating its registry: ${thumbnailPath}`);
  let thumbnailDimensions;
  try { thumbnailDimensions = imageSize(thumbnailBytes); } catch { throw new Error(`Case-study thumbnail is not a valid image: ${thumbnailPath}`); }
  assertThumbnailDimensions(thumbnailDimensions, thumbnailPath);

  if (!entry.display) {
    if (requireDisplay) throw new Error(`Published case-study image has no display derivative binding: ${sourcePath}`);
    return;
  }
  const displayPath = entry.display.src;
  const displayFile = path.join(publicDirectory, displayPath.replace(/^\//, ''));
  assertDisplayFilenameHash(displayPath, entry.sourceSha256, entry.display.sha256);
  assertRegularAsset(displayFile, displayPath);
  const displayBytes = readFileSync(displayFile);
  if (displayBytes.byteLength > MAX_DISPLAY_BYTES) throw new Error(`Case-study display derivative exceeds ${MAX_DISPLAY_BYTES} bytes: ${displayPath}`);
  if (digest(displayBytes) !== entry.display.sha256) throw new Error(`Case-study display derivative changed without updating its registry: ${displayPath}`);
  let displayDimensions;
  try { displayDimensions = imageSize(displayBytes); } catch { throw new Error(`Case-study display derivative is not a valid image: ${displayPath}`); }
  assertDisplayDimensions(displayDimensions, displayPath, entry.display);
};
const referencedAssetUrls = (publication) => publication.flatMap((record) => {
  const urls = [record.image, ...(record.gallery ?? [])]
    .flatMap((media) => [media?.src, media?.poster].filter(Boolean));
  const walk = (nodes) => (nodes ?? []).forEach((node) => {
    if (node.type === 'image') urls.push(node.src);
    if (node.children) walk(node.children);
    if (node.items) node.items.forEach((item) => walk(item.children));
  });
  (record.sections ?? []).forEach((section) => walk(section.nodes));
  return urls;
});
const referencedImageUrls = (publication) => referencedAssetUrls(publication).filter((url) => IMAGE_EXTENSION.test(url));
const referencedDeliveryUrls = (publication) => {
  const referenced = referencedAssetUrls(publication);
  return new Set([
    ...referenced,
    ...referenced.map((publicPath) => caseStudyThumbnailRegistry[publicPath]?.src).filter(Boolean),
    ...referenced.map((publicPath) => caseStudyThumbnailRegistry[publicPath]?.display?.src).filter(Boolean),
  ]);
};

const copyPublicFiles = (plugin, directory, relative = '') => {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const nextRelative = path.posix.join(relative, entry.name);
    const source = path.join(directory, entry.name);
    if (nextRelative === '.htaccess' || nextRelative === 'sitemap.xml' || nextRelative === 'assets/case-studies' || nextRelative.startsWith('assets/case-studies/')) continue;
    if (entry.isSymbolicLink()) throw new Error(`Public output must not copy symlinks: ${nextRelative}`);
    if (entry.isDirectory()) copyPublicFiles(plugin, source, nextRelative);
    else if (entry.isFile()) plugin.emitFile({ type: 'asset', fileName: nextRelative, source: readFileSync(source) });
    else throw new Error(`Public output must only copy regular files: ${nextRelative}`);
  }
};

export const deploymentHtaccess = (template, slugs) => {
  const rule = slugs.length > 0
    ? `  RewriteRule ^project/(${slugs.join('|')})/?$ index.html [L]`
    : '  RewriteRule ^project/ - [R=404,L]';
  const projectRules = [...template.matchAll(/^\s*RewriteRule\s+\^project\/.*$/gm)];
  if (projectRules.length !== 1) throw new Error('Deployment template must contain exactly one case-study allowlist rule');
  return template.replace(projectRules[0][0], rule);
};

export default function caseStudyPublicationPlugin({ root = process.cwd() } = {}) {
  const projectRoot = path.resolve(root);
  const publicProjection = normalize(path.join(projectRoot, 'publication/public-case-studies.js'));
  return {
    name: 'case-study-publication-boundary',
    enforce: 'pre',
    load(id) {
      if (normalize(id) !== publicProjection) return null;
      return renderPublicCaseStudyModule(compileCaseStudyPublication({ root: projectRoot }));
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        let pathname;
        try { pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname); } catch { return next(); }
        if (pathname === '/sitemap.xml') {
          response.statusCode = 404;
          return response.end();
        }
        try {
          const rawCaseStudyAlias = pathname.startsWith('/public/assets/case-studies/')
            || (pathname.startsWith('/@fs/') && pathname.includes('/public/assets/case-studies/'));
          if (pathname.startsWith('/assets/case-studies/') || rawCaseStudyAlias) {
            const publication = compileCaseStudyPublication({ root: projectRoot });
            const referenced = referencedDeliveryUrls(publication);
            if (rawCaseStudyAlias || !referenced.has(pathname)) {
              response.statusCode = 404;
              return response.end();
            }
            const referencedImages = referencedImageUrls(publication);
            for (const sourcePath of referencedImages) {
              const binding = caseStudyThumbnailRegistry[sourcePath];
              if (sourcePath === pathname || binding?.src === pathname || binding?.display?.src === pathname) {
                assertCaseStudyBinding(path.join(projectRoot, 'public'), sourcePath, { requireDisplay: true });
              }
            }
          }
          next();
        } catch (error) { next(error); }
      });
    },
    handleHotUpdate({ file, server }) {
      if (!normalize(file).startsWith(normalize(path.join(projectRoot, 'publication')))) return;
      const module = server.moduleGraph.getModuleById(publicProjection);
      if (module) {
        server.moduleGraph.invalidateModule(module);
        return [module];
      }
    },
    generateBundle() {
      const publicDirectory = path.join(projectRoot, 'public');
      const caseStudyDirectory = path.join(publicDirectory, 'assets/case-studies');
      const caseStudyDirectoryInfo = lstatSync(caseStudyDirectory);
      if (!caseStudyDirectoryInfo.isDirectory()) throw new Error('Case-study asset directory must be a real directory');
      for (const entry of readdirSync(caseStudyDirectory, { withFileTypes: true })) {
        if (!entry.isFile()) throw new Error(`Case-study asset directory must contain only regular files: ${entry.name}`);
      }
      copyPublicFiles(this, publicDirectory);
      const publication = compileCaseStudyPublication({ root: projectRoot });
      for (const sourcePath of referencedImageUrls(publication)) {
        assertCaseStudyBinding(publicDirectory, sourcePath, { requireDisplay: true });
      }
      const referencedAssets = referencedDeliveryUrls(publication);
      for (const publicPath of referencedAssets) {
        const relative = publicPath.replace(/^\//, '');
        const assetPath = path.join(publicDirectory, relative);
        assertRegularAsset(assetPath, publicPath);
        this.emitFile({ type: 'asset', fileName: relative, source: readFileSync(assetPath) });
      }
      const template = readFileSync(path.join(publicDirectory, '.htaccess'), 'utf8');
      this.emitFile({ type: 'asset', fileName: '.htaccess', source: deploymentHtaccess(template, publication.map((record) => record.slug)) });
    },
  };
}
