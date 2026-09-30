/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from './toast';

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
  });

  it('names the close control and hides the decorative icon', () => {
    renderToast('destructive');

    const close = screen.getByRole('button', { name: 'Dismiss notification' });
    expect(close.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('keeps the close control visible on devices without hover', () => {
    renderToast('default');

    const close = screen.getByRole('button', { name: 'Dismiss notification' });
    expect(classesOf(close)).toContain('[@media(hover:none)]:opacity-100');
  });
});
