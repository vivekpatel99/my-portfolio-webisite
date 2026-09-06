/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Services from './Services';

vi.mock('framer-motion', () => ({
  motion: new Proxy({}, { get: (_, tag) => ({ children, ...props }) => React.createElement(tag, props, children) }),
  AnimatePresence: ({ children }) => <>{children}</>,
  useReducedMotion: () => false,
}));

describe('Services', () => {
  it('states both the defined-workflow fit and its non-fit boundary', () => {
    render(<MemoryRouter><Services /></MemoryRouter>);
    expect(screen.getByText(/defined inputs, available data access/i)).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Not the right fit' })).toBeTruthy();
    expect(screen.getByText(/do not promise guaranteed accuracy or savings/i)).toBeTruthy();
    expect(screen.getByText(/autonomous high-stakes decisions/i)).toBeTruthy();
    expect(screen.getByText(/data access and clear success criteria/i)).toBeTruthy();
  });
});
