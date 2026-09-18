import React, { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import NotFound from '@/pages/NotFound';
import Project from '@/pages/Project';
import CaseStudies from '@/pages/CaseStudies';

const Contact = lazy(() => import('@/pages/ContactRoute'));
const Legal = lazy(() => import('@/pages/Legal'));
const DataPolicy = lazy(() => import('@/pages/DataPolicy'));

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="contact" element={<Contact />} />
        <Route path="project/:projectId" element={<Project />} />
        <Route path="case-studies" element={<CaseStudies />} />
        <Route path="legal" element={<Legal />} />
        <Route path="data-policy" element={<DataPolicy />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
