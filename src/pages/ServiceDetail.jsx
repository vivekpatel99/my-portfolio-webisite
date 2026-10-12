import React from 'react';
import { useParams } from 'react-router-dom';
import { getServiceOfferById, serviceRouteForId } from '@/data/serviceOffers';
import ServiceDetailContent from '@/components/ServiceDetailContent';
import { Seo, routeSeo } from '@/lib/seo';
import NotFound from '@/pages/NotFound';

const ServiceDetail = () => {
  const { serviceId } = useParams();
  const service = getServiceOfferById(serviceId);

  // Unknown IDs render the shared noindex 404 page; Apache also returns HTTP 404
  // for them because public/.htaccess only allowlists known service IDs.
  if (!service) return <NotFound />;

  return (
    <>
      <Seo {...routeSeo[serviceRouteForId(service.id)]} />
      <ServiceDetailContent service={service} />
    </>
  );
};

export default ServiceDetail;
