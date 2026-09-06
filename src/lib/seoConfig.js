import { caseStudies } from '../data/caseStudies.js';

export const SITE_URL = 'https://www.vivekapatel.com';
export const SITE_NAME = 'Vivek Patel';
export const DEFAULT_OG_IMAGE_PATH = '/og-image.png';

export const defaultSeo = {
  title: 'Vivek Patel - AI Automation Engineer',
  description:
    'Vivek Patel is an AI Automation Engineer helping operations teams turn messy documents and web data into structured, reviewable records and dependable handoffs.',
  keywords:
    'Vivek Patel, AI Automation Engineer, document data extraction, web data extraction, n8n automation, Python workflow automation, computer vision',
  path: '/',
  type: 'website',
  image: DEFAULT_OG_IMAGE_PATH,
};

export const normalizeSitePath = (pathOrUrl = '/') => {
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  if (path === '/') {
    return '/';
  }

  const hasFileExtension = /\/[^/]+\.[^/]+$/.test(path);
  if (hasFileExtension) {
    return path;
  }

  return `${path.replace(/\/+$/, '')}/`;
};

export const routeSeo = {
  '/': defaultSeo,
  '/contact': {
    title: 'Contact | Vivek Patel, AI Automation Engineer',
    description:
      'Contact Vivek Patel to discuss documents, web data, or workflow automation that needs structured records, validation, and a reviewable handoff.',
    keywords:
      'AI automation consultation, document data extraction, web data extraction, n8n workflow, Python workflow automation, computer vision',
    path: '/contact',
    type: 'website',
    image: DEFAULT_OG_IMAGE_PATH,
  },
  '/legal': {
    title: 'Privacy Policy | Vivek Patel',
    description:
      'Privacy Policy for vivekapatel.com, outlining how personal data is collected, used, and protected in compliance with GDPR.',
    path: '/legal',
    type: 'website',
    image: DEFAULT_OG_IMAGE_PATH,
  },
  '/data-policy': {
    title: 'Cookie Policy | Vivek Patel',
    description:
      'Learn about the cookies used on vivekapatel.com, why they are used, and how you can manage them.',
    path: '/data-policy',
    type: 'website',
    image: DEFAULT_OG_IMAGE_PATH,
  },
  ...Object.fromEntries(
    caseStudies.map((caseStudy) => [
      `/project/${caseStudy.slug}`,
      {
        title: `${caseStudy.title} | Case Study - Vivek Patel`,
        description: caseStudy.summary,
        keywords: `${caseStudy.title}, ${caseStudy.category}, case study, Vivek Patel, AI automation, computer vision, data extraction`,
        path: `/project/${caseStudy.slug}`,
        type: 'article',
        image: DEFAULT_OG_IMAGE_PATH,
      },
    ]),
  ),
};

export const absoluteUrl = (pathOrUrl = '/') => {
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  return `${SITE_URL}${normalizeSitePath(pathOrUrl)}`;
};
