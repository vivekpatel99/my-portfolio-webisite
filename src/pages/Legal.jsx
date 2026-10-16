import React from 'react';
import { m } from 'framer-motion';
import { Seo } from '@/lib/seo';
import { usePageMotion } from '@/lib/pageMotion';
import PrivacyPolicyContent from '@/components/PrivacyPolicyContent';

const Legal = () => {
  const pageMotion = usePageMotion();
  return (
    <m.div {...pageMotion}>
      <Seo
        title="Privacy Policy | Vivek Patel"
        description="Privacy Policy for vivekapatel.com, outlining how personal data is collected, used, and protected in compliance with GDPR."
        path="/legal"
      />
      <PrivacyPolicyContent />
    </m.div>
  );
};

export default Legal;
