export const HERO_INVOICE_FIELDS = ['name', 'role', 'credential', 'success', 'rate', 'location'];

export const HERO_DETECTED_FIELD_COUNT = 3;

export const pickDetectedFields = (random = Math.random) => {
  const ids = [...HERO_INVOICE_FIELDS];
  for (let i = ids.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return new Set(ids.slice(0, HERO_DETECTED_FIELD_COUNT));
};

let pageLoadDetectedFields;
export const getPageLoadDetectedFields = () => {
  pageLoadDetectedFields ??= pickDetectedFields();
  return pageLoadDetectedFields;
};
