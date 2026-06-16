/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TechStack from './TechStack';

const useReducedMotion = vi.fn();

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  useReducedMotion: () => useReducedMotion(),
}));

describe('TechStack', () => {
  beforeEach(() => {
    useReducedMotion.mockReturnValue(false);
  });

  it('does not duplicate marquee items when reduced motion is requested', () => {
    useReducedMotion.mockReturnValue(true);

    render(<TechStack />);

    expect(screen.getAllByText('Git')).toHaveLength(1);
    expect(screen.getAllByText('OpenAI')).toHaveLength(1);
  });
});
