import React from 'react';
import { ConvexProvider } from 'convex/react';
import convex from '@/lib/convexClient';
import Contact from '@/pages/Contact';

export default function ContactRoute() {
  return <ConvexProvider client={convex}><Contact /></ConvexProvider>;
}
