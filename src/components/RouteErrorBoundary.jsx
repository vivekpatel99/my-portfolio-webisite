import React, { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { focusNavigationTarget } from '@/lib/focusTarget';
import { clearPendingRetryGeneration, retryLazyRoutes } from '@/lib/lazyRoute';
import { Seo } from '@/lib/seo';

export const ROUTE_ERROR_HEADING = "This page didn't load";

const RouteErrorFallback = ({ onRetry }) => {
  const headingRef = useRef(null);
  const { pathname } = useLocation();

  useEffect(() => {
    focusNavigationTarget(headingRef.current);
  }, []);

  return (
    <section
      aria-labelledby="route-error-heading"
      className="min-h-[70vh] bg-[#0C0D0D] text-white pt-36 pb-24"
      data-route-error
    >
      <Seo
        title="Page unavailable | Vivek Patel"
        description="The requested page could not be loaded. Try again or return to the homepage."
        path={pathname}
        noindex
      />
      <div className="container mx-auto px-6 max-w-3xl">
        <p className="text-accent-purple-text font-semibold uppercase tracking-wide mb-4">Page unavailable</p>
        <h1
          id="route-error-heading"
          ref={headingRef}
          className="text-4xl md:text-6xl font-bold mb-6 focus:outline-none"
        >
          {ROUTE_ERROR_HEADING}
        </h1>
        <p className="text-lg text-gray-300 mb-8">
          Something interrupted loading this page. Check your connection and try again,
          or return to the homepage.
        </p>
        <div className="flex flex-wrap gap-4">
          <Button
            type="button"
            onClick={onRetry}
            className="detection-utility bg-accent-purple text-white hover:bg-accent-purple/90"
          >
            <RotateCw className="mr-2 h-5 w-5" aria-hidden="true" />
            Retry
          </Button>
          <Button
            asChild
            variant="outline"
            className="detection-utility border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
          >
            <Link to="/">
              <ArrowLeft className="mr-2 h-5 w-5" aria-hidden="true" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

function focusRecoveredRouteContent() {
  const main = document.getElementById('main-content');
  if (!main) return false;
  // Still showing the recovery UI (retry failed again).
  if (main.querySelector('[data-route-error]')) return false;
  // Suspense fallback while the remounted lazy factory loads.
  if (main.querySelector('[role="status"][aria-label="Loading page"]')) return false;

  const heading = main.querySelector('h1');
  focusNavigationTarget(heading || main);
  return true;
}

class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
    this.focusObserver = null;
    this.focusTimeoutId = null;
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentWillUnmount() {
    this.teardownFocusRecovery();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.hasError && this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      // Leaving the error UI via navigation — drop any unconsumed Retry token.
      clearPendingRetryGeneration();
      this.setState({ hasError: false });
    }

    // Retry unmounts the focused button without a location change, so ScrollToTop
    // never runs. Move focus to the recovered main / heading once content appears.
    if (prevState.hasError && !this.state.hasError) {
      this.scheduleFocusAfterRecovery();
    }

    // Re-entered error after Retry (e.g. synchronous render throw): no lazyRoute
    // consumed pendingRetryGeneration — clear so a later cached lazy visit is not
    // forced onto attempt 1.
    if (!prevState.hasError && this.state.hasError) {
      clearPendingRetryGeneration();
    }
  }

  teardownFocusRecovery() {
    if (this.focusObserver) {
      this.focusObserver.disconnect();
      this.focusObserver = null;
    }
    if (this.focusTimeoutId != null) {
      window.clearTimeout(this.focusTimeoutId);
      this.focusTimeoutId = null;
    }
  }

  scheduleFocusAfterRecovery() {
    this.teardownFocusRecovery();

    if (focusRecoveredRouteContent()) return;

    const main = document.getElementById('main-content');
    if (!main || typeof MutationObserver === 'undefined') {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          focusRecoveredRouteContent();
        });
      });
      return;
    }

    this.focusObserver = new MutationObserver(() => {
      if (focusRecoveredRouteContent()) this.teardownFocusRecovery();
    });
    this.focusObserver.observe(main, { childList: true, subtree: true });
    // Keep observing until content, another error, or unmount — slow cache-bust
    // downloads can exceed a short timeout and ScrollToTop will not run.
  }

  handleRetry = () => {
    // Remount lazy factories with a cache-busting import; do not reload the document.
    // WebKit will not re-request a module URL that already failed in this tab.
    // (Obsolete chunk URLs still fall back to document.location.reload inside lazyRoute.)
    retryLazyRoutes();
    this.setState({ hasError: false });
  };

  render() {
    return this.state.hasError
      ? <RouteErrorFallback onRetry={this.handleRetry} />
      : this.props.children;
  }
}

export default RouteErrorBoundary;
