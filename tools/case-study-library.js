import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import matter from 'gray-matter';
import { prepareMarkdownCaseStudies } from '../publication/markdown-case-study.js';
import { slugPattern } from '../publication/case-study-schema.js';
import { assertLocalPreviewDirectory } from './preview-path.js';

const repositoryRoot = realpathSync(fileURLToPath(new URL('..', import.meta.url)));
const inside = (child, parent) => child === parent || child.startsWith(parent + path.sep);
export function libraryDirectory(directory, create = false) {
  if (!directory) throw new Error('Provide --directory pointing to your external case-study library.');
  const resolved = path.resolve(directory);
  // Resolve the existing parent before creating anything, including through symlinks.
  let parent = resolved;
  while (!existsSync(parent)) parent = path.dirname(parent);
  const effective = path.resolve(realpathSync(parent), path.relative(parent, resolved));
  if (inside(effective, repositoryRoot)) throw new Error('Keep editable sources outside the website repository.');
  if (create) mkdirSync(resolved, { recursive: true });
  if (!lstatSync(resolved).isDirectory() || lstatSync(resolved).isSymbolicLink()) throw new Error('Library must be a real directory.');
  return realpathSync(resolved);
}
export function listLibrary(directory) {
  const root = libraryDirectory(directory);
  const entries = [];
  const ids = new Set();
  const slugs = new Set();
  for (const entry of readdirSync(root, { withFileTypes: true }).sort((a, b) => a.name < b.name ? -1 : 1)) {
    if (!entry.name.endsWith('.md') || entry.name === 'README.md') continue;
    if (!entry.isFile()) throw new Error(`Source must be a regular file: ${entry.name}`);
    const file = path.join(root, entry.name);
    const { data } = matter(readFileSync(file, 'utf8'));
    const slug = data.slug ?? data.id;
    if (!slugPattern.test(data.id ?? '') || !slugPattern.test(slug ?? '')) throw new Error(`Invalid id or slug: ${entry.name}`);
    if (ids.has(data.id) || slugs.has(slug)) throw new Error(`Duplicate id or slug: ${entry.name}`);
    if (typeof data.title !== 'string' || !data.title.trim()) throw new Error(`Missing title: ${entry.name}`);
    ids.add(data.id); slugs.add(slug);
    entries.push({ id: data.id, slug, title: data.title, file, projectStatus: data.project_status ?? 'not recorded', completedAt: data.completed_at ?? null });
  }
  return entries;
}
export function createLibraryStory({ directory, id, title }) {
  if (!slugPattern.test(id ?? '')) throw new Error('Provide a stable lowercase --id, for example invoice-review-automation.');
  if (typeof title !== 'string' || !title.trim()) throw new Error('Provide --title.');
  const root = libraryDirectory(directory, true);
  if (listLibrary(root).some((story) => story.id === id || story.slug === id)) throw new Error(`Story already exists: ${id}`);
  const target = path.join(root, `${id}.md`);
  const template = readFileSync(new URL('../docs/templates/case-study.md', import.meta.url), 'utf8');
  const source = template.replace('id: your-stable-id', `id: ${id}`).replace('title: A clear case-study title', `title: ${JSON.stringify(title.trim())}`)
    .replace(/^project_status:.*\n/m, '# Add project_status: completed after confirming delivery.\n')
    .replace(/^completed_at:.*\n/m, '# Add completed_at: YYYY-MM from your project records.\n');
  writeFileSync(target, source, { flag: 'wx' });
  mkdirSync(path.join(root, 'assets', id), { recursive: true });
  return target;
}
export function prepareLibrary({ directory, ids = [], all = false, outputDirectory = '.case-study-preview/library' }) {
  if (all === (ids.length > 0)) throw new Error('Select --all OR one or more --id values.');
  const entries = listLibrary(directory);
  const selected = all ? entries : ids.map((id) => {
    const story = entries.find((entry) => entry.id === id);
    if (!story) throw new Error(`Unknown story: ${id}`);
    return story;
  });
  if (!selected.length) throw new Error('No stories selected.');
  return prepareMarkdownCaseStudies({ sourceFiles: selected.map((story) => story.file), outputDirectory: assertLocalPreviewDirectory(outputDirectory) });
}
export function runLibrary(args = process.argv.slice(2)) {
  const [command, ...options] = args;
  const values = (name) => options.flatMap((value, index) => value === name && options[index + 1] ? [options[index + 1]] : []);
  const directory = values('--directory')[0];
  if (command === 'list') return listLibrary(directory).map((s) => `${s.id}\t${s.projectStatus}\t${s.completedAt ?? 'date not recorded'}\t${s.title}`).join('\n');
  if (command === 'new') return createLibraryStory({ directory, id: values('--id')[0], title: values('--title')[0] });
  if (command === 'prepare') {
    const result = prepareLibrary({ directory, ids: values('--id'), all: options.includes('--all'), outputDirectory: values('--out')[0] });
    return `Prepared ${result.stories.length} stories at ${result.candidatePath}. Review before staging.`;
  }
  throw new Error('Usage: case-study:library <list|new|prepare> --directory /path/to/library [--id stable-id | --all]');
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(runLibrary()); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
