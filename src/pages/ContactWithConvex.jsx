import React from 'react';
import { ConvexProvider } from 'convex/react';
import convex from '@/lib/convexClient';
import Contact from '@/pages/Contact';

const ContactWithConvex = () => (
  <ConvexProvider client={convex}>
    <Contact />
  </ConvexProvider>
);

export default ContactWithConvex;
