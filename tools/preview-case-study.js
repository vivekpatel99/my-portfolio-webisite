import { createServer } from 'node:http';
import { readFileSync, realpathSync, lstatSync } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { imageSize } from 'image-size';
import React from 'react';
import { StaticRouter } from 'react-router-dom/server.js';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import CaseStudyCard from '../src/components/CaseStudyCard.js';
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
    <style>body{margin:0;background:#0c0d0d;color:#eeedf0;font-family:ui-sans-serif,system-ui,sans-serif}.preview-header,.preview-footer{padding:22px 6%;border-bottom:1px solid #29292d}.preview-header strong{font-size:16px;font-weight:500}.preview-header span{float:right;color:#a5a1ad;font-size:12px}.preview-footer{border-top:1px solid #29292d;border-bottom:0;color:#88848e;font-size:12px}@media(max-width:450px){.preview-header span{display:none}}</style>
  </head>
  <body>
    <header class="preview-header"><a href="/" style="color:inherit">All review candidates</a><span>Local case-study preview</span></header>
    ${renderToStaticMarkup(React.createElement(CaseStudyArticle, { story }))}
    <footer class="preview-footer">Local preview · This candidate is not published.</footer>
  </body>
</html>
`;

const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));

export const libraryPreviewPage = (stories) => `<!doctype html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow"><title>Case Studies · Vivek Patel</title><link rel="stylesheet" href="/preview.css">
<style>:root{--radius:0.5rem}body{background:#0c0d0d;color:#eee;font-family:ui-sans-serif,system-ui,sans-serif;margin:0}.library-wrap{max-width:1400px;margin:auto;padding:0 24px}.library-nav{height:88px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #ffffff10}.library-logo{font-size:30px;font-weight:800;letter-spacing:-5px}.library-logo span{color:#9360ff}.library-intro{padding:60px 0 42px}.library-eyebrow{display:inline-block;padding:6px 16px;border:1px solid #ffffff30;border-radius:30px;font-size:13px;letter-spacing:1px}.library-intro h1{font-size:clamp(34px,4vw,52px);font-weight:750;line-height:1.1;letter-spacing:-1.5px;margin:20px 0}.library-intro h1 span{color:#8b45ff}.library-intro p{color:#9ca3af;max-width:650px;line-height:1.7}.library-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:32px;padding-bottom:64px}.library-review{color:#a6a1ae;font-size:12px}.library-footer{border-top:1px solid #ffffff15;padding:25px 0;color:#9ca3af;font-size:13px}@media(max-width:1000px){.library-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:640px){.library-grid{grid-template-columns:1fr;gap:24px}.library-intro{padding-top:32px}.library-nav{height:72px}}</style></head><body><div class="library-wrap">
<header class="library-nav"><a href="/" aria-label="Vivek Patel home" class="library-logo">V<span>P</span></a><span class="library-review">LOCAL PREVIEW · ${stories.length} CASE STUDIES</span></header>
<main><section class="library-intro"><span class="library-eyebrow">PORTFOLIO</span><h1>SELECTED <span>CASE STUDIES</span></h1><p>From document extraction to intelligent workflows and computer vision. Explore the problem, the build, and the outcome.</p></section>
<div class="library-grid">${renderToStaticMarkup(React.createElement(StaticRouter, { location: '/' }, stories.map((story) => React.createElement(CaseStudyCard, { key: story.id, project: story }))))}</div></main>
<footer class="library-footer">Review candidates · Not published · Ranking comes after content review. Completion details need review where dates are absent.</footer></div></body></html>`;

export async function createCaseStudyPreviewServer({ stories, assets = {}, candidateDirectory, port = 4173 } = {}) {
  if (!previewIsAllowed()) throw new Error('Case-study preview is refused in CI or production');
  if (!Array.isArray(stories) || stories.length === 0) throw new Error('Case-study preview requires at least one prepared story');
  const previewCss = (await postcss([tailwindcss(path.resolve('tailwind.config.js'))]).process('@tailwind base; @tailwind components; @tailwind utilities;', { from: undefined })).css;
  const bySlug = new Map(stories.map((story) => [story.slug, story]));
  const referenced = new Set();
  const collect = (nodes) => (nodes ?? []).forEach((node) => { if (node.type === 'image') referenced.add(node.src); if (node.children) collect(node.children); if (node.items) node.items.forEach((item) => collect(item.children)); });
  stories.forEach((story) => { if (story.image) referenced.add(story.image.src); story.sections?.forEach((section) => collect(section.nodes)); });
  const server = createServer((request, response) => {
    if (request.method !== 'GET') { response.statusCode = 405; return response.end(); }
    let pathname;
    try { pathname = decodeURIComponent(new URL(request.url ?? '/', `http://${previewHost}`).pathname); } catch { response.statusCode = 400; return response.end('Bad request'); }
    if (pathname === '/preview.css') { response.setHeader('Content-Type', 'text/css'); return response.end(previewCss); }
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
    if (pathname === '/' && stories.length > 1) {
      response.setHeader('Content-Type', 'text/html; charset=utf-8');
      response.setHeader('Cache-Control', 'no-store');
      return response.end(libraryPreviewPage(stories));
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
