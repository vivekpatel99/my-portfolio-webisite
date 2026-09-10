import { createServer } from 'node:http';
import { readFileSync, realpathSync, lstatSync } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { imageSize } from 'image-size';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import CaseStudyArticle from '../src/components/CaseStudyArticle.js';
import { prepareMarkdownCaseStudies, readPreparedCaseStudies } from '../publication/markdown-case-study.js';
import { assertLocalPreviewDirectory } from './preview-path.js';

const previewHost = '127.0.0.1';
const defaultOutputDirectory = path.resolve('.case-study-preview');
const articleCss = readFileSync(new URL('../src/components/CaseStudyArticle.css', import.meta.url), 'utf8');

export const previewIsAllowed = (environment = process.env) => !environment.CI && environment.NODE_ENV !== 'production';

const page = (story) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title>${escapeHtml(story.title)} · Local preview</title>
    <style>${articleCss}</style>
    <style>body{margin:0;background:#0c0d0d;color:#eeedf0;font-family:Arial,Helvetica,sans-serif}.preview-header,.preview-footer{padding:22px 6%;border-bottom:1px solid #29292d}.preview-header strong{font-size:16px;font-weight:500}.preview-header span{float:right;color:#a5a1ad;font-size:12px}.preview-footer{border-top:1px solid #29292d;border-bottom:0;color:#88848e;font-size:12px}@media(max-width:450px){.preview-header span{display:none}}</style>
  </head>
  <body>
    <header class="preview-header"><strong>Vivek Patel</strong><span>Local case-study preview</span></header>
    ${renderToStaticMarkup(React.createElement(CaseStudyArticle, { story }))}
    <footer class="preview-footer">Local preview · This candidate is not published.</footer>
  </body>
</html>
`;

const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));

export function createCaseStudyPreviewServer({ stories, assets = {}, candidateDirectory, port = 4173 } = {}) {
  if (!previewIsAllowed()) throw new Error('Case-study preview is refused in CI or production');
  if (!Array.isArray(stories) || stories.length === 0) throw new Error('Case-study preview requires at least one prepared story');
  const bySlug = new Map(stories.map((story) => [story.slug, story]));
  const referenced = new Set();
  const collect = (nodes) => (nodes ?? []).forEach((node) => { if (node.type === 'image') referenced.add(node.src); if (node.children) collect(node.children); if (node.items) node.items.forEach((item) => collect(item.children)); });
  stories.forEach((story) => { if (story.image) referenced.add(story.image.src); story.sections?.forEach((section) => collect(section.nodes)); });
  const server = createServer((request, response) => {
    if (request.method !== 'GET') { response.statusCode = 405; return response.end(); }
    let pathname;
    try { pathname = decodeURIComponent(new URL(request.url ?? '/', `http://${previewHost}`).pathname); } catch { response.statusCode = 400; return response.end('Bad request'); }
    if (pathname.startsWith('/assets/case-studies/')) {
      const asset = assets[pathname];
      if (!referenced.has(pathname) || !candidateDirectory || !asset || typeof asset.source !== 'string' || path.isAbsolute(asset.source) || asset.source.includes('\\') || asset.source.split('/').includes('..')) { response.statusCode = 404; return response.end('Not found'); }
      try {
        const candidateRoot = realpathSync(path.resolve(candidateDirectory));
        const realSource = realpathSync(path.resolve(candidateRoot, ...asset.source.split('/')));
        if (!realSource.startsWith(`${candidateRoot}${path.sep}`) || !lstatSync(realSource).isFile()) throw new Error('outside candidate');
        const bytes = readFileSync(realSource);
        if (createHash('sha256').update(bytes).digest('hex') !== asset.sha256) throw new Error('changed candidate asset');
        const dimensions = imageSize(bytes);
        if (dimensions.width !== asset.width || dimensions.height !== asset.height) throw new Error('changed candidate dimensions');
        response.statusCode = 200;
        response.setHeader('Content-Type', asset.format === 'png' ? 'image/png' : asset.format === 'jpeg' ? 'image/jpeg' : 'image/webp');
        return response.end(bytes);
      } catch { response.statusCode = 404; return response.end('Not found'); }
    }
    const projectMatch = pathname.match(/^\/project\/([^/]+)\/?$/);
    const story = pathname === '/' ? stories[0] : projectMatch ? bySlug.get(projectMatch[1]) : undefined;
    if (!story) { response.statusCode = 404; return response.end('Not found'); }
    response.statusCode = 200;
    response.setHeader('Content-Type', 'text/html; charset=utf-8');
    response.setHeader('Cache-Control', 'no-store');
    return response.end(page(story));
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, previewHost, () => resolve(server));
  });
}

const argumentValues = (argumentsList, name) => argumentsList.flatMap((value, index) => value === name && argumentsList[index + 1] ? [argumentsList[index + 1]] : []);
const oneArgument = (argumentsList, name, fallback) => argumentValues(argumentsList, name)[0] ?? fallback;

export async function runPreview(argumentsList = process.argv.slice(2)) {
  if (!previewIsAllowed()) throw new Error('Case-study preview is refused in CI or production');
  const outputDirectory = assertLocalPreviewDirectory(oneArgument(argumentsList, '--out', defaultOutputDirectory));
  const sourceFiles = argumentValues(argumentsList, '--source');
  const assetsRoot = oneArgument(argumentsList, '--assets-root');
  const candidatePath = oneArgument(argumentsList, '--candidate', path.join(outputDirectory, 'candidate.json'));
  const prepared = sourceFiles.length > 0
    ? prepareMarkdownCaseStudies({ sourceFiles, outputDirectory, assetsRoot })
    : (() => { const candidate = JSON.parse(readFileSync(candidatePath, 'utf8')); return { candidatePath, stories: readPreparedCaseStudies(candidatePath), assets: candidate.assets ?? {} }; })();
  const { stories, assets = {} } = prepared;
  const port = Number(oneArgument(argumentsList, '--port', '4173'));
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('--port must be a valid TCP port');
  const server = await createCaseStudyPreviewServer({ stories, assets, candidateDirectory: path.dirname(prepared.candidatePath), port });
  console.log(`Case-study preview: http://${previewHost}:${port}/`);
  console.log('Preview is loopback-only, noindex, and excluded from production inputs. Press Ctrl-C to stop.');
  return server;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runPreview().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
