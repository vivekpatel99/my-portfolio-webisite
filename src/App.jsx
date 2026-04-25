import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import Contact from '@/pages/Contact';
import Project from '@/pages/Project';
import Legal from '@/pages/Legal';
import DataPolicy from '@/pages/DataPolicy';
import { AnimatePresence } from 'framer-motion';

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
            <Route path="contact" element={<Contact />} />
            <Route path="project/:projectId" element={<Project />} />
            <Route path="legal" element={<Legal />} />
            <Route path="data-policy" element={<DataPolicy />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AnimatePresence>
    </>
  );
}

export default App;
