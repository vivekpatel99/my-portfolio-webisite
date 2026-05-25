import { lazy, Suspense } from 'react';
import * as Sentry from '@sentry/react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import { AnimatePresence } from 'framer-motion';

const Contact = lazy(() => import('@/pages/Contact'));
const Legal = lazy(() => import('@/pages/Legal'));
const DataPolicy = lazy(() => import('@/pages/DataPolicy'));

const RouteFallback = () => (
  <div className="min-h-screen bg-[#0C0D0D]" role="status" aria-live="polite">
    <span className="sr-only">Loading page</span>
  </div>
);

const RouteErrorFallback = () => (
  <div className="min-h-screen bg-[#0C0D0D] flex items-center justify-center px-6">
    <p className="text-sm text-white/70" role="alert">
      This page could not load.
    </p>
  </div>
);

const LazyRoute = ({ children }) => (
  <Sentry.ErrorBoundary fallback={<RouteErrorFallback />}>
    <Suspense fallback={<RouteFallback />}>{children}</Suspense>
  </Sentry.ErrorBoundary>
);

function App() {
  const location = useLocation();

  // Determine canonical URL:
  // 1. Base domain: https://www.vivekapatel.com
  // 2. Append pathname (handling root '/')
  // 3. Ensure no double slashes if pathname starts with /
  const canonicalPath = location.pathname === '/' ? '' : location.pathname;
  const canonicalUrl = `https://www.vivekapatel.com${canonicalPath}`;

  return (
    <>
      {/* Global Canonical Tag Management */}
      <Helmet>
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route
              path="contact"
              element={
                <LazyRoute>
                  <Contact />
                </LazyRoute>
              }
            />
            <Route path="project/:projectId" element={<Navigate to="/" replace />} />
            <Route path="privacy-policy" element={<Navigate to="/legal" replace />} />
            <Route path="cookie-policy" element={<Navigate to="/data-policy" replace />} />
            <Route
              path="legal"
              element={
                <LazyRoute>
                  <Legal />
                </LazyRoute>
              }
            />
            <Route
              path="data-policy"
              element={
                <LazyRoute>
                  <DataPolicy />
                </LazyRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AnimatePresence>
    </>
  );
}

export default App;
