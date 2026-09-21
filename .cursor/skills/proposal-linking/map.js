export const SITE_RATE = '€45/hour';
export const MAX_CASE_STUDY_LINKS = 2;

const SITE_ORIGIN = 'https://www.vivekapatel.com';
const ALLOWED_HOSTS = new Set(['vivekapatel.com', 'www.vivekapatel.com']);
const IGNORED_PATHS = new Set(['/contact/', '/legal/', '/data-policy/']);

const ENTRIES = Object.freeze({
  '/': Object.freeze({ kind: 'blocked', untilIssues: [119] }),
  '/project/n8n-openai-data-extraction/': Object.freeze({ kind: 'ready' }),
  '/project/ai-invoice-processing-automation/': Object.freeze({ kind: 'ready' }),
  '/project/invoice-ocr-extraction/': Object.freeze({ kind: 'ready' }),
  '/project/yolo-computer-vision-optimization/': Object.freeze({ kind: 'ready' }),
  '/project/n8n-python-ai-agents/': Object.freeze({ kind: 'blocked', untilIssues: [121] }),
  '/project/sports-video-analytics-yolo/': Object.freeze({ kind: 'blocked', untilIssues: [122, 127] }),
  '/project/resumable-listing-data-extraction/': Object.freeze({ kind: 'blocked', untilIssues: [123] }),
  '/project/browser-search-to-spreadsheet/': Object.freeze({ kind: 'blocked', untilIssues: [124] }),
  '/project/python-ci-workflow-automation/': Object.freeze({ kind: 'blocked', untilIssues: [125, 129] }),
  '/project/healthcare-document-intelligence/': Object.freeze({ kind: 'blocked', untilIssues: [126] }),
  '/project/depth-based-distance-estimation/': Object.freeze({ kind: 'blocked', untilIssues: [128] }),
  '/project/ai-project-planning-assistant/': Object.freeze({ kind: 'blocked', untilIssues: [129] }),
});

for (const [path, entry] of Object.entries(ENTRIES)) {
  if (entry.kind === 'blocked' && (!entry.untilIssues || entry.untilIssues.length === 0)) {
    throw new Error(`blocked entry ${path} requires non-empty untilIssues`);
  }
  if (entry.kind === 'ready' && entry.untilIssues) {
    throw new Error(`ready entry ${path} must not carry untilIssues`);
  }
}

function stripWrappers(raw) {
  let value = raw.trim();
  const markdown = value.match(/^\[[^\]]*\]\((.+)\)$/);
  if (markdown) value = markdown[1].trim();
  const angle = value.match(/^<(.+)>$/);
  if (angle) value = angle[1].trim();
  return value.replace(/[)\].,;]+$/, '');
}

function normalizePath(pathname) {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0) return '/';

  if (parts[0] === 'project') {
    if (parts.length !== 2) return null;
    const slug = parts[1];
    if (!/^[a-z0-9-]+$/.test(slug)) return null;
    return `/project/${slug}/`;
  }

  if (parts.length === 1) {
    if (parts[0] === 'case-studies') return '/case-studies/';
    if (parts[0] === 'contact') return '/contact/';
    if (parts[0] === 'legal') return '/legal/';
    if (parts[0] === 'data-policy') return '/data-policy/';
  }

  return null;
}

