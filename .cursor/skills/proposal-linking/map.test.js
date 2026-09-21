// @vitest-environment node
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  SITE_RATE,
  MAX_CASE_STUDY_LINKS,
  classify,
  auditProposalText,
} from './map.js';

const BASE = 'https://www.vivekapatel.com';

const READY_SLUGS = [
  'n8n-openai-data-extraction',
  'ai-invoice-processing-automation',
  'invoice-ocr-extraction',
  'yolo-computer-vision-optimization',
];

const READY_PATHS = READY_SLUGS.map((slug) => `/project/${slug}/`);
const READY_HREFS = READY_PATHS.map((path) => `${BASE}${path}`);

const EXCLUDED = [
  { slug: 'n8n-python-ai-agents', untilIssues: [121] },
  { slug: 'sports-video-analytics-yolo', untilIssues: [122, 127] },
  { slug: 'resumable-listing-data-extraction', untilIssues: [123] },
  { slug: 'browser-search-to-spreadsheet', untilIssues: [124] },
  { slug: 'python-ci-workflow-automation', untilIssues: [125, 129] },
  { slug: 'healthcare-document-intelligence', untilIssues: [126] },
  { slug: 'depth-based-distance-estimation', untilIssues: [128] },
  { slug: 'ai-project-planning-assistant', untilIssues: [129] },
];

const PINNED_CLASSIFY_INPUTS = [
  ...READY_HREFS,
  ...EXCLUDED.map(({ slug }) => `${BASE}/project/${slug}/`),
  `${BASE}/`,
  '/',
  `${BASE}/case-studies/`,
  `${BASE}/project/not-a-real-slug/`,
];

describe('classify ready set', () => {
  it.each(READY_HREFS)('classifies %s as ready with canonical href', (url) => {
    const result = classify(url);
    expect(result.status).toBe('ready');
    expect(READY_HREFS).toContain(result.href);
    expect(result.path).toBe(result.href.replace(BASE, ''));
  });

  it('accepts apex, http, missing slash, and query/hash for a ready slug', () => {
    const slug = 'invoice-ocr-extraction';
    const canonical = `${BASE}/project/${slug}/`;
    const variants = [
      `https://vivekapatel.com/project/${slug}`,
      `http://www.vivekapatel.com/project/${slug}/`,
      `https://www.vivekapatel.com/project/${slug}?utm=1#x`,
    ];
    for (const raw of variants) {
      const result = classify(raw);
      expect(result).toEqual({
        status: 'ready',
        path: `/project/${slug}/`,
        href: canonical,
      });
    }
  });

  it('classifies ready only for the four issue URLs among pinned paths', () => {
    const ready = PINNED_CLASSIFY_INPUTS.filter((raw) => classify(raw).status === 'ready');
    expect(ready.map((raw) => classify(raw).path).sort()).toEqual([...READY_PATHS].sort());
    expect(ready).toHaveLength(4);
  });
});

describe('homepage blocked', () => {
  it('classifies homepage URLs as blocked until #119', () => {
    expect(classify('https://www.vivekapatel.com/')).toEqual({
      status: 'blocked',
      path: '/',
      untilIssues: [119],
    });
    expect(classify('/')).toEqual({
      status: 'blocked',
      path: '/',
      untilIssues: [119],
    });
  });

  it('fails audit when draft contains homepage URL', () => {
    const result = auditProposalText('See https://www.vivekapatel.com/ for my work.');
    expect(result.ok).toBe(false);
    expect(result.rejected).toHaveLength(1);
    expect(result.rejected[0].status).toBe('blocked');
    expect(result.rejected[0].untilIssues).toEqual([119]);
  });

  it.each(['See vivekapatel.com', 'See www.vivekapatel.com', 'See vivekapatel.com.'])(
    'fails audit for scheme-less homepage %j',
    (draft) => {
      const result = auditProposalText(draft);
      expect(result.ok).toBe(false);
      expect(result.rejected).toEqual([
        {
          href: `${BASE}/`,
          status: 'blocked',
          path: '/',
          untilIssues: [119],
        },
      ]);
    },
  );
});

