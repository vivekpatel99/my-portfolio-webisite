import React from 'react';
import { useParams } from 'react-router-dom';
import { getServiceOfferById, serviceRouteForId } from '@/data/serviceOffers';
import ServiceDetailContent from '@/components/ServiceDetailContent';
import { useLocale } from '@/lib/locale.js';
import { Seo, routeSeo } from '@/lib/seo';
import NotFound from '@/pages/NotFound';

const ServiceDetail = ({ serviceId: explicitServiceId }) => {
  const { serviceId: routeServiceId } = useParams();
  const serviceId = explicitServiceId ?? routeServiceId;
  const locale = useLocale();
  const service = getServiceOfferById(serviceId);

  // Unknown IDs render the shared noindex 404 page; Apache also returns HTTP 404
  // for them because public/.htaccess only allowlists known service IDs.
  if (!service) return <NotFound />;

  return (
    <>
      <Seo {...routeSeo[serviceRouteForId(service.id)]} />
      <ServiceDetailContent service={service} locale={locale} />
    </>
  );
};

export default ServiceDetail;
