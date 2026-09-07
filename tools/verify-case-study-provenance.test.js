// @vitest-environment node
import { mkdirSync, mkdtempSync, readFileSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { DEFAULT_MANIFEST_PATH, inspectAssetMetadata, readManifest, verifyCaseStudyProvenance } from './verify-case-study-provenance.js';

const manifest = () => structuredClone(readManifest(DEFAULT_MANIFEST_PATH));
const audit = (value) => verifyCaseStudyProvenance({ manifest: value, mode: 'audit' });

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

  it('fails an embedded identifying MP4 title atom', () => {
    const original = readFileSync('public/assets/case-studies/football-tracking.mp4');
    const injected = Buffer.concat([original, Buffer.from([0xa9, 0x6e, 0x61, 0x6d])]);
    const football = manifest().assets.find((entry) => entry.path.endsWith('.mp4'));
    expect(inspectAssetMetadata('football-tracking.mp4', injected, football.metadataExpectation).join('\n'))
      .toMatch(/embedded identifying metadata atom ©nam/);
  });

  it('requires complete Kaggle provenance and explicit approval before an entry can be approved', () => {
    const approved = () => {
      const value = manifest();
      const entry = value.assets[0];
      entry.approvalStatus = 'approved';
      entry.provenanceStatus = 'confirmed';
      entry.licenseCompatibility = 'compatible';
      entry.downloadedAt = '2026-08-30T00:00:00Z';
      entry.kaggle.exactDatasetFileVersion = 'source-file.jpg@version-1';
      entry.attribution = 'Dataset attribution recorded.';
      entry.approval = { approvedBy: 'reviewer', approvedAt: '2026-09-07T00:00:00Z', evidence: 'approval record' };
      return value;
    };
    const value = approved();
    const entry = value.assets[0];
    expect(audit(value).errors).toEqual([]);
    const notebook = approved();
    notebook.assets[0].kaggle.datasetUrl = 'https://www.kaggle.com/code/osamahosamabdellatif/invoice-ocr-notebook';
    expect(audit(notebook).errors).toEqual([]);

    const requirements = [
      [/confirmed provenance/, (asset) => { asset.provenanceStatus = 'unresolved'; }],
      [/compatible public-display/, (asset) => { asset.licenseCompatibility = 'incompatible'; }],
      [/exact Kaggle dataset or notebook URL/, (asset) => { asset.kaggle.datasetUrl = 'https://www.kaggle.com/datasets/other/wrong'; }],
      [/Kaggle owner/, (asset) => { asset.kaggle.owner = ''; }],
      [/explicit license and license URL/, (asset) => { asset.kaggle.license.urls = []; }],
      [/require attribution/, (asset) => { asset.attribution = null; }],
      [/require transformationHistory/, (asset) => { asset.transformationHistory = []; }],
      [/source download date or explicit unknown-date reason/, (asset) => { asset.downloadedAt = null; asset.downloadedAtReason = null; }],
      [/require an exact dataset file or version/, (asset) => { asset.kaggle.exactDatasetFileVersion = null; }],
      [/require explicit approval evidence/, (asset) => { asset.approval = null; }],
    ];
    for (const [message, removeRequirement] of requirements) {
      const invalid = approved();
      removeRequirement(invalid.assets[0]);
      expect(audit(invalid).errors.join('\n')).toMatch(message);
    }
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