describe('excluded paths', () => {
  it.each(EXCLUDED)('$slug is blocked with correct untilIssues', ({ slug, untilIssues }) => {
    const path = `/project/${slug}/`;
    expect(classify(`${BASE}${path}`)).toEqual({
      status: 'blocked',
      path,
      untilIssues,
    });
  });

  it.each(EXCLUDED)('audit fails when draft contains $slug', ({ slug }) => {
    const result = auditProposalText(`Proof: ${BASE}/project/${slug}/`);
    expect(result.ok).toBe(false);
    expect(result.rejected.some((row) => row.path === `/project/${slug}/`)).toBe(true);
  });
});

describe('unknown fail closed', () => {
  const unknownInputs = [
    '/project/not-a-real-slug/',
    `${BASE}/case-studies/`,
    `${BASE}/project/invoice-ocr-extraction/extra/`,
    `${BASE}/project/Invoice-Ocr-Extraction/`,
  ];

  it.each(unknownInputs)('classify(%j) is unknown', (raw) => {
    expect(classify(raw).status).toBe('unknown');
  });

  it('classify empty string is unknown', () => {
    expect(classify('').status).toBe('unknown');
  });

  it.each([
    '/project/not-a-real-slug/',
    '/case-studies/',
    `${BASE}/project/invoice-ocr-extraction/extra/`,
    `${BASE}/project/Invoice-Ocr-Extraction/`,
  ])('audit fails for site URL %j', (snippet) => {
    expect(auditProposalText(`See ${snippet}`).ok).toBe(false);
  });

  it('empty draft passes with no links', () => {
    expect(auditProposalText('')).toEqual({
      ok: true,
      links: [],
      rejected: [],
      error: null,
    });
  });

  it('draft with only Upwork URL passes', () => {
    const result = auditProposalText('Profile: https://www.upwork.com/freelancers/~test');
    expect(result).toEqual({
      ok: true,
      links: [],
      rejected: [],
      error: null,
    });
  });
});

describe('cap enforcement', () => {
  it('exports MAX_CASE_STUDY_LINKS === 2', () => {
    expect(MAX_CASE_STUDY_LINKS).toBe(2);
  });

  it('allows 0, 1, and 2 distinct ready URLs', () => {
    expect(auditProposalText('No portfolio links here.').ok).toBe(true);
    expect(auditProposalText(`${READY_HREFS[0]}`).ok).toBe(true);
    expect(auditProposalText(`${READY_HREFS[0]}\n${READY_HREFS[1]}`).ok).toBe(true);
  });

  it('rejects 3 and 4 ready URLs with error cap without slicing links', () => {
    const three = READY_HREFS.slice(0, 3).join('\n');
    const four = READY_HREFS.join('\n');
    const threeResult = auditProposalText(three);
    const fourResult = auditProposalText(four);
    expect(threeResult.ok).toBe(false);
    expect(fourResult.ok).toBe(false);
    expect(threeResult.error).toBe('cap');
    expect(fourResult.error).toBe('cap');
    expect(threeResult.links).toHaveLength(3);
    expect(fourResult.links).toHaveLength(4);
  });

  it('dedupes duplicate ready URLs', () => {
    const slug = 'invoice-ocr-extraction';
    const draft = [
      `https://www.vivekapatel.com/project/${slug}/`,
      `https://vivekapatel.com/project/${slug}`,
    ].join('\n');
    const result = auditProposalText(draft);
    expect(result.ok).toBe(true);
    expect(result.links).toEqual([`${BASE}/project/${slug}/`]);
  });
});

describe('mixed ready and blocked', () => {
  it('one ready plus one blocked is not ok', () => {
    const draft = `${READY_HREFS[0]}\n${BASE}/project/healthcare-document-intelligence/`;
    const result = auditProposalText(draft);
    expect(result.ok).toBe(false);
    expect(result.links).toHaveLength(1);
    expect(result.rejected).toHaveLength(1);
    expect(['blocked', 'mixed']).toContain(result.error);
  });
});

describe('markdown extraction', () => {
  it('counts markdown parenthetical path as ready href', () => {
    const result = auditProposalText('Proof (/project/invoice-ocr-extraction/) attached.');
    expect(result.ok).toBe(true);
    expect(result.links).toEqual([`${BASE}/project/invoice-ocr-extraction/`]);
  });
});

