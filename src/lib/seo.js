import React from 'react';
import { Helmet } from 'react-helmet';
import { useLocale } from '@/lib/locale';
import { alternatePaths, findTranslatedRoute } from '@/lib/localizedRoutes';
import { absoluteUrl, defaultSeo, routeSeo, SITE_NAME } from '@/lib/seoConfig';

export { absoluteUrl, defaultSeo, routeSeo } from '@/lib/seoConfig';

export const Seo = ({
  title = defaultSeo.title,
  description = defaultSeo.description,
  keywords = defaultSeo.keywords,
  path = defaultSeo.path,
  type = defaultSeo.type,
  image = defaultSeo.image,
  noindex = false,
}) => {
  const locale = useLocale();
  const pair = findTranslatedRoute(path);
  if (locale === 'de' && pair && !noindex) {
    ({ title, description, keywords, path, type, image } = routeSeo[pair.de]);
  }
  const url = absoluteUrl(path);
  const imageUrl = absoluteUrl(image);

  return React.createElement(
    Helmet,
    { htmlAttributes: { lang: locale } },
    React.createElement('title', null, title),
    React.createElement('meta', { name: 'description', content: description }),
    React.createElement('meta', {
      name: 'robots',
      content: noindex ? 'noindex, nofollow' : 'index, follow',
    }),
    keywords ? React.createElement('meta', { name: 'keywords', content: keywords }) : null,
    React.createElement('link', { rel: 'canonical', href: url }),
    ...Object.entries(alternatePaths(path)).map(([hrefLang, alternate]) =>
      React.createElement('link', { rel: 'alternate', hrefLang, href: absoluteUrl(alternate) }),
    ),
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
