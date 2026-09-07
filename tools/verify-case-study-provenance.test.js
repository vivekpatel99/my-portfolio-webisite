// @vitest-environment node
import { mkdirSync, mkdtempSync, readFileSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { DEFAULT_MANIFEST_PATH, inspectAssetMetadata, readManifest, verifyCaseStudyProvenance, verifyRemoteApprovalEvidence } from './verify-case-study-provenance.js';

const manifest = () => structuredClone(readManifest(DEFAULT_MANIFEST_PATH));
const audit = (value) => verifyCaseStudyProvenance({ manifest: value, mode: 'audit' });
const box = (type, payload = Buffer.alloc(0)) => {
  const typeBytes = Buffer.isBuffer(type) ? type : Buffer.from(type, 'latin1');
  const result = Buffer.alloc(8 + payload.length);
  result.writeUInt32BE(result.length, 0);
  typeBytes.copy(result, 4);
  payload.copy(result, 8);
  return result;
};

describe('case-study provenance verifier', () => {
  it('covers every public case-study asset and reports the known unresolved approval states in audit mode', () => {
    const result = audit(manifest());
    expect(result.errors).toEqual([]);
    expect(result.publicAssets).toBe(5);
    expect(result.verified).toBe(5);
    expect(result.warnings).toHaveLength(5);
  });

  it('fails when a public asset has no manifest entry', () => {
    const value = manifest();
    value.assets.pop();
    expect(audit(value).errors.join('\n')).toMatch(/Missing manifest entry/);
  });

  it('fails on byte or hash drift', () => {
    const value = manifest();
    value.assets[0].sha256 = '0'.repeat(64);
    expect(audit(value).errors.join('\n')).toMatch(/SHA-256 drift/);
    value.assets[0].bytes = 0;
    expect(audit(value).errors.join('\n')).toMatch(/byte length drift/);
  });

  it('rejects symlinked case-study assets instead of omitting them from coverage', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'case-study-provenance-'));
    const directory = path.join(root, 'public/assets/case-studies');
    mkdirSync(directory, { recursive: true });
    symlinkSync('/tmp', path.join(directory, 'not-an-asset'));
    expect(() => verifyCaseStudyProvenance({ root, manifest: { assets: [] }, mode: 'audit' }))
      .toThrow(/only regular files/);
  });

  it('fails an embedded identifying WebP metadata chunk', () => {
    const original = readFileSync('public/assets/case-studies/invoice-ocr.webp');
    const injected = Buffer.concat([original, Buffer.from('EXIF\x04\x00\x00\x00name')]);
    expect(inspectAssetMetadata('invoice-ocr.webp', injected, manifest().assets[0].metadataExpectation).join('\n'))
      .toMatch(/embedded identifying metadata chunk EXIF/);
  });

  it('keeps identifying WebP metadata prohibitions code-owned when the manifest is tampered with', () => {
    const original = readFileSync('public/assets/case-studies/invoice-ocr.webp');
    const injected = Buffer.concat([original, Buffer.from('EXIF\x04\x00\x00\x00name')]);
    const expectation = manifest().assets[0].metadataExpectation;
    expectation.chunks.push('EXIF');
    expectation.forbiddenChunks = [];
    expect(inspectAssetMetadata('invoice-ocr.webp', injected, expectation).join('\n'))
      .toMatch(/embedded identifying metadata chunk EXIF/);
  });

  it('fails an embedded identifying MP4 title atom', () => {
    const original = readFileSync('public/assets/case-studies/football-tracking.mp4');
    const injected = Buffer.concat([original, Buffer.from([0xa9, 0x6e, 0x61, 0x6d])]);
    const football = manifest().assets.find((entry) => entry.path.endsWith('.mp4'));
    expect(inspectAssetMetadata('football-tracking.mp4', injected, football.metadataExpectation).join('\n'))
      .toMatch(/embedded identifying metadata atom ©nam/);
  });

  it('parses MP4 metadata structures and rejects a non-allowlisted artist field', () => {
    const artist = box(Buffer.from([0xa9, 0x41, 0x52, 0x54]), box('data', Buffer.from('owner name')));
    const ilst = box('ilst', artist);
    const meta = box('meta', Buffer.concat([Buffer.alloc(4), ilst]));
    const sample = Buffer.concat([box('ftyp', Buffer.from('isom')), box('moov', box('udta', meta))]);
    expect(inspectAssetMetadata('sample.mp4', sample, { container: 'mp4', brands: ['isom'] }).join('\n'))
      .toMatch(/non-allowlisted MP4 metadata field ©ART/);
  });

  it('rejects metadata fields placed directly beneath QuickTime udta', () => {
    const artist = box(Buffer.from([0xa9, 0x41, 0x52, 0x54]), box('data', Buffer.from('owner name')));
    const sample = Buffer.concat([box('ftyp', Buffer.from('isom')), box('moov', box('udta', artist))]);
    expect(inspectAssetMetadata('sample.mp4', sample, { container: 'mp4', brands: ['isom'] }, 'approved').join('\n'))
      .toMatch(/non-allowlisted MP4 metadata field ©ART/);
  });

  it('rejects identifying handler names and any metadata handler in an approved MP4', () => {
    const handlerPayload = Buffer.concat([
      Buffer.alloc(8),
      Buffer.from('mdir'),
      Buffer.alloc(12),
      Buffer.from('Owner Full Name\0'),
    ]);
    const meta = box('meta', Buffer.concat([Buffer.alloc(4), box('hdlr', handlerPayload)]));
    const sample = Buffer.concat([box('ftyp', Buffer.from('isom')), box('moov', box('udta', meta))]);
    const errors = inspectAssetMetadata('sample.mp4', sample, { container: 'mp4', brands: ['isom'] }, 'approved').join('\n');
    expect(errors).toMatch(/non-allowlisted MP4 handler name/);
    expect(errors).toMatch(/must omit the nonessential MP4 metadata handler/);
  });

  it('rejects UUID and XMP metadata containers outside udta', () => {
    for (const type of ['uuid', 'XMP_']) {
      const sample = Buffer.concat([box('ftyp', Buffer.from('isom')), box(type, Buffer.from('owner name'))]);
      expect(inspectAssetMetadata('sample.mp4', sample, { container: 'mp4', brands: ['isom'] }).join('\n'))
        .toMatch(new RegExp(`MP4 metadata atom ${type}`));
    }
  });

  it('requires approved MP4 derivatives to omit nonessential encoder metadata', () => {
    const original = readFileSync('public/assets/case-studies/football-tracking.mp4');
    const football = manifest().assets.find((entry) => entry.path.endsWith('.mp4'));
    expect(inspectAssetMetadata('football-tracking.mp4', original, football.metadataExpectation, 'approved').join('\n'))
      .toMatch(/approved derivatives must omit unnecessary embedded metadata marker Lavf/);
  });

  it('requires complete Kaggle provenance and explicit approval before an entry can be approved', () => {
    const approved = () => {
      const value = manifest();
      const entry = value.assets[0];
      entry.approvalStatus = 'approved';
      entry.provenanceStatus = 'confirmed';
      entry.provenanceConfidence = 'high';
      entry.exactSourceMapping = {
        status: 'confirmed',
        kind: 'dataset',
        datasetFilePath: 'source-file.jpg',
        datasetFileBytes: 12345,
        datasetVersion: 1,
        datasetVersionUrl: `${entry.kaggle.sourceUrl}/versions/1`,
      };
      entry.licenseCompatibility = 'compatible';
      entry.downloadedAt = '2026-08-30T00:00:00Z';
      entry.kaggle.license.sourceEvidenceUrl = entry.kaggle.sourceUrl;
      entry.attribution = 'Dataset attribution recorded.';
      entry.approval = { approvedBy: 'Viv', approvedAt: '2026-09-07T00:00:00Z', evidence: 'https://github.com/vivekpatel99/my-portfolio-webisite/issues/50#issuecomment-1' };
      entry.licenseReview = { reviewedBy: 'Viv', reviewedAt: '2026-09-07T00:00:00Z', conclusion: 'compatible-for-public-display-and-transformed-redistribution', evidence: entry.approval.evidence };
      entry.resolutionNeeded = null;
      return value;
    };
    const value = approved();
    const entry = value.assets[0];
    expect(audit(value).errors).toEqual([]);

    const requirements = [
      [/confirmed provenance/, (asset) => { asset.provenanceStatus = 'unresolved'; }],
      [/high-confidence provenance/, (asset) => { asset.provenanceConfidence = 'candidate'; }],
      [/confirmed exact Kaggle dataset-file or notebook-version mapping/, (asset) => { asset.exactSourceMapping.datasetFileBytes = 0; }],
      [/compatible public-display/, (asset) => { asset.licenseCompatibility = 'incompatible'; }],
      [/exact Kaggle dataset or notebook URL/, (asset) => { asset.kaggle.sourceUrl = 'https://www.kaggle.com/datasets/other/wrong'; }],
      [/Kaggle owner/, (asset) => { asset.kaggle.owner = ''; }],
      [/explicit license, valid HTTPS terms, and first-party Kaggle license evidence/, (asset) => { asset.kaggle.license.sourceEvidenceUrl = 'https://example.com/license'; }],
      [/require attribution/, (asset) => { asset.attribution = null; }],
      [/require non-empty transformationHistory/, (asset) => { asset.transformationHistory = []; }],
      [/source download date or explicit unknown-date reason/, (asset) => { asset.downloadedAt = null; asset.downloadedAtReason = null; }],
      [/immutable GitHub blob URL/, (asset) => { asset.upstream.url = asset.upstream.url.replace(`/blob/${asset.upstream.commit}/`, '/blob/main/'); }],
      [/require Viv's ISO-dated authorization/, (asset) => { asset.approval.evidence = 'https://example.com/approval'; }],
      [/require Viv's explicit license-compatibility review/, (asset) => { asset.licenseReview.conclusion = 'looks-good'; }],
      [/must not retain a resolutionNeeded blocker/, (asset) => { asset.resolutionNeeded = 'Still blocked.'; }],
    ];
    for (const [message, removeRequirement] of requirements) {
      const invalid = approved();
      removeRequirement(invalid.assets[0]);
      expect(audit(invalid).errors.join('\n')).toMatch(message);
    }

    const contradictory = approved();
    contradictory.assets[0].exactSourceMapping = null;
    contradictory.assets[0].provenanceNotes = 'No dataset file/version record ties the displayed invoice to it.';
    expect(audit(contradictory).errors.join('\n')).toMatch(/confirmed exact Kaggle dataset-file or notebook-version mapping/);

    const notebook = approved();
    notebook.assets[0].kaggle.sourceUrl = 'https://www.kaggle.com/code/osamahosamabdellatif/invoice-ocr-notebook';
    notebook.assets[0].kaggle.license.sourceEvidenceUrl = notebook.assets[0].kaggle.sourceUrl;
    notebook.assets[0].exactSourceMapping = {
      status: 'confirmed',
      kind: 'notebook',
      notebookVersionNumber: 42,
    };
    expect(audit(notebook).errors).toEqual([]);
  });

  it('verifies approved source and authorization records against first-party APIs', async () => {
    const value = manifest();
    const entry = value.assets[0];
    entry.approvalStatus = 'approved';
    entry.provenanceStatus = 'confirmed';
    entry.provenanceConfidence = 'high';
    entry.exactSourceMapping = { status: 'confirmed', kind: 'dataset', datasetFilePath: 'source-file.jpg', datasetFileBytes: 12345, datasetVersion: 1, datasetVersionUrl: `${entry.kaggle.sourceUrl}/versions/1` };
    entry.licenseCompatibility = 'compatible';
    entry.downloadedAt = '2026-08-30T00:00:00Z';
    entry.kaggle.license.sourceEvidenceUrl = entry.kaggle.sourceUrl;
    entry.attribution = 'Dataset attribution recorded.';
    entry.approval = { approvedBy: 'Viv', approvedAt: '2026-09-07T00:00:00Z', evidence: 'https://github.com/vivekpatel99/my-portfolio-webisite/issues/50#issuecomment-123' };
    entry.licenseReview = { reviewedBy: 'Viv', reviewedAt: '2026-09-07T00:00:00Z', conclusion: 'compatible-for-public-display-and-transformed-redistribution', evidence: entry.approval.evidence };
    entry.resolutionNeeded = null;
    const responses = [
      { html_url: entry.approval.evidence, user: { login: 'vivekpatel99' }, author_association: 'OWNER', body: `Asset provenance approval: ${entry.path}\nLicense compatibility: compatible-for-public-display-and-transformed-redistribution\nKaggle source: ${entry.exactSourceMapping.datasetVersionUrl}\nKaggle license: ${entry.kaggle.license.label}\nPublic derivative SHA-256: ${entry.sha256}\nAttribution: ${entry.attribution}\nKaggle file: ${entry.exactSourceMapping.datasetFilePath}\nKaggle file bytes: ${entry.exactSourceMapping.datasetFileBytes}` },
      { ref: 'osamahosamabdellatif/high-quality-invoice-images-for-ocr', ownerRef: 'osamahosamabdellatif', licenseName: entry.kaggle.license.label, versions: [{ versionNumber: 1 }] },
      { datasetFiles: [{ name: 'source-file.jpg', totalBytes: 12345 }], nextPageToken: null },
    ];
    const fetchImpl = async () => ({ ok: true, status: 200, json: async () => responses.shift() });
    expect(await verifyRemoteApprovalEvidence(value, fetchImpl)).toEqual([]);

    const fabricated = structuredClone(value);
    const fakeResponses = [
      { html_url: fabricated.assets[0].approval.evidence, user: { login: 'attacker' }, author_association: 'NONE', body: '' },
      { ref: 'wrong/source', ownerRef: 'attacker', licenseName: 'placeholder', versions: [] },
      { datasetFiles: [], nextPageToken: null },
    ];
    const fakeFetch = async () => ({ ok: true, status: 200, json: async () => fakeResponses.shift() });
    expect((await verifyRemoteApprovalEvidence(fabricated, fakeFetch)).join('\n')).toMatch(/owner-authored issue #50 comment/);
    expect((await verifyRemoteApprovalEvidence(fabricated, async () => ({ ok: false, status: 404, json: async () => ({}) }))).join('\n')).toMatch(/first-party evidence request failed/);
  });

  it('requires first-party notebook metadata to confirm the exact version number', async () => {
    const value = manifest();
    const entry = value.assets[0];
    entry.approvalStatus = 'approved';
    entry.provenanceStatus = 'confirmed';
    entry.provenanceConfidence = 'high';
    entry.kaggle.sourceUrl = 'https://www.kaggle.com/code/osamahosamabdellatif/invoice-ocr-notebook';
    entry.kaggle.license.sourceEvidenceUrl = entry.kaggle.sourceUrl;
    entry.exactSourceMapping = { status: 'confirmed', kind: 'notebook', notebookVersionNumber: 42 };
    entry.licenseCompatibility = 'compatible';
    entry.downloadedAt = '2026-08-30T00:00:00Z';
    entry.attribution = 'Notebook attribution recorded.';
    entry.approval = { approvedBy: 'Viv', approvedAt: '2026-09-07T00:00:00Z', evidence: 'https://github.com/vivekpatel99/my-portfolio-webisite/issues/50#issuecomment-123' };
    entry.licenseReview = { reviewedBy: 'Viv', reviewedAt: '2026-09-07T00:00:00Z', conclusion: 'compatible-for-public-display-and-transformed-redistribution', evidence: entry.approval.evidence };
    entry.resolutionNeeded = null;
    const comment = { html_url: entry.approval.evidence, user: { login: 'vivekpatel99' }, author_association: 'OWNER', body: `Asset provenance approval: ${entry.path}\nLicense compatibility: compatible-for-public-display-and-transformed-redistribution\nKaggle source: ${entry.kaggle.sourceUrl}\nKaggle license: ${entry.kaggle.license.label}\nPublic derivative SHA-256: ${entry.sha256}\nAttribution: ${entry.attribution}\nKaggle notebook version: 42` };
    const wrongVersion = [comment, { metadata: { ref: 'osamahosamabdellatif/invoice-ocr-notebook', currentVersionNumber: 41 } }];
    const calls = [];
    const fetchImpl = async (url, options) => {
      calls.push({ url, options });
      return { ok: true, status: 200, json: async () => wrongVersion.shift() };
    };
    expect((await verifyRemoteApprovalEvidence(value, fetchImpl)).join('\n')).toMatch(/did not confirm the exact notebook owner, slug, and version number/);
    expect(JSON.parse(calls[1].options.body)).toEqual({ userName: 'osamahosamabdellatif', kernelSlug: 'invoice-ocr-notebook/42' });
  });

  it('enforces demonstration-only, non-client-outcome evidence semantics', () => {
    const value = manifest();
    value.assets[0].evidenceRole = 'client-outcome';
    value.assets[1].clientOutcomeEvidence = true;
    expect(audit(value).errors.join('\n')).toMatch(/evidenceRole must be demonstration/);
    expect(audit(value).errors.join('\n')).toMatch(/clientOutcomeEvidence must be false/);
  });

  it('rejects every unresolved entry in deploy mode', () => {
    const result = verifyCaseStudyProvenance({ manifest: manifest(), mode: 'deploy' });
    expect(result.warnings).toEqual([]);
    expect(result.errors).toHaveLength(5);
    expect(result.errors.filter((error) => error.includes('approval is unresolved'))).toHaveLength(5);
  });
});
