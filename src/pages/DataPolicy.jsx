import React from 'react';
import { m } from 'framer-motion';
import { Seo } from '@/lib/seo';
import { usePageMotion } from '@/lib/pageMotion';
import CookiePolicyContent from '@/components/CookiePolicyContent';

const DataPolicy = () => {
  const pageMotion = usePageMotion();
  const handleManageCookies = (event) => {
    event.currentTarget.focus({ preventScroll: true });
    window.dispatchEvent(new CustomEvent('manage-cookies'));
  };
  return (
    <m.div {...pageMotion}>
      <Seo
        title="Cookie Policy | Vivek Patel"
        description="Learn about the cookies used on vivekapatel.com, why they are used, and how you can manage them."
        path="/data-policy"
      />
      <CookiePolicyContent onManageCookies={handleManageCookies} />
    </m.div>
  );
};

export default DataPolicy;
