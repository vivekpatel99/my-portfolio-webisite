// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import postcss from 'postcss';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import CaseStudyArticle from '../src/components/CaseStudyArticle.js';
import { parseMarkdownCaseStudy } from '../publication/markdown-case-study.js';
import { createCaseStudyPreviewServer, previewIsAllowed } from './preview-case-study.js';
import { assertLocalPreviewDirectory } from './preview-path.js';

const story = parseMarkdownCaseStudy({
  filePath: 'fixture.md',
  source: `---
id: fixture-preview
title: Preview story
summary: A text-only story.
---
## The problem
The **problem** is clear.
## What I built
- A small list.
## The outcome
The \`outcome\` is qualitative.
`,
});

describe('case-study preview renderer', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('serves the shared card styles in the local candidate library without the application entry point', async () => {
    vi.stubEnv('CI', '');
    vi.stubEnv('NODE_ENV', 'development');
    const server = await createCaseStudyPreviewServer({
      stories: [story, { ...story, id: 'second-preview', slug: 'second-preview', title: 'Second preview' }],
      port: 0,
    });
    try {
      const origin = `http://127.0.0.1:${server.address().port}`;
      const html = await (await fetch(origin)).text();
      expect(html).toContain('href="/preview.css"');
      expect(html).toContain('card detection-panel relative');
      expect(html).toContain('detection-label cat');
      const response = await fetch(`${origin}/preview.css`);
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('text/css');
      const css = postcss.parse(await response.text());
      const declarations = (selector) => {
        const result = {};
        css.walkRules(selector, (rule) => rule.walkDecls((declaration) => { result[declaration.prop] = declaration.value; }));
        return result;
      };
      expect(declarations('.detection-panel::before').background).toContain('linear-gradient');
      expect(declarations('.detection-label')).toMatchObject({ position: 'absolute', top: '0', 'pointer-events': 'none' });
      expect(declarations('.overflow-hidden').overflow).toBe('hidden');
      const article = await (await fetch(`${origin}/project/${story.slug}/`)).text();
      expect(article).toContain('href="/preview.css"');
      expect(declarations('.detection-action')['min-height']).toBe('56px');
    } finally {
      await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
  });

  it('renders the shared article with optional fields omitted cleanly', () => {
    const html = renderToStaticMarkup(React.createElement(CaseStudyArticle, { story }));
    expect(html).toContain('<article class="case-study-article">');
    expect(html).toContain('<h1>Preview story</h1>');
    expect(html).toContain('<h2>The problem</h2>');
    expect(html).toContain('<strong>problem</strong>');
    expect(html).toContain('<code>outcome</code>');
    expect(html).toContain('href="/#portfolio"');
    expect(html).toContain('href="/contact/"');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('undefined');
  });

  it('moves an approved inline image and its caption into the top gallery', () => {
    const imageStory = structuredClone(story);
    imageStory.sections[1].nodes.push({
      type: 'paragraph',
      children: [{
        type: 'image', src: '/assets/case-studies/fixture.webp', alt: 'Workflow diagram',
        width: 1200, height: 800, caption: 'Reviewed workflow caption',
      }],
    });
    const html = renderToStaticMarkup(React.createElement(CaseStudyArticle, { story: imageStory }));
    expect(html).toContain('<figcaption>Reviewed workflow caption</figcaption>');
    expect(html.match(/<img /g)).toHaveLength(1);
    expect(html).not.toContain('case-study-inline-image-link');
    expect(html).toContain('Reviewed workflow caption');
  });

  it('keeps the heading for a section containing only a gallery image', () => {
    const imageStory = structuredClone(story);
    imageStory.sections[1].nodes = [{
      type: 'paragraph',
      children: [{
        type: 'image', src: '/assets/case-studies/fixture.webp', alt: 'Workflow diagram',
        width: 1200, height: 800,
      }],
    }];
    const html = renderToStaticMarkup(React.createElement(CaseStudyArticle, { story: imageStory }));
    expect(html).toContain('<h2>What I built</h2>');
    expect(html).toContain('src="/assets/case-studies/fixture.webp"');
  });

  it('allows local development but refuses CI and production environments', () => {
    expect(previewIsAllowed({})).toBe(true);
    expect(previewIsAllowed({ CI: '1' })).toBe(false);
    expect(previewIsAllowed({ NODE_ENV: 'production' })).toBe(false);
  });

  it('keeps candidate output inside the ignored preview directory', () => {
    expect(() => assertLocalPreviewDirectory('public')).toThrow(/must stay under/);
    expect(() => assertLocalPreviewDirectory('dist')).toThrow(/must stay under/);
    expect(assertLocalPreviewDirectory('.case-study-preview/test-output')).toContain('.case-study-preview/test-output');
  });
});

 it('removes an empty screenshot heading when its images move to the gallery', () => {
  const image = { type: 'image', src: '/screenshot.png', alt: 'Sample project screenshot', width: 800, height: 600 };
  const heading = (value) => ({ type: 'heading', level: 3, children: [{ type: 'text', value }] });
  const article = { ...story, sections: [{ key: 'outcome', heading: 'The outcome', nodes: [
    heading('Useful details'),
    { type: 'paragraph', children: [{ type: 'text', value: 'Delivered workflow details.' }] },
    heading('Project screenshots'),
    { type: 'paragraph', children: [image] },
  ] }] };
  const html = renderToStaticMarkup(React.createElement(CaseStudyArticle, { story: article }));
  expect(html).not.toContain('Project screenshots');
  expect(html).toContain('Useful details');
  expect(html).toContain('Delivered workflow details.');
  expect(html).toContain('/screenshot.png');
 });
