import { readFileSync, renameSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { digest } from './case-study-evidence.js';
import { validatePreparedCaseStudies } from './markdown-case-study.js';
import { mergeCaseStudyManifest } from './case-study-manifest-merge.js';

const isoTimestamp = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const sha256 = /^[a-f0-9]{64}$/;

const explicitApproval = (sha256Value, metadata) => ({
  kind: 'explicit',
  sha256: sha256Value,
  approvedBy: metadata.approvedBy,
  approvedAt: metadata.approvedAt,
  evidence: metadata.evidence,
  candidateSha256: metadata.candidateSha256,
});

const claim = (id, recordId, placement, value, metadata) => ({
  type: 'content', recordId, placement, value,
  approval: explicitApproval(digest({ id, type: 'content', recordId, placement, value }), metadata),
});

const articleRecord = (story, metadata) => {
  const content = {
    title: story.title,
    summary: story.summary,
    ...(story.category === undefined ? {} : { category: story.category }),
    sections: story.sections,
  };
  const summaryRef = `${story.id}.summary`;
  const outcomeRef = `${story.id}.outcome`;
  return {
    id: story.id,
    slug: story.slug,
    status: 'published',
    variant: 'article',
    approval: explicitApproval(digest({ id: story.id, slug: story.slug, content }), metadata),
    claimRefs: { summary: summaryRef, outcome: outcomeRef },
    content,
    claims: {
      [summaryRef]: claim(summaryRef, story.id, 'summary', content.summary, metadata),
      [outcomeRef]: claim(outcomeRef, story.id, 'outcome', content.sections[2], metadata),
    },
  };
};

const validateMetadata = (metadata) => {
  if (!sha256.test(metadata.candidateSha256)) throw new Error('Staging requires a 64-character lowercase candidate SHA-256 digest');
  if (typeof metadata.approvedBy !== 'string' || metadata.approvedBy.trim() !== metadata.approvedBy || metadata.approvedBy.trim() === '') throw new Error('Staging requires a non-empty --approved-by value');
  if (!isoTimestamp.test(metadata.approvedAt) || Number.isNaN(Date.parse(metadata.approvedAt))) throw new Error('Staging requires --approved-at as an ISO UTC timestamp');
  if (typeof metadata.evidence !== 'string' || !/^https:\/\/[^\s\\]+$/.test(metadata.evidence) || metadata.evidence.trim() !== metadata.evidence) throw new Error('Staging requires an HTTPS --evidence URL');
};

export async function stageReviewedCaseStudyCandidate({ candidatePath, stagedPath, metadata }) {
  validateMetadata(metadata);
  const bytes = readFileSync(candidatePath);
  const actualDigest = digest(bytes);
  if (actualDigest !== metadata.candidateSha256) throw new Error(`Reviewed candidate digest mismatch: expected ${metadata.candidateSha256}, got ${actualDigest}`);
  const candidate = JSON.parse(bytes.toString('utf8'));
  if (candidate?.schemaVersion !== 1) throw new Error('Reviewed candidate has an unsupported schema version');
  const stories = validatePreparedCaseStudies(candidate.stories, path.basename(candidatePath));
  const stagedSource = readFileSync(stagedPath, 'utf8');
  const stagedMatch = stagedSource.match(/export const stagedCaseStudyPublication = ([\s\S]*);\s*$/);
  if (!stagedMatch) throw new Error(`Staged publication file is malformed: ${stagedPath}`);
  let existing;
  try { existing = JSON.parse(stagedMatch[1]); } catch (error) { throw new Error(`Staged publication file is not valid JSON data: ${error.message}`); }
  if (!Array.isArray(existing.records) || !existing.claims || typeof existing.claims !== 'object') throw new Error('Staged publication store must contain records and claims');
  const manifestPath = path.join(path.dirname(stagedPath), 'case-study-manifest.js');
  const manifestModule = await import(`${pathToFileURL(manifestPath).href}?cacheBust=${Date.now()}`);
  const baseline = manifestModule.caseStudyPublicationBaseline ?? manifestModule.caseStudyPublicationManifest;
  if (!baseline) throw new Error(`Manifest does not export a stable baseline: ${manifestPath}`);
  const existingManifest = mergeCaseStudyManifest(baseline, existing);
  const stagedRecords = stories.map((story) => articleRecord(story, metadata));
  const selectedIds = new Set(stagedRecords.map((record) => record.id));
  const existingIds = new Set(existing.records.map((record) => record.id));
  for (const record of stagedRecords) {
    const prior = existingManifest.records.find((candidateRecord) => candidateRecord.id === record.id);
    if (prior && prior.slug !== record.slug) throw new Error(`Reviewed candidate ${record.id} must preserve its existing slug ${prior.slug}`);
    const slugOwner = existingManifest.records.find((candidateRecord) => candidateRecord.slug === record.slug);
    if (slugOwner && slugOwner.id !== record.id) throw new Error(`Reviewed candidate ${record.id} uses a slug owned by ${slugOwner.id}`);
  }
  const serializableCandidateRecords = stagedRecords.map(({ claims: _claims, ...record }) => record);
  const replaced = existing.records.map((record) => {
    const next = serializableCandidateRecords.find((candidateRecord) => candidateRecord.id === record.id);
    if (next && next.slug !== record.slug) throw new Error(`Reviewed candidate ${record.id} must preserve its staged slug ${record.slug}`);
    return next ?? record;
  });
  const records = [...replaced, ...serializableCandidateRecords.filter((record) => !existingIds.has(record.id))];
  const claims = { ...existing.claims };
  for (const id of selectedIds) {
    for (const claimId of Object.keys(claims)) if (claimId.startsWith(`${id}.`)) delete claims[claimId];
  }
  for (const record of stagedRecords) Object.assign(claims, record.claims);
  const proposedStagedStore = { records, claims };
  // Validate the exact merged manifest before replacing the generated store.
  // This is also the path used by the default manifest import at build time.
  const proposedManifest = mergeCaseStudyManifest(baseline, proposedStagedStore);
  const { compileCaseStudyPublication } = await import('./compile-case-studies.js');
  compileCaseStudyPublication({ manifest: proposedManifest, root: path.resolve(path.dirname(stagedPath), '..') });
  const output = `// Generated by tools/stage-case-study-publication.js.\nexport const stagedCaseStudyPublication = ${JSON.stringify({ records, claims }, null, 2)};\n`;
  mkdirSync(path.dirname(stagedPath), { recursive: true });
  const temporaryDirectory = mkdtempSync(path.join(path.dirname(stagedPath), '.staged-'));
  const temporaryPath = path.join(temporaryDirectory, path.basename(stagedPath));
  try {
    writeFileSync(temporaryPath, output, 'utf8');
    renameSync(temporaryPath, stagedPath);
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
  return { candidateSha256: actualDigest, records, stagedPath };
}
