import React from 'react';
import { Link, matchPath, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getServiceOfferById, serviceRouteForId } from '@/data/serviceOffers';
import { Seo, routeSeo } from '@/lib/seo';

const RouteLoading = () => {
  const { pathname } = useLocation();
  const match = matchPath('/services/:serviceId', pathname);
  const service = match ? getServiceOfferById(match.params.serviceId) : null;
  const seoPath = service ? serviceRouteForId(service.id) : pathname.replace(/\/+$/, '') || '/';
  const seo = routeSeo[seoPath] ?? {
    title: 'Loading page | Vivek Patel',
    description: 'The requested page is loading.',
    path: pathname,
    noindex: true,
  };

  return (
    <section className="min-h-screen bg-[#0C0D0D] pb-24 pt-10 text-white md:pt-14">
      <Seo {...seo} />
      <div className="mx-auto max-w-[1180px] px-6 md:px-12">
        {service ? (
          <Link to="/#services" className="detection-text-action mb-12 gap-2 text-sm md:mb-16">
            <ArrowLeft size={16} aria-hidden="true" />
            Back to Services
          </Link>
        ) : null}
        <h1 className="max-w-[760px] text-[clamp(2.25rem,5.4vw,4.25rem)] font-bold uppercase leading-[1.06] tracking-[-0.035em]">
          {service ? service.title : 'Loading page'}
        </h1>
        {service ? (
          <p className="mt-8 max-w-[640px] text-base leading-[1.75] text-[#b6b8c2] sm:text-lg">
            {service.summary}
          </p>
        ) : null}
        <p role="status" aria-label="Loading page" className="mt-8 text-base text-gray-300">
          {service ? 'Loading service details…' : 'Loading page…'}
        </p>
      </div>
    </section>
  );
};

export default RouteLoading;
