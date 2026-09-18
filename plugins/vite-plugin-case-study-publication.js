import { createHash } from 'node:crypto';
import { lstatSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { imageSize } from 'image-size';
import { compileCaseStudyPublication, renderPublicCaseStudyModule } from '../publication/compile-case-studies.js';
import { caseStudyThumbnailRegistry } from '../src/lib/caseStudyThumbnails.js';

const normalize = (value) => path.resolve(value).split(path.sep).join('/');
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const thumbnailSourceFor = (thumbnailPath) => Object.entries(caseStudyThumbnailRegistry)
  .find(([, entry]) => entry.src === thumbnailPath)?.[0];
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
export const assertThumbnailBinding = (publicDirectory, thumbnailPath) => {
  const sourcePath = thumbnailSourceFor(thumbnailPath);
  if (!sourcePath) return;
  const entry = caseStudyThumbnailRegistry[sourcePath];
  assertThumbnailFilenameHash(thumbnailPath, entry.thumbnailSha256);
  const sourceFile = path.join(publicDirectory, sourcePath.replace(/^\//, ''));
  const thumbnailFile = path.join(publicDirectory, thumbnailPath.replace(/^\//, ''));
  assertRegularAsset(sourceFile, sourcePath);
  assertRegularAsset(thumbnailFile, thumbnailPath);
  const sourceBytes = readFileSync(sourceFile);
  const thumbnailBytes = readFileSync(thumbnailFile);
  if (digest(sourceBytes) !== entry.sourceSha256) throw new Error(`Case-study thumbnail source changed without updating its registry: ${sourcePath}`);
  if (digest(thumbnailBytes) !== entry.thumbnailSha256) throw new Error(`Case-study thumbnail changed without updating its registry: ${thumbnailPath}`);
  let dimensions;
  try { dimensions = imageSize(thumbnailBytes); } catch { throw new Error(`Case-study thumbnail is not a valid image: ${thumbnailPath}`); }
  assertThumbnailDimensions(dimensions, thumbnailPath);
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
const referencedDeliveryUrls = (publication) => {
  const referenced = referencedAssetUrls(publication);
  return new Set([
    ...referenced,
    ...referenced.map((publicPath) => caseStudyThumbnailRegistry[publicPath]?.src).filter(Boolean),
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
            assertThumbnailBinding(path.join(projectRoot, 'public'), pathname);
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
      const referencedAssets = referencedDeliveryUrls(publication);
      for (const publicPath of referencedAssets) {
        const relative = publicPath.replace(/^\//, '');
        const assetPath = path.join(publicDirectory, relative);
        assertRegularAsset(assetPath, publicPath);
        assertThumbnailBinding(publicDirectory, publicPath);
        this.emitFile({ type: 'asset', fileName: relative, source: readFileSync(assetPath) });
      }
      const template = readFileSync(path.join(publicDirectory, '.htaccess'), 'utf8');
      this.emitFile({ type: 'asset', fileName: '.htaccess', source: deploymentHtaccess(template, publication.map((record) => record.slug)) });
    },
  };
}
