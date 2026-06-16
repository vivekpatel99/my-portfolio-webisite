import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Seo } from '@/lib/seo';

const NotFound = () => (
  <section className="min-h-[70vh] bg-[#0C0D0D] text-white pt-36 pb-24">
    <Seo
      title="Page Not Found | Vivek Patel"
      description="The requested page could not be found."
      path="/404"
      noindex
    />
    <div className="container mx-auto px-6 max-w-3xl">
      <p className="text-accent-purple font-semibold uppercase tracking-wide mb-4">404</p>
      <h1 className="text-4xl md:text-6xl font-bold mb-6">Page Not Found</h1>
      <p className="text-lg text-gray-300 mb-8">
        This page does not exist or has moved. Use the homepage to find services,
        case studies, and contact details.
      </p>
      <Button asChild className="bg-accent-purple text-white hover:bg-accent-purple/90 rounded-full">
        <Link to="/">
          <ArrowLeft className="mr-2 h-5 w-5" />
          Back to Home
        </Link>
      </Button>
    </div>
  </section>
);

export default NotFound;
