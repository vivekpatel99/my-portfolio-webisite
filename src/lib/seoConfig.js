export const SITE_URL = 'https://www.vivekapatel.com';
export const SITE_NAME = 'Vivek Patel';
export const DEFAULT_OG_IMAGE_PATH = '/og-image.png';
const N8N_IMAGE = 'https://raw.githubusercontent.com/n8n-io/n8n/master/assets/n8n-screenshot-readme.png';
const INVOICE_OCR_IMAGE = 'https://raw.githubusercontent.com/vivekpatel99/invoice-data-extraction-using-ocr/main/output/original_with_bboxes_demo.jpg';
const YOLO_IMAGE = 'https://raw.githubusercontent.com/vivekpatel99/yoga-pose-estimation/main/assets/demo.gif';

export const defaultSeo = {
  title: 'Vivek Patel - Expert AI & Computer Vision Engineer',
  description:
    'Hire Vivek Patel - Freelance AI & Computer Vision Engineer in Europe. Expert in web scraping, n8n automation, YOLO, PyTorch, and LangChain. 94% performance improvements. €80/hour.',
  keywords:
    'Vivek Patel, AI Engineer Europe, Computer Vision Freelancer, n8n Automation, Web Scraping Expert, YOLO, PyTorch, LangChain, Data Extraction, Python Developer Europe',
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
    title: 'Contact | Vivek Patel, AI & Computer Vision Engineer',
    description:
      'Hire Vivek Patel for your AI project. Freelance Computer Vision, Web Scraping & n8n Automation expert based in Europe. Get a quote within 24 hours. €80/hour.',
    keywords:
      'Hire AI Engineer Europe, Computer Vision Freelancer, n8n Developer, Web Scraping Expert, Project Quote, LangChain Developer, YOLO Expert',
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
  '/project/n8n-openai-data-extraction': {
    title: 'n8n + OpenAI Data Extraction | AI Case Study - Vivek Patel',
    description:
      'Case study for an n8n and OpenAI workflow that extracts structured data from German websites and prepares it for reliable business use.',
    keywords:
      'n8n OpenAI data extraction, AI workflow automation, web scraping case study, Vivek Patel, data extraction automation',
    path: '/project/n8n-openai-data-extraction',
    type: 'article',
    image: N8N_IMAGE,
  },
  '/project/invoice-ocr-extraction': {
    title: 'Invoice OCR Extraction | AI Case Study - Vivek Patel',
    description:
      'Case study for an OCR workflow that extracts seller and client information from invoice photos and returns structured, reviewable data.',
    keywords:
      'invoice OCR extraction, document AI case study, OCR automation, Vivek Patel, AI data extraction',
    path: '/project/invoice-ocr-extraction',
    type: 'article',
    image: INVOICE_OCR_IMAGE,
  },
  '/project/yolo-computer-vision-optimization': {
    title: 'YOLO Computer Vision Optimization | AI Case Study - Vivek Patel',
    description:
      'Case study for a YOLO-based computer vision project focused on real-time pose detection and production inference optimization.',
    keywords:
      'YOLO computer vision, pose detection, real-time inference optimization, Vivek Patel, computer vision case study',
    path: '/project/yolo-computer-vision-optimization',
    type: 'article',
    image: YOLO_IMAGE,
  },
};

export const absoluteUrl = (pathOrUrl = '/') => {
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  return `${SITE_URL}${normalizeSitePath(pathOrUrl)}`;
};
