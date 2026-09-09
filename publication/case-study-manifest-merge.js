const assertStore = (store, label) => {
  if (!store || !Array.isArray(store.records) || !store.claims || typeof store.claims !== 'object' || Array.isArray(store.claims)) {
    throw new Error(`${label} must contain records and claims`);
  }
};

const identity = (record, label) => {
  if (!record || typeof record !== 'object' || typeof record.id !== 'string' || typeof record.slug !== 'string') {
    throw new Error(`${label} records must have string ids and slugs`);
  }
  return record;
};

const validateUniqueIdentities = (records, label) => {
  const ids = new Set();
  const slugs = new Set();
  records.forEach((record, index) => {
    identity(record, `${label} record ${index + 1}`);
    if (ids.has(record.id) || slugs.has(record.slug)) throw new Error(`${label} contains duplicate id or slug: ${record.id}/${record.slug}`);
    ids.add(record.id);
    slugs.add(record.slug);
  });
};

/** Merge generated reviewed records into the stable legacy baseline. */
export const mergeCaseStudyManifest = (baseManifest, stagedStore) => {
  if (!baseManifest || typeof baseManifest !== 'object') throw new Error('Case-study baseline manifest is required');
  assertStore(baseManifest, 'Baseline manifest');
  assertStore(stagedStore, 'Staged publication store');
  // Validate the raw arrays before indexing them so duplicate inputs cannot be
  // silently collapsed by a Map.
  validateUniqueIdentities(baseManifest.records, 'Baseline manifest');
  validateUniqueIdentities(stagedStore.records, 'Staged publication store');

  const baseById = new Map(baseManifest.records.map((record) => [record.id, record]));
  const baseBySlug = new Map(baseManifest.records.map((record) => [record.slug, record]));
  for (const record of stagedStore.records) {
    const prior = baseById.get(record.id);
    if (prior && prior.slug !== record.slug) throw new Error(`Reviewed candidate ${record.id} must preserve its existing slug ${prior.slug}`);
    const slugOwner = baseBySlug.get(record.slug);
    if (slugOwner && slugOwner.id !== record.id) throw new Error(`Reviewed candidate ${record.id} uses a slug owned by ${slugOwner.id}`);
  }

  const stagedById = new Map(stagedStore.records.map((record) => [record.id, record]));
  const records = [
    ...baseManifest.records.map((record) => stagedById.get(record.id) ?? record),
    ...stagedStore.records.filter((record) => !baseById.has(record.id)),
  ];
  validateUniqueIdentities(records, 'Merged manifest');
  return {
    ...baseManifest,
    records,
    claims: { ...baseManifest.claims, ...stagedStore.claims },
  };
};
