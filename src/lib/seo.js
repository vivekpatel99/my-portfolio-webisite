import React from 'react';
import { Helmet } from 'react-helmet';

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

export const absoluteUrl = (pathOrUrl = '/') => {
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${SITE_URL}${path === '/' ? '/' : path}`;
};

export const Seo = ({
  title = defaultSeo.title,
  description = defaultSeo.description,
  keywords = defaultSeo.keywords,
  path = defaultSeo.path,
  type = defaultSeo.type,
  image = defaultSeo.image,
}) => {
  const url = absoluteUrl(path);
  const imageUrl = absoluteUrl(image);

  return React.createElement(
    Helmet,
    null,
    React.createElement('title', null, title),
    React.createElement('meta', { name: 'description', content: description }),
    keywords ? React.createElement('meta', { name: 'keywords', content: keywords }) : null,
    React.createElement('link', { rel: 'canonical', href: url }),
    React.createElement('meta', { property: 'og:site_name', content: SITE_NAME }),
    React.createElement('meta', { property: 'og:type', content: type }),
    React.createElement('meta', { property: 'og:url', content: url }),
    React.createElement('meta', { property: 'og:title', content: title }),
    React.createElement('meta', { property: 'og:description', content: description }),
    React.createElement('meta', { property: 'og:image', content: imageUrl }),
    React.createElement('link', { rel: 'image_src', href: imageUrl }),
    React.createElement('meta', { name: 'twitter:card', content: 'summary_large_image' }),
    React.createElement('meta', { name: 'twitter:url', content: url }),
    React.createElement('meta', { name: 'twitter:title', content: title }),
    React.createElement('meta', { name: 'twitter:description', content: description }),
    React.createElement('meta', { name: 'twitter:image', content: imageUrl }),
  );
};