function sitePathname(raw) {
  if (typeof raw !== 'string') return null;
  const stripped = stripWrappers(raw);
  if (!stripped) return null;

  if (stripped.startsWith('/') && !stripped.startsWith('//')) {
    return stripped.split(/[?#]/)[0];
  }

  let input = stripped;
  if (input.startsWith('//')) {
    input = `https:${input}`;
  } else if (/^(?:www\.)?vivekapatel\.com(?:\/|$)/i.test(input)) {
    input = `https://${input}`;
  }

  try {
    const url = new URL(input);
    if (!ALLOWED_HOSTS.has(url.hostname.toLowerCase())) return null;
    return url.pathname;
  } catch {
    return null;
  }
}

function parseCanonicalPath(raw) {
  const pathname = sitePathname(raw);
  if (!pathname) return null;
  return normalizePath(pathname);
}

function auditPath(pathname) {
  const canonical = normalizePath(pathname);
  if (canonical) {
    const entry = ENTRIES[canonical];
    if (entry?.kind === 'ready') {
      return { status: 'ready', path: canonical, href: readyHref(canonical) };
    }
    if (entry?.kind === 'blocked') {
      return {
        status: 'blocked',
        path: canonical,
        href: readyHref(canonical),
        untilIssues: [...entry.untilIssues],
      };
    }
    if (canonical.startsWith('/project/') || canonical === '/case-studies/') {
      return { status: 'unknown', path: canonical, href: readyHref(canonical) };
    }
    return null;
  }

  const parts = pathname.split('/').filter(Boolean);
  if (parts[0] === 'project' || parts[0] === 'case-studies') {
    const path = parts[0] === 'case-studies' ? '/case-studies/' : pathname;
    return { status: 'unknown', path, href: readyHref(path.endsWith('/') ? path : `${path}/`) };
  }

  return null;
}

function readyHref(path) {
  return `${SITE_ORIGIN}${path}`;
}

export function classify(raw) {
  const path = parseCanonicalPath(raw);
  if (!path) return { status: 'unknown' };

  const entry = ENTRIES[path];
  if (!entry) return { status: 'unknown' };

  if (entry.kind === 'ready') {
    return { status: 'ready', path, href: readyHref(path) };
  }

  return { status: 'blocked', path, untilIssues: [...entry.untilIssues] };
}

function extractCandidates(text) {
  const patterns = [
    /https?:\/\/(?:www\.)?vivekapatel\.com[^\s)\]"'<>]*/gi,
    /(?<![.\w])\/\/(?:www\.)?vivekapatel\.com[^\s)\]"'<>]*/gi,
    /(?<![.\w/])(?:www\.)?vivekapatel\.com(?=\/|[^\w.]|$|\.(?!\w))(?:\/[^\s)\]"'<>]*)?/gi,
    /(?:^|[\s("'=<])(\/project\/[^\s)\]"'<>]+|\/case-studies\/?)/g,
  ];

  const found = [];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const chunk = (match[1] ?? match[0]).replace(/^[\s("'=<]+/, '');
      found.push(stripWrappers(chunk));
    }
  }
  return found;
}

function auditError(links, rejected) {
  const capFail = links.length > MAX_CASE_STUDY_LINKS;
  const hasBlocked = rejected.some((row) => row.status === 'blocked');
  const hasUnknown = rejected.some((row) => row.status === 'unknown');

  if (capFail && (hasBlocked || hasUnknown)) return 'mixed';
  if (capFail) return 'cap';
  if (hasBlocked) return 'blocked';
  if (hasUnknown) return 'unknown';
  return null;
}

export function auditProposalText(text) {
  if (typeof text !== 'string' || text === '') {
    return { ok: true, links: [], rejected: [], error: null };
  }

  const links = [];
  const rejected = [];
  const seenPaths = new Set();
  const seenReadyHrefs = new Set();

  for (const raw of extractCandidates(text)) {
    const pathname = sitePathname(raw);
    if (!pathname || seenPaths.has(pathname)) continue;
    seenPaths.add(pathname);

    const canonical = normalizePath(pathname);
    if (canonical && IGNORED_PATHS.has(canonical)) continue;

    const result = auditPath(pathname);
    if (!result) continue;

    if (result.status === 'ready') {
      if (!seenReadyHrefs.has(result.href)) {
        seenReadyHrefs.add(result.href);
        links.push(result.href);
      }
      continue;
    }

    if (result.status === 'blocked') {
      rejected.push({
        href: result.href,
        status: 'blocked',
        path: result.path,
        untilIssues: result.untilIssues,
      });
      continue;
    }

    rejected.push({
      href: result.href,
      status: 'unknown',
      path: result.path,
    });
  }

  const ok = rejected.length === 0 && links.length <= MAX_CASE_STUDY_LINKS;
  return {
    ok,
    links,
    rejected,
    error: ok ? null : auditError(links, rejected),
  };
}
