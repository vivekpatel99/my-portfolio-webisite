// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import CaseStudyArticle from '../src/components/CaseStudyArticle.js';
import { parseMarkdownCaseStudy } from '../publication/markdown-case-study.js';
import { previewIsAllowed } from './preview-case-study.js';
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
