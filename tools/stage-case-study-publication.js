import path from 'node:path';
import { stageReviewedCaseStudyCandidate } from '../publication/stage-case-study-publication.js';
import { repositoryRoot } from '../publication/compile-case-studies.js';

const args = process.argv.slice(2);
const value = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};

const candidatePath = value('--candidate');
const candidateSha256 = value('--sha256');
const approvedBy = value('--approved-by');
const approvedAt = value('--approved-at');
const evidence = value('--evidence');
const stagedPath = value('--staged') ?? path.join(repositoryRoot, 'publication/staged-case-study-publication.js');

if (!candidatePath || !candidateSha256 || !approvedBy || !approvedAt || !evidence) {
  console.error('Usage: npm run case-study:stage -- --candidate .case-study-preview/candidate.json --sha256 DIGEST --approved-by Viv --approved-at 2026-09-09T00:00:00Z --evidence https://example.invalid/review');
  process.exitCode = 1;
} else {
  stageReviewedCaseStudyCandidate({
    candidatePath: path.resolve(candidatePath),
    stagedPath: path.resolve(stagedPath),
    metadata: { candidateSha256, approvedBy, approvedAt, evidence },
  }).then((result) => {
    console.log(`Staged ${result.records.length} reviewed case stud${result.records.length === 1 ? 'y' : 'ies'} from candidate ${result.candidateSha256}.`);
    console.log(`Updated ${result.stagedPath}; release and deployment remain separate.`);
  }).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
