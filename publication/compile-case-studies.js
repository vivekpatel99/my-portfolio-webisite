import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { caseStudyPublicationManifest } from './case-study-manifest.js';
import { assertApprovedAsset, assertApproval, baselineApprovalHashes, digest } from './case-study-evidence.js';
import { assertMedia, assertSafeExternalUrl, assertStat, assertString, exactKeys, fail, slugPattern } from './case-study-schema.js';
import { validatePreparedCaseStudies } from './markdown-case-study.js';

export const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const caseStudyAssetPrefix = '/assets/case-studies/';

const publicRecordFields = new Set(['title', 'cardTitle', 'category', 'summary', 'challenge', 'solution', 'outcome', 'stats', 'image', 'gallery', 'stack', 'externalLinks']);
const articleRecordFields = new Set(['title', 'summary', 'category', 'sections', 'image']);

const caseStudyAssetUrls = (content) => [content.image, ...(content.gallery ?? [])]
  .flatMap((item) => [item?.src, item?.poster].filter(Boolean));

const claimHash = (id, claim) => digest({ id, type: claim.type, recordId: claim.recordId, placement: claim.placement, value: claim.value });

const assertContentClaim = (manifest, record, claimRef, placement, value) => {
  const claim = manifest.claims?.[claimRef];
  if (!claim || claim.type !== 'content' || claim.recordId !== record.id || claim.placement !== placement || JSON.stringify(claim.value) !== JSON.stringify(value)) fail(`claim ${claimRef} must bind ${record.id} ${placement} to its exact value`);
  assertApproval(claim.approval, claimHash(claimRef, claim), baselineApprovalHashes.claims[claimRef], `claim ${claimRef}`);
};

const articleSection = (key, heading, value) => ({
  key,
  heading,
  nodes: [{ type: 'paragraph', children: [{ type: 'text', value }] }],
});

const legacySections = (content) => [
  articleSection('problem', 'The problem', content.challenge),
  articleSection('built', 'What I built', content.solution),
  articleSection('outcome', 'The outcome', content.outcome),
];

const compiledArticle = (manifest, record, root) => {
  const content = record.content;
  exactKeys(content, [...articleRecordFields], `published ${record.slug} article content`);
  for (const field of ['title', 'summary']) assertString(content[field], `published ${record.slug} ${field}`);
  if (content.category !== undefined) assertString(content.category, `published ${record.slug} category`);
  validatePreparedCaseStudies([{
    id: record.id,
    slug: record.slug,
    title: content.title,
    summary: content.summary,
    ...(content.category === undefined ? {} : { category: content.category }),
    sections: content.sections,
  }], `published ${record.slug}`);
  if (content.image !== undefined) assertMedia(content.image, `published ${record.slug} image`);
  for (const assetUrl of content.image ? [content.image.src, content.image.poster].filter(Boolean) : []) {
    if (!/^\/assets\/case-studies\/[A-Za-z0-9][A-Za-z0-9._-]*$/.test(assetUrl)) fail(`published ${record.slug} has an unsafe case-study asset path`);
    const asset = manifest.assets?.[assetUrl];
    if (!asset || typeof asset.file !== 'string') fail(`published ${record.slug} references an unapproved asset: ${assetUrl}`);
    assertApprovedAsset({ root, publicPath: assetUrl, asset, approval: asset.approval });
  }
  exactKeys(record.claimRefs, ['summary', 'outcome'], `published ${record.slug} claim references`);
  assertContentClaim(manifest, record, record.claimRefs.summary, 'summary', content.summary);
  assertContentClaim(manifest, record, record.claimRefs.outcome, 'outcome', content.sections[2]);
  return {
    id: record.id,
    slug: record.slug,
    title: content.title,
    summary: content.summary,
    ...(content.category === undefined ? {} : { category: content.category }),
    sections: content.sections,
    ...(content.image === undefined ? {} : { image: { ...content.image } }),
  };
};

