import { ConvexReactClient } from 'convex/react';

const convexUrl = import.meta.env.VITE_CONVEX_URL;
if (!convexUrl) {
  console.error(
    'VITE_CONVEX_URL is not set. Contact form submissions will fail until Convex is configured.',
  );
}

const convex = new ConvexReactClient(convexUrl ?? '');

export default convex;
