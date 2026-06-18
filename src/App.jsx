import React, { Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import { AnimatePresence } from 'framer-motion';

const Contact = React.lazy(() => import('@/pages/ContactWithConvex'));
const Project = React.lazy(() => import('@/pages/Project'));
const Legal = React.lazy(() => import('@/pages/Legal'));
const DataPolicy = React.lazy(() => import('@/pages/DataPolicy'));
const NotFound = React.lazy(() => import('@/pages/NotFound'));

const PageFallback = () => (
  <div
    className="min-h-[50vh] flex items-center justify-center"
    aria-busy="true"
    aria-label="Loading page"
  >
    <div className="w-8 h-8 border-2 border-accent-purple/30 border-t-accent-purple rounded-full animate-spin" />
  </div>
);

const withSuspense = (Component) => (
  <Suspense fallback={<PageFallback />}>
    <Component />
  </Suspense>
);

function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="contact" element={withSuspense(Contact)} />
          <Route path="project/:projectId" element={withSuspense(Project)} />
          <Route path="legal" element={withSuspense(Legal)} />
          <Route path="data-policy" element={withSuspense(DataPolicy)} />
          <Route path="*" element={withSuspense(NotFound)} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

export default App;
