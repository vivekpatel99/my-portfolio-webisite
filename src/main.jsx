import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConvexProvider } from 'convex/react';
import App from '@/App';
import ScrollToTop from '@/components/ScrollToTop';
import ErrorBoundary from '@/components/ErrorBoundary';
import '@/index.css';
import convex from '@/lib/convexClient';

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <ConvexProvider client={convex}>
      <BrowserRouter>
        <ScrollToTop />
        <App />
      </BrowserRouter>
    </ConvexProvider>
  </ErrorBoundary>
);
