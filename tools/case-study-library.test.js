// @vitest-environment node
import { mkdtempSync, readFileSync, writeFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createLibraryStory, listLibrary, prepareLibrary, libraryDirectory } from './case-study-library.js';
import { libraryPreviewPage } from './preview-case-study.js';
const roots = [];
const temporary = () => { const root = mkdtempSync(path.join(tmpdir(), 'story-library-')); roots.push(root); return root; };
afterEach(() => roots.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true })));
describe('case-study library management', () => {
  it('creates an editable source, lists it, and refuses to overwrite it', () => {
    const directory = temporary();
    const file = createLibraryStory({ directory, id: 'new-project', title: 'A new project' });
    expect(listLibrary(directory)).toMatchObject([{ id: 'new-project', title: 'A new project', completedAt: null }]);
    const before = readFileSync(file, 'utf8');
    expect(() => createLibraryStory({ directory, id: 'new-project', title: 'Replacement' })).toThrow(/already exists/);
    expect(readFileSync(file, 'utf8')).toBe(before);
  });
  it('rejects duplicate identities and source symlinks', () => {
    const directory = temporary();
    const file = createLibraryStory({ directory, id: 'one', title: 'One' });
    writeFileSync(path.join(directory, 'duplicate.md'), readFileSync(file));
    expect(() => listLibrary(directory)).toThrow(/Duplicate/);
    rmSync(path.join(directory, 'duplicate.md'));
    symlinkSync(file, path.join(directory, 'alias.md'));
    expect(() => listLibrary(directory)).toThrow(/regular file/);
  });
  it('keeps draft sources outside the website even through a parent symlink', () => {
    const directory = temporary();
    symlinkSync(process.cwd(), path.join(directory, 'website'));
    expect(() => libraryDirectory(path.join(directory, 'website', 'new-drafts'), true)).toThrow(/outside/);
    expect(() => libraryDirectory(path.join(process.cwd(), 'public', 'drafts'), true)).toThrow(/outside/);
  });
  it('requires an explicit selection and rejects unknown IDs', () => {
    const directory = temporary();
    createLibraryStory({ directory, id: 'one', title: 'One' });
    expect(() => prepareLibrary({ directory })).toThrow(/Select/);
    expect(() => prepareLibrary({ directory, ids: ['one'], all: true })).toThrow(/Select/);
    expect(() => prepareLibrary({ directory, ids: ['missing'] })).toThrow(/Unknown/);
  });
  it('prepares multiple sources without touching originals or publishing them', () => {
    const directory = temporary();
    const one = createLibraryStory({ directory, id: 'one', title: 'One' });
    createLibraryStory({ directory, id: 'two', title: 'Two' });
    const before = readFileSync(one, 'utf8');
    const output = path.join(process.cwd(), '.case-study-preview', path.basename(directory)); roots.push(output);
    const result = prepareLibrary({ directory, all: true, outputDirectory: output });
    expect(result.stories).toHaveLength(2);
    expect(readFileSync(one, 'utf8')).toBe(before);
  });
  it('escapes the review index and distinguishes missing completion dates', () => {
    const html = libraryPreviewPage([{ slug: 'one', title: '<script>alert(1)</script>', summary: 'A & B', category: 'AI' }]);
    expect(html).toContain('noindex, nofollow');
    expect(html).toContain('href="/project/one/"');
    expect(html).not.toContain('<script>');
    expect(html).toContain('Completion details need review');
    expect(html).toContain('A &amp; B');
  });
});
