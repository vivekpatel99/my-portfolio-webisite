import { mkdirSync, realpathSync } from 'node:fs';
import path from 'node:path';

const repositoryRoot = path.resolve(new URL('..', import.meta.url).pathname);
const previewRoot = path.join(repositoryRoot, '.case-study-preview');

const within = (root, target) => {
  const relative = path.relative(root, target);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
};

export const assertLocalPreviewDirectory = (directory) => {
  const resolved = path.resolve(directory);
  if (!within(previewRoot, resolved)) throw new Error(`Preview output must stay under ${previewRoot}; refusing ${resolved}`);
  mkdirSync(previewRoot, { recursive: true });
  if (realpathSync(previewRoot) !== previewRoot) throw new Error('Preview root must be a real ignored directory');
  mkdirSync(resolved, { recursive: true });
  if (!within(previewRoot, realpathSync(resolved))) throw new Error('Preview output must not escape its ignored directory');
  return resolved;
};

export { previewRoot };