describe('SITE_RATE', () => {
  it('is €45/hour', () => {
    expect(SITE_RATE).toBe('€45/hour');
  });
});

describe('isolation', () => {
  it('map.js source does not reference publication/ or src/', () => {
    const dir = dirname(fileURLToPath(import.meta.url));
    const source = readFileSync(join(dir, 'map.js'), 'utf8');
    expect(source).not.toMatch(/publication\//);
    expect(source).not.toMatch(/src\//);
  });

  it('every blocked path has untilIssues and ready paths do not', () => {
    const blockedPaths = [
      '/',
      ...EXCLUDED.map(({ slug }) => `/project/${slug}/`),
    ];
    for (const path of blockedPaths) {
      const sample = path === '/' ? `${BASE}/` : `${BASE}${path}`;
      const result = classify(sample);
      expect(result.status).toBe('blocked');
      expect(result.untilIssues?.length).toBeGreaterThanOrEqual(1);
    }
    for (const path of READY_PATHS) {
      const result = classify(`${BASE}${path}`);
      expect(result.status).toBe('ready');
      expect(result.untilIssues).toBeUndefined();
    }
  });
});

describe('ignored routes', () => {
  it('contact URL does not fail audit alongside one ready link', () => {
    const result = auditProposalText(
      `${READY_HREFS[0]}\nBook a call: ${BASE}/contact/`,
    );
    expect(result.ok).toBe(true);
    expect(result.links).toEqual([READY_HREFS[0]]);
    expect(result.rejected).toEqual([]);
  });

  it('spaced slash in prose is not treated as the homepage', () => {
    const result = auditProposalText(`I build n8n / Python pipelines.\n${READY_HREFS[0]}`);
    expect(result.ok).toBe(true);
    expect(result.links).toEqual([READY_HREFS[0]]);
    expect(result.rejected).toEqual([]);
  });
});

describe('host allowlist', () => {
  it('rejects homograph evil host', () => {
    const evil =
      'https://www.vivekapatel.com.evil.com/project/n8n-openai-data-extraction/';
    expect(classify(evil).status).not.toBe('ready');
    const audit = auditProposalText(`See ${evil}`);
    expect(audit.ok).toBe(true);
    expect(audit.links).toEqual([]);
  });

  it('does not treat scheme-less evil host as the homepage', () => {
    const audit = auditProposalText(
      'See vivekapatel.com.evil.com/project/n8n-openai-data-extraction/',
    );
    expect(audit.ok).toBe(true);
    expect(audit.links).toEqual([]);
    expect(audit.rejected).toEqual([]);
  });
});

describe('protocol-relative URLs', () => {
  it('fails audit for a blocked protocol-relative project URL', () => {
    const result = auditProposalText(
      'See //www.vivekapatel.com/project/n8n-python-ai-agents/',
    );
    expect(result.ok).toBe(false);
    expect(result.rejected).toEqual([
      {
        href: `${BASE}/project/n8n-python-ai-agents/`,
        status: 'blocked',
        path: '/project/n8n-python-ai-agents/',
        untilIssues: [121],
      },
    ]);
  });

  it('counts a ready protocol-relative project URL', () => {
    const result = auditProposalText(
      'See //www.vivekapatel.com/project/invoice-ocr-extraction/',
    );
    expect(result.ok).toBe(true);
    expect(result.links).toEqual([`${BASE}/project/invoice-ocr-extraction/`]);
  });

  it('fails audit for protocol-relative homepage', () => {
    const result = auditProposalText('See //www.vivekapatel.com');
    expect(result.ok).toBe(false);
    expect(result.rejected[0]).toMatchObject({
      status: 'blocked',
      path: '/',
      untilIssues: [119],
    });
  });

  it('classifies protocol-relative blocked slug', () => {
    expect(classify('//www.vivekapatel.com/project/n8n-python-ai-agents/')).toEqual({
      status: 'blocked',
      path: '/project/n8n-python-ai-agents/',
      untilIssues: [121],
    });
  });
});

describe('idempotency', () => {
  it('auditProposalText returns the same result when called twice', () => {
    const draft = `${READY_HREFS[0]}\n${READY_HREFS[1]}`;
    expect(auditProposalText(draft)).toEqual(auditProposalText(draft));
  });
});
