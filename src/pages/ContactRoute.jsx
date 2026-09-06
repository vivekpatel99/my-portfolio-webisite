import React, { useLayoutEffect, useState } from 'react';
import { ConvexProvider } from 'convex/react';
import { useLocation, useNavigate } from 'react-router-dom';
import convex from '@/lib/convexClient';
import Contact from '@/pages/Contact';
import { normalizeInquiryContext } from '../../convex/lib/inquiryContext';

export default function ContactRoute() {
  const location = useLocation();
  const navigate = useNavigate();
  const [initialInquiryContext] = useState(() => {
    try {
      return normalizeInquiryContext(location.state?.inquiryContext);
    } catch {
      return undefined;
    }
  });

  useLayoutEffect(() => {
    if (location.state !== null) {
      navigate(`${location.pathname}${location.search}${location.hash}`, { replace: true, state: null });
    }
  }, [location, navigate]);

  return <ConvexProvider client={convex}><Contact initialInquiryContext={initialInquiryContext} /></ConvexProvider>;
}
