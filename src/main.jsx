import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from '@/App';
import ScrollToTop from '@/components/ScrollToTop';
import ErrorBoundary from '@/components/ErrorBoundary';
import '@/index.css';
import '@/components/DetectionFrame.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
      {/* Preserve synchronous navigation and native history restoration during the v7 upgrade. */}
      <BrowserRouter useTransitions={false}>
        <ScrollToTop />
        <App />
      </BrowserRouter>
  </ErrorBoundary>
);
