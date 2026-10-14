import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server.js';
import { LazyMotion, domAnimation } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { createServer } from 'vite';

// Load shared JSX and @ imports without the dev server, editor, or telemetry.
// Effects only start in the browser; the contact fallback has no form transport.
async function renderStaticPage(pagePath, location) {
  const server = await createServer({
    configFile: false,
    mode: 'production',
    appType: 'custom',
    logLevel: 'error',
    resolve: { alias: { '@': path.resolve('src') } },
    server: { middlewareMode: true, hmr: false, watch: null },
    optimizeDeps: { noDiscovery: true },
  });
  try {
    const [{ default: Page }, { default: Header }] = await Promise.all([
      server.ssrLoadModule(pagePath),
      server.ssrLoadModule('/src/components/Header.jsx'),
    ]);
    return renderToStaticMarkup(
      React.createElement(StaticRouter, { location },
        React.createElement(LazyMotion, { features: domAnimation, strict: true },
          React.createElement('div', { className: 'min-h-screen bg-[#0C0D0D] text-white flex flex-col' },
            React.createElement(Header),
            React.createElement('main', { id: 'main-content', className: 'flex-grow' }, React.createElement(Page)),
          ),
        ),
      ),
    );
  } finally {
    // Metadata is supplied by applySeo; release Helmet's server-side registry.
    Helmet.renderStatic();
    await server.close();
  }
}

export const renderStaticHome = () => renderStaticPage('/src/pages/Home.jsx', '/');
export const renderStaticContact = () => renderStaticPage('/src/pages/ContactFallback.jsx', '/contact/');
export const renderStaticPrivacyPolicy = () => renderStaticPage('/src/components/PrivacyPolicyContent.jsx', '/legal/');
export const renderStaticCookiePolicy = () => renderStaticPage('/src/components/CookiePolicyContent.jsx', '/data-policy/');
