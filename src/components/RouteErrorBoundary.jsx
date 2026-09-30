import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { focusNavigationTarget } from '@/lib/focusTarget';

export const ROUTE_ERROR_HEADING = "This page didn't load";

// React.lazy caches a rejected import, so only a user-initiated reload can retry a failed chunk.
const reloadCurrentPage = () => window.location.reload();

const RouteErrorFallback = () => {
  const headingRef = useRef(null);

  useEffect(() => {
    focusNavigationTarget(headingRef.current);
  }, []);

  return (
    <section
      aria-labelledby="route-error-heading"
      className="min-h-[70vh] bg-[#0C0D0D] text-white pt-36 pb-24"
      data-route-error
    >
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
            onClick={reloadCurrentPage}
            className="bg-accent-purple text-white hover:bg-accent-purple/90 rounded-full"
          >
            <RotateCw className="mr-2 h-5 w-5" aria-hidden="true" />
            Retry
          </Button>
          <Button
            asChild
            variant="outline"
            className="rounded-full border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
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

class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.hasError && this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  render() {
    return this.state.hasError ? <RouteErrorFallback /> : this.props.children;
  }
}

export default RouteErrorBoundary;
