import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import NotFound from '@/pages/NotFound';
import Project from '@/pages/Project';
import CaseStudies from '@/pages/CaseStudies';
import { translatedRoutePairs } from '@/lib/localizedRoutes';
import { lazyRoute } from '@/lib/lazyRoute';

const Contact = lazyRoute(() => import('@/pages/ContactRoute'));
const ServiceDetail = lazyRoute(() => import('@/pages/ServiceDetail'));
const Legal = lazyRoute(() => import('@/pages/Legal'));
const DataPolicy = lazyRoute(() => import('@/pages/DataPolicy'));

const translatedPages = {
  '/': <Home />,
  '/contact': <Contact />,
  '/case-studies': <CaseStudies />,
  '/legal': <Legal />,
  '/data-policy': <DataPolicy />,
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="contact" element={<Contact />} />
        <Route path="project/:projectId" element={<Project />} />
        <Route path="case-studies" element={<CaseStudies />} />
        <Route path="services/:serviceId" element={<ServiceDetail />} />
        <Route path="legal" element={<Legal />} />
        <Route path="data-policy" element={<DataPolicy />} />
        {translatedRoutePairs.map(({ en, de }) => (
          <Route
            key={de}
            path={de}
            caseSensitive
            element={translatedPages[en] ?? <ServiceDetail serviceId={en.slice('/services/'.length)} />}
          />
        ))}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
