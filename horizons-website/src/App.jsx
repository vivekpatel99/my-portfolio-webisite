
import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import Contact from '@/pages/Contact';
import Project from '@/pages/Project';
import Legal from '@/pages/Legal'; // Renamed import
import DataPolicy from '@/pages/DataPolicy'; // Renamed import
import { AnimatePresence } from 'framer-motion';

function App() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="contact" element={<Contact />} />
          <Route path="project/:projectId" element={<Project />} />
          <Route path="privacy-policy" element={<Legal />} /> {/* Keep path, use new component */}
          <Route path="cookie-policy" element={<DataPolicy />} /> {/* Keep path, use new component */}
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

export default App;
