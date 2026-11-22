import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { LazyMotion, domAnimation } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { createServer } from 'vite';
import { findTranslatedRoute, localeFromPath } from '../src/lib/localizedRoutes.js';
import { getServiceOfferById } from '../src/data/serviceOffers.js';

const pageModules = {
  '/': '/src/pages/Home.jsx',
  '/contact': '/src/pages/ContactFallback.jsx',
  '/legal': '/src/components/PrivacyPolicyContent.jsx',
  '/data-policy': '/src/components/CookiePolicyContent.jsx',
  '/case-studies': '/src/components/CaseStudiesContent.js',
};

// Load shared JSX and @ imports without the dev server, editor, or telemetry.
// Effects only start in the browser; the contact fallback has no form transport.
export async function renderStaticPages(routes) {
  const server = await createServer({
    configFile: false,
    mode: 'production',
    appType: 'custom',
    logLevel: 'error',
    resolve: { alias: { '@': path.resolve('src') } },
    server: { middlewareMode: true, hmr: false, watch: null },
    optimizeDeps: { noDiscovery: true },
    // Match Node 24's ESM entry for React Router's conditional exports.
    ssr: { resolve: { externalConditions: ['node', 'module-sync'] } },
  });
  try {
    const [{ default: Header }, { default: SkipLink }] = await Promise.all([
      server.ssrLoadModule('/src/components/Header.jsx'),
      server.ssrLoadModule('/src/components/SkipLink.jsx'),
    ]);
    const pages = new Map();
    for (const route of routes) {
      const { en } = findTranslatedRoute(route);
      const module = pageModules[en] ?? '/src/components/ServiceDetailContent.js';
      const { default: Page } = await server.ssrLoadModule(module);
      const props = en.startsWith('/services/')
        ? { service: getServiceOfferById(en.slice('/services/'.length)), locale: localeFromPath(route) }
        : {};
      const location = route === '/' ? route : `${route}/`;
      pages.set(route, renderToStaticMarkup(
        React.createElement(StaticRouter, { location },
          React.createElement(LazyMotion, { features: domAnimation, strict: true },
            React.createElement(SkipLink),
            React.createElement('div', { className: 'min-h-screen bg-[#0C0D0D] text-white flex flex-col' },
              React.createElement(Header, { staticNavigation: true }),
              React.createElement('main', { id: 'main-content', tabIndex: -1, className: 'flex-grow' }, React.createElement(Page, props)),
            ),
          ),
        ),
      ));
    }
    return pages;
  } finally {
    // Metadata is supplied by applySeo; release Helmet's server-side registry.
    Helmet.renderStatic();
    await server.close();
  }
}
