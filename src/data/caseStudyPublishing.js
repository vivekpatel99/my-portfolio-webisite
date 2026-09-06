export const PUBLISHING_STATUS = Object.freeze({
  DRAFT: 'draft',
  PUBLISHED: 'published',
});

const ALLOWED_STATUSES = new Set(Object.values(PUBLISHING_STATUS));
const DRAFT_RECORD_KEYS = new Set(['id', 'publishingStatus', 'publicationApproved']);
const PUBLISHED_RECORD_KEYS = new Set(['id', 'publishingStatus', 'publicationApproved', 'portfolioSafeContent']);
const PUBLIC_CONTENT_KEYS = new Set([
  'slug', 'title', 'cardTitle', 'category', 'summary', 'image', 'gallery', 'stack',
  'claims', 'story', 'links',
]);
const STORY_KEYS = new Set([
  'situation', 'constraints', 'interpretationNotice', 'decisions', 'approach', 'evidence', 'result',
  'limitations', 'relatedExperience',
]);
const APPROVED_EXTERNAL_HREFS = new Set([
  'https://www.upwork.com/freelancers/vivekpatel99?p=1981676982472949760',
  'https://www.upwork.com/freelancers/vivekpatel99?p=1961697513038176256',
  'https://www.upwork.com/freelancers/vivekpatel99?p=1962080616292315136',
]);

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const hasText = (value) => typeof value === 'string' && value.trim().length > 0;
const hasOnlyKeys = (value, allowedKeys) => Object.keys(value).every((key) => allowedKeys.has(key));
const isSafeRelativePath = (value) => (
  hasText(value)
  && /^\/[A-Za-z0-9/_#.-]*$/.test(value)
  && !value.startsWith('//')
  && !value.includes('..')
);
const isSafeFirstPartyAssetPath = (value) => hasText(value) && /^\/assets\/[A-Za-z0-9/_-]+(?:\.[A-Za-z0-9]+)+$/.test(value);
const isApprovedExternalHref = (value) => {
  if (!hasText(value) || !APPROVED_EXTERNAL_HREFS.has(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'www.upwork.com' && !url.username && !url.password;
  } catch {
    return false;
  }
};
const isSafeLinkHref = (value) => isSafeRelativePath(value) || isApprovedExternalHref(value);

const requireText = (value, path, errors) => {
  if (!hasText(value)) errors.push(`${path} must be a non-empty string`);
};

const validateImage = (image, path, errors) => {
  if (!isObject(image)) {
    errors.push(`${path} must be an object`);
    return;
  }
  if (!hasOnlyKeys(image, new Set(['kind', 'src', 'alt', 'label', 'caption']))) {
    errors.push(`${path} includes fields outside the portfolio-safe media envelope`);
  }
  if (!['image', 'schematic'].includes(image.kind)) {
    errors.push(`${path}.kind must be image or schematic`);
  }
  requireText(image.alt, `${path}.alt`, errors);
  requireText(image.label, `${path}.label`, errors);
  requireText(image.caption, `${path}.caption`, errors);
  if (image.kind === 'image' && !isSafeFirstPartyAssetPath(image.src)) {
    errors.push(`${path}.src must be a safe first-party asset path`);
  }
  if (image.kind === 'schematic' && image.src !== undefined) {
    errors.push(`${path}.src is not permitted for schematic media`);
  }
};

const validateTextList = (items, path, errors, { nonEmpty = true } = {}) => {
  if (!Array.isArray(items) || (nonEmpty && items.length === 0)) {
    errors.push(`${path} must be a ${nonEmpty ? 'non-empty ' : ''}array`);
    return;
  }
  items.forEach((item, index) => requireText(item, `${path}[${index}]`, errors));
};

const validateGallery = (items, path, errors) => {
  if (!Array.isArray(items)) {
    errors.push(`${path} must be an array`);
    return;
  }
  items.forEach((item, index) => validateImage(item, `${path}[${index}]`, errors));
};

const validateStory = (story, path, errors) => {
  if (!isObject(story)) {
    errors.push(`${path} must be an object`);
    return;
  }
  if (!hasOnlyKeys(story, STORY_KEYS)) {
    errors.push(`${path} includes fields outside the portfolio-safe content envelope`);
  }
  requireText(story.situation, `${path}.situation`, errors);
  requireText(story.interpretationNotice, `${path}.interpretationNotice`, errors);
  ['constraints', 'decisions', 'approach', 'evidence', 'result', 'limitations'].forEach((section) => {
    validateTextList(story[section], `${path}.${section}`, errors);
  });
  if (!isObject(story.relatedExperience)) {
    errors.push(`${path}.relatedExperience must be an object`);
    return;
  }
  if (!hasOnlyKeys(story.relatedExperience, new Set(['status', 'text', 'links']))) {
    errors.push(`${path}.relatedExperience includes fields outside the portfolio-safe content envelope`);
  }
  if (story.relatedExperience.status !== 'not-provided') {
    errors.push(`${path}.relatedExperience.status must be not-provided until a case-specific credential is approved`);
  }
  requireText(story.relatedExperience.text, `${path}.relatedExperience.text`, errors);
  validateLinkList(story.relatedExperience.links, `${path}.relatedExperience.links`, errors, { allowEmpty: true });
};

const validateLinkList = (links, path, errors, { allowEmpty = false } = {}) => {
  if (!Array.isArray(links) || (!allowEmpty && links.length === 0)) {
    errors.push(`${path} must be a ${allowEmpty ? '' : 'non-empty '}array`);
    return;
  }
  const hrefs = new Set();
  links.forEach((link, index) => {
    const linkPath = `${path}[${index}]`;
    if (!isObject(link) || !hasOnlyKeys(link, new Set(['label', 'href']))) {
      errors.push(`${linkPath} must contain only label and href`);
      return;
    }
    requireText(link.label, `${linkPath}.label`, errors);
    if (!isSafeLinkHref(link.href)) {
      errors.push(`${linkPath}.href must be a safe first-party path or approved HTTPS Upwork URL`);
    } else if (hrefs.has(link.href)) {
      errors.push(`${linkPath}.href duplicates another link`);
    } else {
      hrefs.add(link.href);
    }
  });
};

const validateClaims = (claims, path, errors) => {
  if (!Array.isArray(claims) || claims.length === 0) {
    errors.push(`${path} must be a non-empty array`);
    return;
  }
  const references = new Set();
  claims.forEach((claim, index) => {
    const claimPath = `${path}[${index}]`;
    if (!isObject(claim) || !hasOnlyKeys(claim, new Set(['id', 'placement']))) {
      errors.push(`${claimPath} must contain only id and placement`);
      return;
    }
    requireText(claim.id, `${claimPath}.id`, errors);
    requireText(claim.placement, `${claimPath}.placement`, errors);
    const reference = `${claim.id}::${claim.placement}`;
    if (references.has(reference)) errors.push(`${claimPath} duplicates a claim reference`);
    references.add(reference);
  });
};

export function validateCaseStudyPublishing(records) {
  const errors = [];
  if (!Array.isArray(records)) {
    throw new Error('Case-study publication records must be an array');
  }

  const ids = new Set();
  const slugs = new Set();
  records.forEach((record, index) => {
    const path = `records[${index}]`;
    if (!isObject(record)) {
      errors.push(`${path} must be an object`);
      return;
    }
    requireText(record.id, `${path}.id`, errors);
    if (ids.has(record.id)) errors.push(`${path}.id duplicates another record`);
    ids.add(record.id);
    if (!ALLOWED_STATUSES.has(record.publishingStatus)) {
      errors.push(`${path}.publishingStatus must be explicit and recognized`);
      return;
    }

    if (record.publishingStatus !== PUBLISHING_STATUS.PUBLISHED) {
      if (!hasOnlyKeys(record, DRAFT_RECORD_KEYS)) {
        errors.push(`${path} is unpublished and may contain metadata only`);
      }
      if (record.publicationApproved !== false) {
        errors.push(`${path}.publicationApproved must be false while unpublished`);
      }
      return;
    }

    if (record.publicationApproved !== true) {
      errors.push(`${path}.publicationApproved must be true before publication`);
    }
    if (!hasOnlyKeys(record, PUBLISHED_RECORD_KEYS)) {
      errors.push(`${path} includes fields outside the published portfolio-safe envelope`);
    }
    if (!isObject(record.portfolioSafeContent)) {
      errors.push(`${path}.portfolioSafeContent is required for published records`);
      return;
    }
    const content = record.portfolioSafeContent;
    if (!hasOnlyKeys(content, PUBLIC_CONTENT_KEYS)) {
      errors.push(`${path}.portfolioSafeContent includes fields outside the allowlisted public envelope`);
    }
    ['slug', 'title', 'cardTitle', 'category', 'summary'].forEach((field) => requireText(content[field], `${path}.portfolioSafeContent.${field}`, errors));
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(content.slug ?? '')) {
      errors.push(`${path}.portfolioSafeContent.slug must be a lowercase route segment`);
    } else if (slugs.has(content.slug)) {
      errors.push(`${path}.portfolioSafeContent.slug duplicates another published record`);
    } else {
      slugs.add(content.slug);
    }
    validateImage(content.image, `${path}.portfolioSafeContent.image`, errors);
    validateGallery(content.gallery, `${path}.portfolioSafeContent.gallery`, errors);
    validateTextList(content.stack, `${path}.portfolioSafeContent.stack`, errors);
    validateClaims(content.claims, `${path}.portfolioSafeContent.claims`, errors);
    validateStory(content.story, `${path}.portfolioSafeContent.story`, errors);
    if (!isObject(content.links) || !hasOnlyKeys(content.links, new Set(['service', 'clientFeedback', 'proof']))) {
      errors.push(`${path}.portfolioSafeContent.links must contain only service, clientFeedback, and proof`);
    } else {
      validateLinkList(content.links.service, `${path}.portfolioSafeContent.links.service`, errors);
      validateLinkList(content.links.clientFeedback, `${path}.portfolioSafeContent.links.clientFeedback`, errors, { allowEmpty: true });
      validateLinkList(content.links.proof, `${path}.portfolioSafeContent.links.proof`, errors, { allowEmpty: true });
    }
  });

  if (errors.length > 0) {
    throw new Error(`Invalid case-study publication data:\n- ${errors.join('\n- ')}`);
  }
}

export function validatePublishedClaimReferences(records, claimLedger) {
  const errors = [];
  if (!Array.isArray(claimLedger)) throw new Error('Claim ledger must be an array');
  const ledgerById = new Map(claimLedger.map((claim) => [claim.id, claim]));

  records
    .filter((record) => record.publishingStatus === PUBLISHING_STATUS.PUBLISHED)
    .forEach((record) => {
      record.portfolioSafeContent.claims.forEach(({ id, placement }) => {
        const claim = ledgerById.get(id);
        if (!claim) {
          errors.push(`${record.id} references unknown claim ${id}`);
        } else if (claim.classification !== 'verified') {
          errors.push(`${record.id} references non-public claim ${id}`);
        } else if (!claim.allowedPlacement.includes(placement)) {
          errors.push(`${record.id} places claim ${id} at ${placement}, which is not allowed`);
        }
      });
    });

  if (errors.length > 0) {
    throw new Error(`Invalid published case-study claim references:\n- ${errors.join('\n- ')}`);
  }
}

const projectPublicContent = (record) => {
  const content = record.portfolioSafeContent;
  const claimIds = content.claims.map(({ id }) => id);
  const claimPlacement = content.claims[0].placement;
  const story = Object.freeze({
    ...content.story,
    relatedExperience: Object.freeze({
      ...content.story.relatedExperience,
      links: Object.freeze([...content.story.relatedExperience.links]),
    }),
  });
  return Object.freeze({
    id: record.id,
    slug: content.slug,
    title: content.title,
    cardTitle: content.cardTitle,
    category: content.category,
    summary: content.summary,
    image: Object.freeze({ ...content.image }),
    gallery: Object.freeze([...content.gallery]),
    stack: Object.freeze([...content.stack]),
    claimIds: Object.freeze(claimIds),
    claimPlacement,
    story,
    links: Object.freeze({
      service: Object.freeze(content.links.service.map((link) => Object.freeze({ ...link }))),
      clientFeedback: Object.freeze(content.links.clientFeedback.map((link) => Object.freeze({ ...link }))),
      proof: Object.freeze(content.links.proof.map((link) => Object.freeze({ ...link }))),
    }),
    // Existing consumers use these while the richer story UI is adopted.
    challenge: content.story.situation,
    solution: content.story.approach[0],
    outcome: content.story.limitations[0],
    externalLinks: Object.freeze([...content.links.service, ...content.links.proof].map((link) => Object.freeze({ ...link }))),
  });
};

export function publishCaseStudies(records) {
  validateCaseStudyPublishing(records);
  return Object.freeze(records
    .filter((record) => record.publishingStatus === PUBLISHING_STATUS.PUBLISHED)
    .map(projectPublicContent));
}
