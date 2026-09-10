import { createHash } from 'node:crypto';
import { lstatSync, readFileSync } from 'node:fs';
import path from 'node:path';

export const BASELINE_COMMIT = '08c2853123c89b4061c72b9432588d619a1cc875';

// These are the only hashes covered by the issue #43 retention boundary.
// They deliberately make the baseline marker unusable for changed or new data.
export const baselineApprovalHashes = {
  records: {
    'n8n-openai-data-extraction': '1453b422960569b0f5cadbac841d1eb6f8ec9cdf0164312d4ac0786d579cf43c',
    'invoice-ocr-extraction': '9a67de633d2827499987bff8593f87d3f875cb33580d43bebdf16aa11c758b2e',
    'yolo-computer-vision-optimization': 'd7979798a13b84abf63d2eb47a109e183a475183fea4592ed32b81928ac98910',
  },
  claims: {
    'n8n-openai-data-extraction.upwork-project': '2c48783d6880f16b9996886fa57c09378c312aef1a5fa7c5e0aa780b78beaa88',
    'invoice-ocr-extraction.upwork-project': '317b237388ac3ec91abc0a50793d814e7e483991a6c7bbe84ce5f6bfb9d80eb5',
    'yolo-computer-vision-optimization.upwork-project': '03a7bd17524fe1fa75ee3fa0248915a6352b44bdebee51c123f0999c1fffeb6c',
    'yolo-computer-vision-optimization.related-github': '4639c6ca44ff998934b73b62d0b8194fc848f10897e475b793820679c6986a2f',
    'n8n-openai-data-extraction.summary': '03ba2e7f135b7c2be9c5a30f822d8fb7c84455b44db7a5b6da4be228777f4449',
    'n8n-openai-data-extraction.outcome': '64c5c5222ef5c3cfd1f99758f217cec299a0249443bcedc6a108b1a6ce1d036e',
    'n8n-openai-data-extraction.stats.0': '1515e6782a6271c0357ab99b4e16548e4f45b4e37075b13cd1f614c19ee53ca7',
    'n8n-openai-data-extraction.stats.1': 'e90f4957628948ab6dbb74eb50788063c68d1cc098f67784e3edcc275d0863d5',
    'invoice-ocr-extraction.summary': '242d45f015c4e57a5e7f3f3d1611041bd794baa2518377ab51e40d9728e0c747',
    'invoice-ocr-extraction.outcome': 'da94866144a1fc861c8c64bafd883ea9883e8b2f32d4adaf4dbb324b1e614cac',
    'invoice-ocr-extraction.stats.0': '0d13ca2e51b12dca135ac50a133baebe559f7447fbac1ca329d9e16071dea09e',
    'invoice-ocr-extraction.stats.1': 'c29c9e528070713f9ebbbac16bc8c64d564cd278a3255b7869e71ef2b1b7764f',
    'yolo-computer-vision-optimization.summary': '4ee358c5cac3bb31484f823becf0671caf0600cc4b070385c211e5efeb92fa39',
    'yolo-computer-vision-optimization.outcome': '6a304fc01766af730d5292b9b5ca47c87222b52bdab21ce7c9831b04b1656ef3',
    'yolo-computer-vision-optimization.stats.0': '4a032c9e23c7745eba31375b5b3e22d5487cf7334b4dd5079b20f345f0de2c6e',
    'yolo-computer-vision-optimization.stats.1': 'b283ec7d4a63a389a3fb7f0d2a8635e260b50f217a0b805c51c640e4912d22eb',
    'yolo-computer-vision-optimization.stats.2': '11a0f464d4e75828ec170395aa13afa53a6bd5e17d82d0b7fafaae44f3d673f1',
  },
  assets: {
    '/assets/case-studies/planning-graph.webp': '483e16b2c3afb3bf6273821ce09d831d07ae5a00ffce8c2b8e24b202062e41a8',
    '/assets/case-studies/invoice-ocr.webp': 'e6814512a97562f6ead7cd563262c97ffe80cd8ddd36408db2da67b50479b5b4',
    '/assets/case-studies/yoga-pose.webp': 'a1c141cdaa34086f779a22bbc54861dd5a0b6bd6c956df38456a3313983c2c0c',
    '/assets/case-studies/football-tracking.mp4': 'e8f90196e5e6edcef0ad11eefb8739f8c16b936217ea84109c33fe4ca7b12369',
    '/assets/case-studies/football-tracking.webp': '8b16e0d29b7ec6b933a17605fc351e87b00f1e0841db5000d4b4366957530b53',
  },
};

export const digest = (value) => createHash('sha256').update(Buffer.isBuffer(value) ? value : typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');

export const isValidApprovalEvidenceUrl = (value) => {
  if (typeof value !== 'string' || value.trim() !== value || /[\\\x00-\x1f\x7f]/.test(value)) return false;
  let url;
  try { url = new URL(value); } catch { return false; }
  return url.protocol === 'https:' && Boolean(url.hostname) && !url.username && !url.password;
};

export const isValidApprovalTimestamp = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) return false;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return false;
  const canonical = parsed.toISOString();
  return value === canonical || value === canonical.replace('.000Z', 'Z');
};

export const assertApproval = (approval, expectedHash, baselineHash, label) => {
  if (!approval || typeof approval !== 'object') throw new Error(`Case-study publication manifest: ${label} requires an approval record`);
  if (approval.kind === 'baseline-retention') {
    if (approval.baselineCommit !== BASELINE_COMMIT || approval.authorization !== 'Issue #43 unchanged-content retention authorization' || baselineHash !== expectedHash || approval.sha256 !== baselineHash) throw new Error(`Case-study publication manifest: ${label} is not an exact baseline retention`);
    return;
  }
  const validDate = isValidApprovalTimestamp(approval.approvedAt);
  const validEvidence = isValidApprovalEvidenceUrl(approval.evidence);
  if (approval.kind !== 'explicit' || approval.sha256 !== expectedHash || typeof approval.approvedBy !== 'string' || !approval.approvedBy.trim() || approval.approvedBy.trim() !== approval.approvedBy || !validDate || !validEvidence) throw new Error(`Case-study publication manifest: ${label} requires explicit approval with a matching hash`);
};

export const assertRealDirectory = (directory, label) => {
  const parsed = path.parse(directory);
  for (let current = path.resolve(directory); ; current = path.dirname(current)) {
    const info = lstatSync(current);
    if (!info.isDirectory()) throw new Error(`Case-study publication manifest: ${label} must be a real directory`);
    if (current === parsed.root) break;
  }
};

export const assertApprovedAsset = ({ root, publicPath, asset, approval }) => {
  if (asset.file !== `public${publicPath}`) throw new Error(`Case-study publication manifest: asset ${publicPath} must use its canonical public path`);
  assertApproval(approval, approval?.sha256, baselineApprovalHashes.assets[publicPath], `asset ${publicPath}`);
  assertRealDirectory(root, 'repository root');
  const file = path.join(root, asset.file);
  assertRealDirectory(path.dirname(file), `asset parent for ${publicPath}`);
  const info = lstatSync(file);
  if (!info.isFile()) throw new Error(`Case-study publication manifest: asset ${publicPath} must be a regular file`);
  if (digest(readFileSync(file)) !== approval.sha256) throw new Error(`Case-study publication manifest: asset ${publicPath} bytes changed without approval`);
};
