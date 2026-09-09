import path from 'node:path';
import { prepareMarkdownCaseStudies } from '../publication/markdown-case-study.js';
import { assertLocalPreviewDirectory } from './preview-path.js';

const args = process.argv.slice(2);
const sourceFiles = args.flatMap((value, index) => value === '--source' && args[index + 1] ? [args[index + 1]] : []);
const outputDirectory = args.find((value, index) => value === '--out' && args[index + 1]) ? args[args.indexOf('--out') + 1] : '.case-study-preview';

if (sourceFiles.length === 0) {
  console.error('Usage: npm run case-study:prepare -- --source path/to/story.md [--source path/to/another.md] [--out .case-study-preview]');
  process.exitCode = 1;
} else {
  try {
    const result = prepareMarkdownCaseStudies({ sourceFiles, outputDirectory: assertLocalPreviewDirectory(outputDirectory) });
    console.log(`Prepared ${result.stories.length} case stud${result.stories.length === 1 ? 'y' : 'ies'} at ${result.candidatePath}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
