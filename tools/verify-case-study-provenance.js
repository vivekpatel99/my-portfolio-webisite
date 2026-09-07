import { createHash } from 'node:crypto';
import { lstatSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DEFAULT_MANIFEST_PATH = path.join(repositoryRoot, 'provenance/case-study-assets.json');
export const CASE_STUDY_DIRECTORY = 'public/assets/case-studies';
const identifyingWebpChunks = ['EXIF', 'XMP ', 'ICCP'];
const identifyingMp4Atoms = ['©nam', '©cmt', '©cpy', 'titl', 'desc', 'loci', '©xyz', 'gps '];
const nonessentialMp4MetadataMarkers = ['Lavf', 'Lavc', 'libx264', 'VideoHandler'];

function issue(errors, message) {
  errors.push(message);
}

export function listCaseStudyAssets(root = repositoryRoot) {
  const directory = path.join(root, CASE_STUDY_DIRECTORY);
  if (!lstatSync(directory).isDirectory()) throw new Error(`${CASE_STUDY_DIRECTORY} must be a real directory`);
  const entries = readdirSync(directory, { withFileTypes: true });
  const unsafeEntries = entries.filter((entry) => !entry.isFile());
  if (unsafeEntries.length) throw new Error(`${CASE_STUDY_DIRECTORY} must contain only regular files; found ${unsafeEntries.map((entry) => entry.name).join(', ')}`);
  return entries
    .map((entry) => `${CASE_STUDY_DIRECTORY}/${entry.name}`)
    .sort();
}

export function readManifest(manifestPath = DEFAULT_MANIFEST_PATH) {
  return JSON.parse(readFileSync(manifestPath, 'utf8'));
}

export function inspectAssetMetadata(assetPath, buffer, expectation, approvalStatus = 'unresolved') {
  const errors = [];
  if (expectation?.container === 'webp') {
    if (buffer.subarray(0, 4).toString('ascii') !== 'RIFF' || buffer.subarray(8, 12).toString('ascii') !== 'WEBP') {
      return [`${assetPath}: expected a RIFF/WEBP container`];
    }
    const chunks = [];
    for (let offset = 12; offset + 8 <= buffer.length;) {
      const chunk = buffer.subarray(offset, offset + 4).toString('ascii');
      const size = buffer.readUInt32LE(offset + 4);
      if (offset + 8 + size > buffer.length) return [`${assetPath}: malformed WebP chunk ${chunk}`];
      chunks.push(chunk);
      offset += 8 + size + (size % 2);
    }
    if (chunks.join('|') !== expectation.chunks.join('|')) issue(errors, `${assetPath}: WebP chunks must be exactly ${expectation.chunks.join(', ')}, found ${chunks.join(', ') || 'none'}`);
    for (const chunk of identifyingWebpChunks) {
      if (chunks.includes(chunk)) issue(errors, `${assetPath}: embedded identifying metadata chunk ${chunk} is prohibited`);
    }
    return errors;
  }
  if (expectation?.container === 'mp4') {
    if (buffer.subarray(4, 8).toString('ascii') !== 'ftyp') {
      return [`${assetPath}: expected an ISO base media (ftyp) container`];
    }
    const text = buffer.toString('latin1');
    for (const brand of expectation.brands ?? []) {
      if (!text.includes(brand)) issue(errors, `${assetPath}: expected MP4 brand ${brand}`);
    }
    for (const atom of identifyingMp4Atoms) {
      if (text.includes(atom)) issue(errors, `${assetPath}: embedded identifying metadata atom ${atom} is prohibited`);
    }
    if (approvalStatus === 'approved') {
      for (const marker of nonessentialMp4MetadataMarkers) {
        if (text.includes(marker)) issue(errors, `${assetPath}: approved derivatives must omit unnecessary embedded metadata marker ${marker}`);
      }
    }
    return errors;
  }
  return [`${assetPath}: unsupported metadata expectation`];
}

function isExactKaggleSourceUrl(value, owner) {
  if (typeof value !== 'string' || typeof owner !== 'string' || !owner) return false;
  try {
    const url = new URL(value);
    const segments = url.pathname.split('/');
    return url.protocol === 'https:' && url.hostname === 'www.kaggle.com' && !url.search && !url.hash &&
      segments.length === 4 && ['datasets', 'code'].includes(segments[1]) && segments[2] === owner && /^[a-z0-9][a-z0-9-]*$/i.test(segments[3]);
  } catch {
    return false;
  }
}

function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function isIsoDateTime(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(value) && !Number.isNaN(Date.parse(value));
}

function hasPinnedUpstreamEvidence(upstream) {
  if (!/^[a-f0-9]{40}$/.test(upstream?.commit ?? '') || !/^[a-f0-9]{64}$/.test(upstream?.sha256 ?? '')) return false;
  try {
    const url = new URL(upstream.url);
    return url.protocol === 'https:' && url.hostname === 'github.com' && url.pathname.includes(`/blob/${upstream.commit}/`);
  } catch {
    return false;
  }
}

function validateEntry(entry, errors) {
  const label = entry.path || '<missing path>';
  if (entry.evidenceRole !== 'demonstration') issue(errors, `${label}: evidenceRole must be demonstration`);
  if (entry.clientOutcomeEvidence !== false) issue(errors, `${label}: clientOutcomeEvidence must be false`);
  if (!['approved', 'unresolved', 'rejected'].includes(entry.approvalStatus)) issue(errors, `${label}: approvalStatus must be approved, unresolved, or rejected`);
  if (entry.approvalStatus !== 'approved' && (typeof entry.resolutionNeeded !== 'string' || !entry.resolutionNeeded)) issue(errors, `${label}: non-approved entries require resolutionNeeded`);
  if (entry.approvalStatus !== 'approved') return;

  const kaggle = entry.kaggle ?? {};
  if (entry.provenanceStatus !== 'confirmed') issue(errors, `${label}: approved entries require confirmed provenance`);
  if (entry.provenanceConfidence !== 'high') issue(errors, `${label}: approved entries require high-confidence provenance`);
  if (typeof entry.sourceMappingEvidence !== 'string' || !entry.sourceMappingEvidence.trim()) issue(errors, `${label}: approved entries require source-mapping evidence`);
  if (entry.licenseCompatibility !== 'compatible') issue(errors, `${label}: approved entries require compatible public-display and transformed-redistribution terms`);
  if (!isExactKaggleSourceUrl(kaggle.datasetUrl, kaggle.owner)) issue(errors, `${label}: approved entries require an exact Kaggle dataset or notebook URL matching its owner`);
  if (typeof kaggle.owner !== 'string' || !kaggle.owner) issue(errors, `${label}: approved entries require a Kaggle owner`);
  if (typeof kaggle.license?.label !== 'string' || !kaggle.license.label.trim() || !Array.isArray(kaggle.license.urls) || kaggle.license.urls.length === 0 || kaggle.license.urls.some((url) => !isHttpsUrl(url))) issue(errors, `${label}: approved entries require an explicit license and valid HTTPS license URL`);
  if (typeof entry.attribution !== 'string' || !entry.attribution.trim()) issue(errors, `${label}: approved entries require attribution`);
  if (!Array.isArray(entry.transformationHistory) || entry.transformationHistory.length === 0 || entry.transformationHistory.some((step) => typeof step !== 'string' || !step.trim())) issue(errors, `${label}: approved entries require non-empty transformationHistory steps`);
  if (entry.downloadedAt !== null && !isIsoDateTime(entry.downloadedAt)) issue(errors, `${label}: approved entries require a valid ISO source download date when supplied`);
  if (entry.downloadedAt === null && (typeof entry.downloadedAtReason !== 'string' || !entry.downloadedAtReason.trim())) issue(errors, `${label}: approved entries require a source download date or explicit unknown-date reason`);
  if (typeof kaggle.exactDatasetFileVersion !== 'string' || !kaggle.exactDatasetFileVersion.trim()) issue(errors, `${label}: approved entries require an exact dataset file or version`);
  if (!hasPinnedUpstreamEvidence(entry.upstream)) issue(errors, `${label}: approved entries require an immutable GitHub blob URL, commit, and SHA-256 evidence`);
  if (typeof entry.approval?.approvedBy !== 'string' || !entry.approval.approvedBy.trim() || !isIsoDateTime(entry.approval?.approvedAt) || !isHttpsUrl(entry.approval?.evidence)) issue(errors, `${label}: approved entries require an approver, ISO approval date, and HTTPS approval evidence URL`);
  if (entry.resolutionNeeded != null) issue(errors, `${label}: approved entries must not retain a resolutionNeeded blocker`);
}

export function verifyCaseStudyProvenance({ root = repositoryRoot, manifest = readManifest(), mode = 'audit' } = {}) {
  if (!['audit', 'deploy'].includes(mode)) throw new Error(`Unknown provenance verification mode: ${mode}`);
  const errors = [];
  const warnings = [];
  const entries = Array.isArray(manifest.assets) ? manifest.assets : [];
  const publicAssets = listCaseStudyAssets(root);
  const paths = entries.map((entry) => entry.path);
  const duplicates = paths.filter((value, index) => paths.indexOf(value) !== index);
  if (duplicates.length) issue(errors, `Manifest has duplicate entries: ${[...new Set(duplicates)].join(', ')}`);
  for (const asset of publicAssets) if (!paths.includes(asset)) issue(errors, `Missing manifest entry for ${asset}`);
  for (const entry of entries) {
    validateEntry(entry, errors);
    if (!publicAssets.includes(entry.path)) {
      issue(errors, `Manifest entry does not identify a public case-study asset: ${entry.path}`);
      continue;
    }
    const buffer = readFileSync(path.join(root, entry.path));
    if (buffer.length !== entry.bytes) issue(errors, `${entry.path}: byte length drift (expected ${entry.bytes}, found ${buffer.length})`);
    const digest = createHash('sha256').update(buffer).digest('hex');
    if (digest !== entry.sha256) issue(errors, `${entry.path}: SHA-256 drift (expected ${entry.sha256}, found ${digest})`);
    errors.push(...inspectAssetMetadata(entry.path, buffer, entry.metadataExpectation, entry.approvalStatus));
    if (entry.approvalStatus !== 'approved') {
      const message = `${entry.path}: approval is ${entry.approvalStatus} — ${entry.resolutionNeeded}`;
      (mode === 'deploy' ? errors : warnings).push(message);
    }
  }
  return { errors, warnings, verified: entries.length, publicAssets: publicAssets.length };
}

function main() {
  const mode = process.argv[2] === '--deploy' ? 'deploy' : process.argv[2] === '--audit' || process.argv.length === 2 ? 'audit' : null;
  if (!mode) throw new Error('Usage: node tools/verify-case-study-provenance.js [--audit|--deploy]');
  const result = verifyCaseStudyProvenance({ mode });
  for (const warning of result.warnings) console.warn(`WARNING: ${warning}`);
  if (result.errors.length) {
    for (const error of result.errors) console.error(`ERROR: ${error}`);
    throw new Error(`Case-study provenance ${mode} verification failed with ${result.errors.length} error(s)`);
  }
  console.log(`Case-study provenance ${mode} verification passed: ${result.verified}/${result.publicAssets} assets covered.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
