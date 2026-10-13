import React from 'react';
import { ConvexProvider } from 'convex/react';
import convex from '@/lib/convexClient';
import Contact from '@/pages/Contact';
import { useLocation } from 'react-router-dom';

export default function ContactRoute() {
  const { search, key } = useLocation();
  return <ConvexProvider client={convex}><Contact inquirySearch={search} inquiryVisitKey={key} /></ConvexProvider>;
}
