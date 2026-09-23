import React from 'react';
import { useOwnerMode } from '../hooks/useOwnerMode';
import { caseStudyOwnerAliases } from '../data/caseStudyOwnerAliases';

export const OwnerAlias = ({ slug, className = '' }) => {
  const ownerMode = useOwnerMode();
  const alias = caseStudyOwnerAliases[slug];

  if (!ownerMode || !alias) return null;

  return React.createElement(
    'div',
    { className: `text-sm text-gray-400/90 ${className}` },
    React.createElement('span', { className: 'font-medium' }, 'Your name:'),
    ' ',
    alias
  );
};

export default OwnerAlias;
