// @vitest-environment node
import React from 'react';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { renderToStaticMarkup } from 'react-dom/server';
import * as router from 'react-router-dom';
import { StaticRouter } from 'react-router-dom/server';
import { expect, it } from 'vitest';
import { transformWithEsbuild } from 'vite';
import * as frames from './DetectionFrame';
import * as catalog from '@/data/serviceOffers';

it('renders service offers without lookbehind support after the Safari 14 transform', async () => {
  const source = readFileSync(new URL('./Services.jsx', import.meta.url), 'utf8');
  const { code } = await transformWithEsbuild(source, 'Services.jsx', {
    loader: 'jsx', target: 'safari14', format: 'cjs', jsx: 'transform',
  });
  const module = { exports: {} };
  const imports = {
    react: React,
    'react-router-dom': router,
    './DetectionFrame': frames,
    '@/data/serviceOffers': catalog,
  };
  runInNewContext(code, {
    module,
    require: (name) => imports[name],
    RegExp: function (pattern, flags) {
      if (String(pattern).includes('(?<=') || String(pattern).includes('(?<!')) {
        throw new SyntaxError('Runtime does not support RegExp lookbehind');
      }
      return new RegExp(pattern, flags);
    },
  });
  const html = renderToStaticMarkup(React.createElement(
    StaticRouter, null, React.createElement(module.exports.default),
  ));
  for (const service of catalog.serviceOffers) {
    expect(html).toContain(service.title);
    expect(html).toContain(`href="/services/${service.id}"`);
  }
});
