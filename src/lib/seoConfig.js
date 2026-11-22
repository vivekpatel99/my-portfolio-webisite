import { caseStudySlugs, getCaseStudyBySlug } from '../data/caseStudies.js';
import { getServiceOfferById, serviceOffers, serviceRouteForId } from '../data/serviceOffers.js';
import { HOURLY_RATE_EUR, HOURLY_RATE_LABEL } from '../config/pricing.js';
import { translatedRoutePairs } from './localizedRoutes.js';

export const SITE_URL = 'https://www.vivekapatel.com';
export const SITE_NAME = 'Vivek Patel';
export const DEFAULT_OG_IMAGE_PATH = '/og-image.png';

export const defaultSeo = {
  title: 'Vivek Patel - Expert AI & Computer Vision Engineer',
  description:
    `Hire Vivek Patel - Freelance AI & Computer Vision Engineer based in Linz, Austria, serving clients worldwide. Document extraction, n8n automation, and computer vision for invoices, website data, and video. Top Rated Plus on Upwork. ${HOURLY_RATE_LABEL}.`,
  keywords:
    'Vivek Patel, AI Engineer Linz Austria, Computer Vision Freelancer, n8n Automation, Web Scraping Expert, YOLO, PyTorch, LangChain, Data Extraction, Python Developer Worldwide',
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

const englishSeo = {
  '/': defaultSeo,
  '/contact': {
    title: 'Contact | Vivek Patel, AI & Computer Vision Engineer',
    description:
      `Hire Vivek Patel for your AI project. Freelance Computer Vision, Web Scraping & n8n Automation expert based in Linz, Austria, serving clients worldwide. Discuss your workflow and request a project estimate. ${HOURLY_RATE_LABEL}.`,
    keywords:
      'Hire AI Engineer Linz Austria, Computer Vision Freelancer, n8n Developer, Web Scraping Expert, Project Quote, LangChain Developer, YOLO Expert',
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
  '/case-studies': {
    title: 'Case Studies | Vivek Patel, AI & Computer Vision Engineer',
    description: 'Explore selected AI, automation, data extraction, and computer vision case studies by Vivek Patel.',
    keywords: 'AI case studies, automation case studies, computer vision, data extraction, Vivek Patel',
    path: '/case-studies',
    type: 'website',
    image: DEFAULT_OG_IMAGE_PATH,
  },
  ...Object.fromEntries(
    serviceOffers.map((service) => [
      serviceRouteForId(service.id),
      {
        title: `${service.name} | Freelance Service - Vivek Patel`,
        description: service.summary,
        keywords: `${service.name}, freelance AI engineer, Vivek Patel, AI automation, computer vision, data extraction`,
        path: serviceRouteForId(service.id),
        type: 'website',
        image: DEFAULT_OG_IMAGE_PATH,
      },
    ]),
  ),
  ...Object.fromEntries(
    caseStudySlugs.map((slug) => {
      const caseStudy = getCaseStudyBySlug(slug);
      return [
        `/project/${slug}`,
        {
          title: `${caseStudy.title} | Vivek Patel`,
          description: caseStudy.summary,
          keywords: `${caseStudy.title}${caseStudy.category ? `, ${caseStudy.category}` : ''}, case study, Vivek Patel, AI automation, computer vision, data extraction`,
          path: `/project/${slug}`,
          type: 'article',
          image: caseStudy.image?.src ?? DEFAULT_OG_IMAGE_PATH,
        },
      ];
    }),
  ),
};

const germanSeo = {
  '/': {
    title: 'Vivek Patel | Freelancer für KI und Computer Vision',
    description: `Freelancer für KI und Computer Vision aus Linz, Österreich, mit Kunden weltweit. Dokumentenextraktion, n8n-Automatisierung und Computer Vision für Rechnungen, Webdaten und Videos. Top Rated Plus auf Upwork. ${HOURLY_RATE_EUR} € pro Stunde.`,
  },
  '/contact': {
    title: 'Kontakt | Vivek Patel, KI und Computer Vision',
    description: `Besprechen Sie Ihren Workflow und fragen Sie eine Kostenschätzung für Ihr Projekt an. Vivek Patel arbeitet als Freelancer für Computer Vision, Web Scraping und n8n-Automatisierung aus Linz, Österreich, mit Kunden weltweit. ${HOURLY_RATE_EUR} € pro Stunde.`,
  },
  '/legal': {
    title: 'Datenschutzerklärung | Vivek Patel',
    description: 'Wie vivekapatel.com personenbezogene Daten gemäß DSGVO erhebt, verwendet und schützt.',
  },
  '/data-policy': {
    title: 'Cookie-Richtlinie | Vivek Patel',
    description: 'Welche Cookies vivekapatel.com verwendet, wozu sie dienen und wie Sie sie verwalten können.',
  },
  '/case-studies': {
    title: 'Fallstudien | Vivek Patel, KI und Computer Vision',
    description: 'Ausgewählte Fallstudien zu KI, Automatisierung, Datenextraktion und Computer Vision von Vivek Patel.',
  },
  ...Object.fromEntries(serviceOffers.map(({ id }) => {
    const service = getServiceOfferById(id, 'de');
    return [serviceRouteForId(id), {
      title: `${service.name} | Vivek Patel`,
      description: service.summary,
    }];
  })),
};

export const routeSeo = {
  ...englishSeo,
  ...Object.fromEntries(translatedRoutePairs.map(({ en, de }) => [de, {
    type: englishSeo[en].type,
    image: englishSeo[en].image,
    ...germanSeo[en],
    path: de,
  }])),
};

export const absoluteUrl = (pathOrUrl = '/') => {
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  return `${SITE_URL}${normalizeSitePath(pathOrUrl)}`;
};
