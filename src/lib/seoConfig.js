export const SITE_URL = 'https://www.vivekapatel.com';
export const SITE_NAME = 'Vivek Patel';
export const DEFAULT_OG_IMAGE_PATH = '/og-image.png';

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
  '/project/social-media-app': {
    title: 'Next-Gen Banking UI | Project Case Study - Vivek Patel',
    description:
      'Case study for the Next-Gen Banking UI project. Discover the challenges, solutions, and results achieved by Vivek Patel, AI & Computer Vision Engineer.',
    keywords:
      'Next-Gen Banking UI, case study, portfolio, Vivek Patel, Web & App Design, AI project, web development',
    path: '/project/social-media-app',
    type: 'article',
    image:
      'https://horizons-cdn.hostinger.com/6c79ee82-b048-4e51-aa3e-90c95281746e/gemini_generated_image_n6u5epn6u5epn6u5-5ABrF.png',
  },
};

export const absoluteUrl = (pathOrUrl = '/') => {
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${SITE_URL}${path === '/' ? '/' : path}`;
};
