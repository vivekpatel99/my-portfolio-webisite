/**
 * @vitest-environment jsdom
 */
import { resolve } from 'node:path';
import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';
import React from 'react';
import tailwindcss from 'tailwindcss';
import loadConfig from 'tailwindcss/loadConfig.js';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from './toast';

const tailwindConfigPath = resolve(process.cwd(), 'tailwind.config.js');

function collectEmittedClassNames(root) {
  const classNames = new Set();
  root.walkRules((rule) => {
    selectorParser((selectors) => {
      selectors.walkClasses((className) => classNames.add(className.value));
    }).processSync(rule.selector);
  });
  return classNames;
}

function renderToast(variant) {
  render(
    <ToastProvider>
      <Toast open variant={variant} data-testid="toast">
        <ToastTitle>Missing Fields</ToastTitle>
        <ToastDescription>Please fill in all required fields.</ToastDescription>
        <ToastClose />
      </Toast>
      <ToastViewport />
    </ToastProvider>,
  );
  return screen.getByTestId('toast');
}

function classesOf(element) {
  return element.className.split(/\s+/);
}

describe('Toast', () => {
  afterEach(() => cleanup());

  it('gives the destructive variant an opaque surface and border from the destructive token', () => {
    const classes = classesOf(renderToast('destructive'));

    expect(classes).toContain('bg-[hsl(var(--destructive))]');
    expect(classes).toContain('border-[hsl(var(--destructive))]');
    // Bare `bg-destructive` generates no CSS because the theme key is `default`, not `DEFAULT`.
    expect(classes).not.toContain('bg-destructive');
    expect(classes).not.toContain('border-destructive');
  });

  it('does not slide the toast when the visitor prefers reduced motion', () => {
    const classes = classesOf(renderToast('destructive'));

    expect(classes).toContain('motion-reduce:data-[state=open]:animate-none');
    expect(classes).toContain('motion-reduce:data-[state=closed]:animate-none');
    // A cancelled swipe otherwise slides back through `transition-all`.
    expect(classes).toContain('motion-reduce:transition-none');
  });

  it('names the close control and hides the decorative icon', () => {
    renderToast('destructive');

    const close = screen.getByRole('button', { name: 'Dismiss notification' });
    expect(close.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('keeps the close control visible on devices without hover or with any touch pointer', () => {
    renderToast('default');

    const close = screen.getByRole('button', { name: 'Dismiss notification' });
    expect(classesOf(close)).toContain('[@media(hover:none)]:opacity-100');
    // Touch laptops report `hover: hover` for their trackpad, yet a finger tap cannot hover.
    expect(classesOf(close)).toContain('[@media(any-pointer:coarse)]:opacity-100');
  });
  it('emits CSS for every destructive ToastAction state', async () => {
    render(
      <ToastProvider>
        <Toast open variant="destructive">
          <ToastAction altText="Undo">Undo</ToastAction>
        </Toast>
        <ToastViewport />
      </ToastProvider>,
    );
    const action = await screen.findByRole('button', { name: 'Undo' });
    const destructiveClasses = [...action.classList].filter((className) =>
      className.startsWith('group-[.destructive]'),
    );
    const config = loadConfig(tailwindConfigPath);
    const result = await postcss([
      tailwindcss({
        ...config,
        content: [{ raw: action.outerHTML, extension: 'html' }],
      }),
    ]).process('@tailwind utilities;', { from: undefined });
    const emittedClasses = collectEmittedClassNames(result.root);

    expect(destructiveClasses.length).toBeGreaterThan(0);
    expect(destructiveClasses.filter((className) => !emittedClasses.has(className))).toEqual([]);
  });
});