export function compileCaseStudyPublication({ manifest = caseStudyPublicationManifest, root = repositoryRoot } = {}) {
  if (manifest?.schemaVersion !== 1) fail('uses an unsupported schema version');
  if (!Array.isArray(manifest.records)) fail('records must be an array');
  const ids = new Set();
  const slugs = new Set();
  const publicRecords = [];
  for (const record of manifest.records) {
    if (!record || typeof record !== 'object' || typeof record.id !== 'string' || !slugPattern.test(record.id) || typeof record.slug !== 'string' || !slugPattern.test(record.slug)) fail('every record requires a unique safe id and slug');
    if (ids.has(record.id) || slugs.has(record.slug)) fail(`contains a duplicate id or slug: ${record.id}/${record.slug}`);
    ids.add(record.id); slugs.add(record.slug);
    if (record.status === 'draft') {
      exactKeys(record, ['id', 'slug', 'status'], `draft ${record.slug}`);
      continue;
    }
    if (record.status !== 'published') fail(`${record.slug} has an unsupported status`);
    if (record.variant === 'article') {
      exactKeys(record, ['id', 'slug', 'status', 'variant', 'approval', 'claimRefs', 'content'], `published ${record.slug}`);
      assertApproval(record.approval, digest({ id: record.id, slug: record.slug, content: record.content }), undefined, `published ${record.slug}`);
      publicRecords.push(compiledArticle(manifest, record, root));
      continue;
    }
    exactKeys(record, ['id', 'slug', 'status', 'approval', 'claimRefs', 'content'], `published ${record.slug}`);
    exactKeys(record.content, [...publicRecordFields], `published ${record.slug} content`);
    assertApproval(record.approval, digest({ id: record.id, slug: record.slug, content: record.content }), baselineApprovalHashes.records[record.id], `published ${record.slug}`);
    if (!Array.isArray(record.content.externalLinks) || !Array.isArray(record.content.gallery)) fail(`published ${record.slug} requires external links and gallery arrays`);
    for (const field of ['title', 'cardTitle', 'category', 'summary', 'challenge', 'solution', 'outcome']) assertString(record.content[field], `published ${record.slug} ${field}`);
    if (!Array.isArray(record.content.stats) || !Array.isArray(record.content.stack) || record.content.stack.length === 0) fail(`published ${record.slug} requires non-empty stats and stack arrays`);
    record.content.stats.forEach((stat, index) => assertStat(stat, `published ${record.slug} stat ${index + 1}`));
    record.content.stack.forEach((item, index) => assertString(item, `published ${record.slug} stack ${index + 1}`));
    assertMedia(record.content.image, `published ${record.slug} image`);
    record.content.gallery.forEach((media, index) => assertMedia(media, `published ${record.slug} gallery ${index + 1}`));
    exactKeys(record.claimRefs, ['summary', 'outcome', 'stats'], `published ${record.slug} claim references`);
    assertContentClaim(manifest, record, record.claimRefs.summary, 'summary', record.content.summary);
    assertContentClaim(manifest, record, record.claimRefs.outcome, 'outcome', record.content.outcome);
    if (!Array.isArray(record.claimRefs.stats) || record.claimRefs.stats.length !== record.content.stats.length) fail(`published ${record.slug} needs one stat claim per rendered stat`);
    record.claimRefs.stats.forEach((claimRef, index) => assertContentClaim(manifest, record, claimRef, `stats.${index}`, record.content.stats[index]));
    const externalLinks = record.content.externalLinks.map((link, index) => {
      exactKeys(link, ['label', 'claimRef'], `published ${record.slug} external link ${index + 1}`);
      assertString(link.label, `published ${record.slug} external link ${index + 1} label`);
      assertString(link.claimRef, `published ${record.slug} external link ${index + 1} claim reference`);
      const claim = manifest.claims?.[link.claimRef];
      if (!claim || claim.type !== 'external-link') fail(`published ${record.slug} external link ${index + 1} must reference an approved external-link claim`);
      if (claim.recordId !== record.id || claim.placement !== `externalLinks.${index}`) fail(`claim ${link.claimRef} has an invalid record placement`);
      assertApproval(claim.approval, claimHash(link.claimRef, claim), baselineApprovalHashes.claims[link.claimRef], `claim ${link.claimRef}`);
      assertSafeExternalUrl(claim.value, `claim ${link.claimRef}`);
      return { label: link.label, href: claim.value };
    });
    for (const assetUrl of caseStudyAssetUrls(record.content)) {
      if (!/^\/assets\/case-studies\/[A-Za-z0-9][A-Za-z0-9._-]*$/.test(assetUrl)) fail(`published ${record.slug} has an unsafe case-study asset path`);
      const asset = manifest.assets?.[assetUrl];
      if (!asset || typeof asset.file !== 'string') fail(`published ${record.slug} references an unapproved asset: ${assetUrl}`);
      assertApprovedAsset({ root, publicPath: assetUrl, asset, approval: asset.approval });
    }
    publicRecords.push({
      id: record.id, slug: record.slug, title: record.content.title,
      category: record.content.category, summary: record.content.summary,
      sections: legacySections(record.content),
      image: { src: record.content.image.src, alt: record.content.image.alt, ...(record.content.image.poster ? { poster: record.content.image.poster } : {}) },
    });
  }
  return publicRecords;
}

export const renderPublicCaseStudyModule = (publication = compileCaseStudyPublication()) => `// Generated in-memory by vite-plugin-case-study-publication.\nexport const caseStudies = ${JSON.stringify(publication)};\nexport const featuredCaseStudies = caseStudies;\nexport const getCaseStudyBySlug = (slug) => caseStudies.find((caseStudy) => caseStudy.slug === slug);\nexport const caseStudySlugs = caseStudies.map((caseStudy) => caseStudy.slug);\nexport const primaryContactHref = '/contact/';\nexport const directEmailHref = 'mailto:contact@vivekpatel.com';\n`;
