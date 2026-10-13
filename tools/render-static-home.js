import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server.js';
import { LazyMotion, domAnimation } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { createServer } from 'vite';

// Load the same JSX and @ imports as the browser without running the dev server,
// visual-editor plugins, or telemetry. Home's effects only start in the browser.
export async function renderStaticHome() {
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
    const [{ default: Home }, { default: Header }] = await Promise.all([
      server.ssrLoadModule('/src/pages/Home.jsx'),
      server.ssrLoadModule('/src/components/Header.jsx'),
    ]);
    return renderToStaticMarkup(
      React.createElement(StaticRouter, { location: '/' },
        React.createElement(LazyMotion, { features: domAnimation, strict: true },
          React.createElement('div', { className: 'min-h-screen bg-[#0C0D0D] text-white flex flex-col' },
            React.createElement(Header),
            React.createElement('main', { id: 'main-content', className: 'flex-grow' }, React.createElement(Home)),
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
