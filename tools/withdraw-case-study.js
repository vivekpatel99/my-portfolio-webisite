import path from 'node:path';
import { withdrawStagedCaseStudy } from '../publication/stage-case-study-publication.js';
import { repositoryRoot } from '../publication/compile-case-studies.js';

const args = process.argv.slice(2);
const value = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};

const id = value('--id');
const stagedPath = value('--staged') ?? path.join(repositoryRoot, 'publication/staged-case-study-publication.js');

if (!id) {
  console.error('Usage: npm run case-study:withdraw -- --id story-id [--staged publication/staged-case-study-publication.js]');
  process.exitCode = 1;
} else {
  withdrawStagedCaseStudy({ id, stagedPath: path.resolve(stagedPath) }).then((result) => {
    console.log(`${result.changed ? 'Withdrew' : 'Already withdrawn'} case study ${result.id} (${result.slug}).`);
    console.log(`Updated ${result.stagedPath}; release and deployment remain separate.`);
  }).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
