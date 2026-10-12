import React from 'react';
import { LazyMotion, domAnimation } from 'framer-motion';
import { render } from '@testing-library/react';

export const MotionTestProvider = ({ children }) => (
  <LazyMotion features={domAnimation} strict>{children}</LazyMotion>
);

export const renderWithMotion = (element, options) => render(element, { wrapper: MotionTestProvider, ...options });
