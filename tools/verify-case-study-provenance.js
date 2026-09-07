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
const mp4ContainerAtoms = new Set(['moov', 'trak', 'mdia', 'minf', 'stbl', 'edts', 'dinf', 'udta', 'meta', 'ilst']);
const prohibitedMp4MetadataAtoms = new Set(['uuid', 'XMP_', 'xml ', 'ID32']);
const unresolvedMp4MetadataFields = new Set(['©too']);
const approvalEvidencePattern = /^https:\/\/github\.com\/vivekpatel99\/my-portfolio-webisite\/issues\/50#issuecomment-\d+$/;

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
    const metadataFields = [];
    const metadataHandlers = [];
    const parseAtoms = (start, end, parent = null) => {
      for (let offset = start; offset + 8 <= end;) {
        let size = buffer.readUInt32BE(offset);
        const type = buffer.subarray(offset + 4, offset + 8).toString('latin1');
        let headerSize = 8;
        if (size === 1) {
          if (offset + 16 > end) return issue(errors, `${assetPath}: malformed extended-size MP4 atom ${type}`);
          const extendedSize = buffer.readBigUInt64BE(offset + 8);
          if (extendedSize > BigInt(Number.MAX_SAFE_INTEGER)) return issue(errors, `${assetPath}: oversized MP4 atom ${type}`);
          size = Number(extendedSize);
          headerSize = 16;
        } else if (size === 0) {
          size = end - offset;
        }
        if (size < headerSize || offset + size > end) return issue(errors, `${assetPath}: malformed MP4 atom ${type}`);
        if (parent === 'ilst' || (parent === 'udta' && type !== 'meta')) metadataFields.push(type);
        if (prohibitedMp4MetadataAtoms.has(type)) issue(errors, `${assetPath}: MP4 metadata atom ${type} is prohibited`);
        if (type === 'keys') issue(errors, `${assetPath}: keyed MP4 metadata is prohibited`);
        if (parent === 'meta' && !['hdlr', 'ilst', 'keys'].includes(type)) issue(errors, `${assetPath}: non-allowlisted MP4 meta child ${type} is prohibited`);
        if (type === 'hdlr') {
          const payloadStart = offset + headerSize;
          if (size < headerSize + 24) {
            issue(errors, `${assetPath}: malformed MP4 handler atom`);
          } else {
            const handlerType = buffer.subarray(payloadStart + 8, payloadStart + 12).toString('latin1');
            const handlerName = buffer.subarray(payloadStart + 24, offset + size).toString('utf8').replace(/\0+$/g, '');
            metadataHandlers.push({ parent, handlerType, handlerName });
            if (handlerName && handlerName !== 'VideoHandler') issue(errors, `${assetPath}: non-allowlisted MP4 handler name is prohibited`);
          }
        }
        if (mp4ContainerAtoms.has(type) && parent !== 'ilst') {
          const childStart = offset + headerSize + (type === 'meta' ? 4 : 0);
          if (childStart > offset + size) return issue(errors, `${assetPath}: malformed MP4 container ${type}`);
          parseAtoms(childStart, offset + size, type);
        }
        offset += size;
      }
    };
    parseAtoms(0, buffer.length);
    const allowedFields = approvalStatus === 'approved' ? new Set() : unresolvedMp4MetadataFields;
    for (const field of metadataFields) {
      if (!allowedFields.has(field)) issue(errors, `${assetPath}: non-allowlisted MP4 metadata field ${field} is prohibited`);
    }
    if (approvalStatus === 'approved') {
      if (metadataHandlers.some((handler) => handler.parent === 'meta')) issue(errors, `${assetPath}: approved derivatives must omit the nonessential MP4 metadata handler`);
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

function isApprovalEvidence(value) {
  return typeof value === 'string' && approvalEvidencePattern.test(value);
}

function isExactKaggleDatasetVersionUrl(value, sourceUrl, version) {
  if (!Number.isInteger(version) || version < 1) return false;
  try {
    const versionUrl = new URL(value);
    const source = new URL(sourceUrl);
    return versionUrl.protocol === 'https:' && versionUrl.hostname === 'www.kaggle.com' && !versionUrl.search && !versionUrl.hash &&
      source.pathname.startsWith('/datasets/') && versionUrl.pathname === `${source.pathname}/versions/${version}`;
  } catch {
    return false;
  }
}

function hasExactSourceMapping(mapping, kaggle) {
  if (mapping?.status !== 'confirmed') return false;
  if (mapping.kind === 'dataset') {
    return typeof mapping.datasetFilePath === 'string' && mapping.datasetFilePath.trim().length > 0 &&
      Number.isInteger(mapping.datasetFileBytes) && mapping.datasetFileBytes > 0 &&
      isExactKaggleDatasetVersionUrl(mapping.datasetVersionUrl, kaggle?.sourceUrl, mapping.datasetVersion);
  }
  if (mapping.kind === 'notebook') {
    return Number.isInteger(mapping.notebookVersionNumber) && mapping.notebookVersionNumber > 0 &&
      typeof kaggle?.sourceUrl === 'string' && kaggle.sourceUrl.includes('/code/');
  }
  return false;
}

function hasManualLicenseReview(review, approvalEvidence) {
  return review?.reviewedBy === 'Viv' &&
    review?.conclusion === 'compatible-for-public-display-and-transformed-redistribution' &&
    isIsoDateTime(review?.reviewedAt) &&
    isApprovalEvidence(review?.evidence) &&
    review.evidence === approvalEvidence;
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
  if (!hasExactSourceMapping(entry.exactSourceMapping, kaggle)) issue(errors, `${label}: approved entries require a confirmed exact Kaggle dataset-file or notebook-version mapping`);
  if (entry.licenseCompatibility !== 'compatible') issue(errors, `${label}: approved entries require compatible public-display and transformed-redistribution terms`);
  if (!isExactKaggleSourceUrl(kaggle.sourceUrl, kaggle.owner)) issue(errors, `${label}: approved entries require an exact Kaggle dataset or notebook URL matching its owner`);
  if (typeof kaggle.owner !== 'string' || !kaggle.owner) issue(errors, `${label}: approved entries require a Kaggle owner`);
  if (typeof kaggle.license?.label !== 'string' || !kaggle.license.label.trim() || !Array.isArray(kaggle.license.urls) || kaggle.license.urls.length === 0 || kaggle.license.urls.some((url) => !isHttpsUrl(url)) || kaggle.license.sourceEvidenceUrl !== kaggle.sourceUrl) issue(errors, `${label}: approved entries require an explicit license, valid HTTPS terms, and first-party Kaggle license evidence`);
  if (typeof entry.attribution !== 'string' || !entry.attribution.trim()) issue(errors, `${label}: approved entries require attribution`);
  if (!Array.isArray(entry.transformationHistory) || entry.transformationHistory.length === 0 || entry.transformationHistory.some((step) => typeof step !== 'string' || !step.trim())) issue(errors, `${label}: approved entries require non-empty transformationHistory steps`);
  if (entry.downloadedAt !== null && !isIsoDateTime(entry.downloadedAt)) issue(errors, `${label}: approved entries require a valid ISO source download date when supplied`);
  if (entry.downloadedAt === null && (typeof entry.downloadedAtReason !== 'string' || !entry.downloadedAtReason.trim())) issue(errors, `${label}: approved entries require a source download date or explicit unknown-date reason`);
  if (!hasPinnedUpstreamEvidence(entry.upstream)) issue(errors, `${label}: approved entries require an immutable GitHub blob URL, commit, and SHA-256 evidence`);
  if (entry.approval?.approvedBy !== 'Viv' || !isIsoDateTime(entry.approval?.approvedAt) || !isApprovalEvidence(entry.approval?.evidence)) issue(errors, `${label}: approved entries require Viv's ISO-dated authorization in an issue #50 comment`);
  if (!hasManualLicenseReview(entry.licenseReview, entry.approval?.evidence)) issue(errors, `${label}: approved entries require Viv's explicit license-compatibility review in the same issue #50 comment`);
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

function kaggleSourceParts(sourceUrl) {
  const url = new URL(sourceUrl);
  const [, kind, owner, slug] = url.pathname.split('/');
  return { kind, owner, slug };
}

async function fetchJson(fetchImpl, url, label, errors, options = {}) {
  try {
    const response = await fetchImpl(url, { ...options, headers: { Accept: 'application/json', ...options.headers } });
    if (!response.ok) {
      issue(errors, `${label}: first-party evidence request failed with HTTP ${response.status}`);
      return null;
    }
    return await response.json();
  } catch (error) {
    issue(errors, `${label}: first-party evidence request failed (${error.message})`);
    return null;
  }
}

export async function verifyRemoteApprovalEvidence(manifest, fetchImpl = fetch) {
  const errors = [];
  for (const entry of manifest.assets.filter((asset) => asset.approvalStatus === 'approved')) {
    const label = entry.path;
    const evidenceUrl = new URL(entry.approval.evidence);
    const commentId = evidenceUrl.hash.replace('#issuecomment-', '');
    const comment = await fetchJson(fetchImpl, `https://api.github.com/repos/vivekpatel99/my-portfolio-webisite/issues/comments/${commentId}`, label, errors);
    const requiredCommentLines = [
      `Asset provenance approval: ${entry.path}`,
      `License compatibility: compatible-for-public-display-and-transformed-redistribution`,
      `Kaggle source: ${entry.exactSourceMapping.datasetVersionUrl ?? entry.kaggle.sourceUrl}`,
      `Kaggle license: ${entry.kaggle.license.label}`,
      `Public derivative SHA-256: ${entry.sha256}`,
      `Attribution: ${entry.attribution}`,
    ];
    if (entry.exactSourceMapping.kind === 'dataset') {
      requiredCommentLines.push(`Kaggle file: ${entry.exactSourceMapping.datasetFilePath}`);
      requiredCommentLines.push(`Kaggle file bytes: ${entry.exactSourceMapping.datasetFileBytes}`);
    } else {
      requiredCommentLines.push(`Kaggle notebook version: ${entry.exactSourceMapping.notebookVersionNumber}`);
    }
    const commentLines = new Set(typeof comment?.body === 'string' ? comment.body.split(/\r?\n/).map((line) => line.trim()) : []);
    if (comment && (comment.html_url !== entry.approval.evidence || comment.user?.login !== 'vivekpatel99' || comment.author_association !== 'OWNER' || requiredCommentLines.some((line) => !commentLines.has(line)))) {
      issue(errors, `${label}: approval evidence must be an owner-authored issue #50 comment binding the exact asset, source record, license, hash, and attribution`);
    }

    const { kind, owner, slug } = kaggleSourceParts(entry.kaggle.sourceUrl);
    if (entry.exactSourceMapping.kind === 'dataset') {
      const version = entry.exactSourceMapping.datasetVersion;
      const metadata = await fetchJson(fetchImpl, `https://www.kaggle.com/api/v1/datasets/view/${owner}/${slug}?datasetVersionNumber=${version}`, label, errors);
      if (metadata && (metadata.ref !== `${owner}/${slug}` || metadata.ownerRef !== owner || metadata.licenseName !== entry.kaggle.license.label || !metadata.versions?.some((item) => item.versionNumber === version))) {
        issue(errors, `${label}: Kaggle API metadata does not confirm the owner, dataset version, and license`);
      }
      let pageToken = null;
      let foundFile = false;
      for (let page = 0; page < 100 && !foundFile; page += 1) {
        const query = new URLSearchParams({ pageSize: '200', datasetVersionNumber: String(version) });
        if (pageToken) query.set('pageToken', pageToken);
        const listing = await fetchJson(fetchImpl, `https://www.kaggle.com/api/v1/datasets/list/${owner}/${slug}?${query}`, label, errors);
        if (!listing) break;
        foundFile = listing.datasetFiles?.some((file) => file.name === entry.exactSourceMapping.datasetFilePath && file.totalBytes === entry.exactSourceMapping.datasetFileBytes) ?? false;
        pageToken = listing.nextPageToken || null;
        if (!pageToken) break;
      }
      if (!foundFile) issue(errors, `${label}: Kaggle API did not confirm the exact dataset file name and byte length`);
    } else if (kind === 'code') {
      const token = process.env.KAGGLE_API_TOKEN;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      const notebook = await fetchJson(
        fetchImpl,
        'https://www.kaggle.com/api/v1/kernels.KernelsApiService/GetKernel',
        label,
        errors,
        { method: 'POST', headers, body: JSON.stringify({ userName: owner, kernelSlug: `${slug}/${entry.exactSourceMapping.notebookVersionNumber}` }) },
      );
      const currentVersion = notebook?.metadata?.currentVersionNumber ?? notebook?.metadata?.current_version_number;
      if (notebook && (notebook.metadata?.ref !== `${owner}/${slug}` || currentVersion !== entry.exactSourceMapping.notebookVersionNumber)) {
        issue(errors, `${label}: Kaggle API did not confirm the exact notebook owner, slug, and version number`);
      }
    }
  }
  return errors;
}

export async function verifyDeployableCaseStudyProvenance({ root = repositoryRoot, manifest = readManifest(), fetchImpl = fetch } = {}) {
  const result = verifyCaseStudyProvenance({ root, manifest, mode: 'deploy' });
  if (result.errors.length) return result;
  result.errors.push(...await verifyRemoteApprovalEvidence(manifest, fetchImpl));
  return result;
}

async function main() {
  const mode = process.argv[2] === '--deploy' ? 'deploy' : process.argv[2] === '--audit' || process.argv.length === 2 ? 'audit' : null;
  if (!mode) throw new Error('Usage: node tools/verify-case-study-provenance.js [--audit|--deploy]');
  const result = mode === 'deploy' ? await verifyDeployableCaseStudyProvenance() : verifyCaseStudyProvenance({ mode });
  for (const warning of result.warnings) console.warn(`WARNING: ${warning}`);
  if (result.errors.length) {
    for (const error of result.errors) console.error(`ERROR: ${error}`);
    throw new Error(`Case-study provenance ${mode} verification failed with ${result.errors.length} error(s)`);
  }
  console.log(`Case-study provenance ${mode} verification passed: ${result.verified}/${result.publicAssets} assets covered.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
