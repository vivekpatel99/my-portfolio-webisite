import React from 'react';

export const DetectionLabel = ({ children, className = '', ...props }) => (
  React.createElement('span', { className: `detection-label ${className}`, ...props }, children)
);

export const DetectionHeading = ({ label, children, className = '', ...props }) => (
  React.createElement('h2', { className: `detection-heading ${className}`, ...props },
    React.createElement(DetectionLabel, { 'aria-hidden': true }, label),
    children,
  )
);
