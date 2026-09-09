// @vitest-environment node
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { parseMarkdownCaseStudy, prepareMarkdownCaseStudies, readPreparedCaseStudies } from './markdown-case-study.js';

const temporaryDirectories = [];
afterEach(() => temporaryDirectories.splice(0).forEach((directory) => rmSync(directory, { recursive: true, force: true })));

const source = (body = '') => `---
id: fixture-story
title: Fixture story
summary: A fixture summary.
category: Automation
private_note: DO_NOT_EXPORT
---

# Source heading that must not render

> Intro blockquote that must not render.

${body}

## Private notes
DO_NOT_EXPORT_PRIVATE

## The problem
The **problem** has \`inline code\`.

## What I built
- First step with [an internal link](/contact/).
- Second step with *emphasis*.

## The outcome
The outcome remains qualitative.
`;

describe('Markdown case-study preparation', () => {
  it('projects exactly the three public H2 sections and supported Markdown nodes', () => {
    const story = parseMarkdownCaseStudy({ source: source(), filePath: '/private/fixture.md' });
    expect(story).toEqual({
      id: 'fixture-story', slug: 'fixture-story', title: 'Fixture story', summary: 'A fixture summary.', category: 'Automation',
      sections: [
        { key: 'problem', heading: 'The problem', nodes: [{ type: 'paragraph', children: [{ type: 'text', value: 'The ' }, { type: 'strong', children: [{ type: 'text', value: 'problem' }] }, { type: 'text', value: ' has ' }, { type: 'code', value: 'inline code' }, { type: 'text', value: '.' }] }] },
        { key: 'built', heading: 'What I built', nodes: [{ type: 'list', ordered: false, start: '', items: [
          { type: 'listItem', children: [{ type: 'paragraph', children: [{ type: 'text', value: 'First step with ' }, { type: 'link', href: '/contact/', children: [{ type: 'text', value: 'an internal link' }] }, { type: 'text', value: '.' }] }] },
          { type: 'listItem', children: [{ type: 'paragraph', children: [{ type: 'text', value: 'Second step with ' }, { type: 'emphasis', children: [{ type: 'text', value: 'emphasis' }] }, { type: 'text', value: '.' }] }] },
        ] }] },
        { key: 'outcome', heading: 'The outcome', nodes: [{ type: 'paragraph', children: [{ type: 'text', value: 'The outcome remains qualitative.' }] }] },
      ],
    });
    const serialized = JSON.stringify(story);
    expect(serialized).not.toContain('DO_NOT_EXPORT');
    expect(serialized).not.toContain('Source heading');
    expect(serialized).not.toContain('Intro blockquote');
  });

  it('decodes Markdown entities once before the renderer escapes text', () => {
    const story = parseMarkdownCaseStudy({ source: source().replace('The **problem** has `inline code`.', 'The &amp; &#65; problem.'), filePath: '/private/fixture.md' });
    expect(story.sections[0].nodes[0].children).toEqual([{ type: 'text', value: 'The & A problem.' }]);
  });

  it('rejects missing or duplicate public headings, unsafe links, raw HTML, and images', () => {
    const cases = [
      [source().replace('## The outcome', '## Other heading'), /fixture\.md: The outcome is required exactly once/],
      [source() + '\n## The outcome\nDuplicate', /fixture\.md: The outcome must appear exactly once/],
      [source().replace('/contact/', 'javascript:alert(1)'), /fixture\.md: What I built link must be an internal path or HTTPS URL/],
      [source().replace('/contact/', '/\\\\evil.test'), /fixture\.md: What I built link contains unsafe URL characters/],
      [source().replace('The **problem**', 'The <script>alert(1)<\/script>'), /fixture\.md: The problem contains raw HTML/],
      [source().replace('category: Automation', 'image:\n  src: cover.png\n  alt: Cover'), /fixture\.md: image is unsupported in CS-02/],
    ];
    for (const [invalidSource, error] of cases) expect(() => parseMarkdownCaseStudy({ source: invalidSource, filePath: '/private/fixture.md' })).toThrow(error);
  });

  it('rejects non-YAML frontmatter and duplicate YAML keys', () => {
    expect(() => parseMarkdownCaseStudy({ source: '---js\nmodule.exports = { id: "bad" }\n---\n', filePath: '/private/executable.md' })).toThrow(/executable\.md: frontmatter/);
    expect(() => parseMarkdownCaseStudy({ source: source().replace('id: fixture-story', 'id: fixture-story\nid: duplicate'), filePath: '/private/duplicate.md' })).toThrow(/duplicate\.md: frontmatter/);
  });

  it('handles a UTF-8 BOM without permitting an alternate frontmatter engine', () => {
    expect(parseMarkdownCaseStudy({ source: `\uFEFF${source()}`, filePath: '/private/bom.md' }).id).toBe('fixture-story');
    expect(() => parseMarkdownCaseStudy({ source: '\uFEFF---js\nmodule.exports = {}\n---\n', filePath: '/private/bom-executable.md' })).toThrow(/bom-executable\.md: frontmatter/);
    expect(() => parseMarkdownCaseStudy({ source: '\uFEFF\uFEFF---js\nmodule.exports = {}\n---\n', filePath: '/private/double-bom-executable.md' })).toThrow(/double-bom-executable\.md: frontmatter/);
  });

  it('validates a loaded candidate before preview can render unsafe or malformed nodes', () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'markdown-case-study-candidate-'));
    temporaryDirectories.push(directory);
    const candidatePath = path.join(directory, 'candidate.json');
    const validStory = parseMarkdownCaseStudy({ source: source(), filePath: '/private/fixture.md' });
    const maliciousStory = structuredClone(validStory);
    maliciousStory.sections[0].nodes[0].children = [{ type: 'link', href: 'javascript:alert(1)', children: [{ type: 'text', value: 'bad' }] }];
    writeFileSync(candidatePath, JSON.stringify({ schemaVersion: 1, stories: [maliciousStory] }));
    expect(() => readPreparedCaseStudies(candidatePath)).toThrow(/candidate\.json\.stories\[0\].*internal path or HTTPS URL/);
    maliciousStory.sections[0].nodes[0].children = [{ type: 'unknown' }];
    writeFileSync(candidatePath, JSON.stringify({ schemaVersion: 1, stories: [maliciousStory] }));
    expect(() => readPreparedCaseStudies(candidatePath)).toThrow(/unsupported inline node type/);
  });

  it('validates every explicit file before replacing an existing candidate', () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'markdown-case-study-test-'));
    temporaryDirectories.push(directory);
    const first = path.join(directory, 'first.md');
    const second = path.join(directory, 'second.md');
    writeFileSync(first, source());
    writeFileSync(second, source().replaceAll('fixture-story', 'second-story'));
    const outputDirectory = path.join(directory, 'preview');
    const firstResult = prepareMarkdownCaseStudies({ sourceFiles: [first], outputDirectory });
    const prior = readFileSync(firstResult.candidatePath, 'utf8');
    writeFileSync(second, source());
    expect(() => prepareMarkdownCaseStudies({ sourceFiles: [first, second], outputDirectory })).toThrow(/second\.md: id fixture-story is duplicated with first\.md/);
    expect(readFileSync(firstResult.candidatePath, 'utf8')).toBe(prior);
    writeFileSync(second, source().replaceAll('fixture-story', 'second-story'));
    writeFileSync(second, source().replaceAll('fixture-story', 'second-story').replace('## The outcome', '## Missing outcome'));
    expect(() => prepareMarkdownCaseStudies({ sourceFiles: [first, second], outputDirectory })).toThrow(/second\.md: The outcome/);
    expect(readFileSync(firstResult.candidatePath, 'utf8')).toBe(prior);
    const unchanged = prepareMarkdownCaseStudies({ sourceFiles: [first], outputDirectory });
    expect(readFileSync(unchanged.candidatePath, 'utf8')).toBe(prior);
  });
});
