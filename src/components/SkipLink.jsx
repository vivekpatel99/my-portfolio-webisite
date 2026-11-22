import React from 'react';
import { shellCopy } from '@/data/shellCopy';
import { useLocale } from '@/lib/locale';

const SkipLink = () => (
  <a
    href="#main-content"
    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-accent-purple focus:text-white focus:px-4 focus:py-2 focus:rounded-md"
  >
    {shellCopy[useLocale()].skip}
  </a>
);

export default SkipLink;
