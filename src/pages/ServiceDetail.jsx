import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { getServiceOfferById, serviceRouteForId } from '@/data/serviceOffers';
import { Button } from '@/components/ui/button';
import ServiceDetailContent, { SERVICES_SECTION_HREF } from '@/components/ServiceDetailContent';
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
      <ServiceDetailContent
        service={service}
        actions={(
          <>
            <Button asChild size="lg" className="bg-accent-purple hover:bg-accent-purple/90">
              <Link to="/contact">Request a Project Estimate</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to={SERVICES_SECTION_HREF}>View All Services</Link>
            </Button>
          </>
        )}
      />
    </>
  );
};

export default ServiceDetail;
