import React, { useLayoutEffect, useRef } from 'react';
import { matchPath, useLocation } from 'react-router-dom';
import ServiceDetailContent from './ServiceDetailContent.js';
import { getServiceOfferById, serviceRouteForId } from '@/data/serviceOffers';
import { Seo, routeSeo } from '@/lib/seo';

const RouteLoading = () => {
  const { pathname, search, hash } = useLocation();
  const backRef = useRef(null);
  useLayoutEffect(() => () => {
    const pendingLink = backRef.current;
    if (!pendingLink || document.activeElement !== pendingLink) return;
    window.requestAnimationFrame(() => {
      if (pendingLink.isConnected || document.activeElement !== document.body) return;
      if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== `${pathname}${search}${hash}`) return;
      document.querySelector('#main-content a[href="/#services"]')?.focus({ preventScroll: true });
    });
  }, [pathname, search, hash]);
  const match = matchPath('/services/:serviceId', pathname);
  const service = match ? getServiceOfferById(match.params.serviceId) : null;
  const seoPath = service ? serviceRouteForId(service.id) : pathname.replace(/\/+$/, '') || '/';
  const seo = routeSeo[seoPath] ?? {
    title: 'Loading page | Vivek Patel',
    description: 'The requested page is loading.',
    path: pathname,
    noindex: true,
  };

  if (service) {
    return (
      <>
        <Seo {...seo} />
        <ServiceDetailContent service={service} backRef={backRef} />
        <p role="status" aria-label="Loading page" className="sr-only">
          Loading service details…
        </p>
      </>
    );
  }

  return (
    <section className="min-h-screen bg-[#0C0D0D] pb-24 pt-10 text-white md:pt-14">
      <Seo {...seo} />
      <div className="mx-auto max-w-[1180px] px-6 md:px-12">
        <h1 className="max-w-[760px] text-[clamp(2.25rem,5.4vw,4.25rem)] font-bold uppercase leading-[1.06] tracking-[-0.035em]">
          Loading page
        </h1>
        <p role="status" aria-label="Loading page" className="mt-8 text-base text-gray-300">
          Loading page…
        </p>
      </div>
    </section>
  );
};

export default RouteLoading;
