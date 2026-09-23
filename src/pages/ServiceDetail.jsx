import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { serviceOffers, HOURLY_FROM_LABEL, typicalDurationLabel } from '@/data/serviceOffers';
import { Button } from '@/components/ui/button';

const ServiceDetail = () => {
  const { serviceId } = useParams();
  const service = serviceOffers.find(s => s.id === serviceId);

  if (!service) {
    return (
      <div className="min-h-screen bg-[#0C0D0D] flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Service Not Found</h1>
          <Link to="/#services" className="text-accent-purple hover:underline">
            View All Services
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0C0D0D] py-24">
      <div className="container mx-auto px-6">
        <Link
          to="/#services"
          className="inline-flex items-center gap-2 text-gray-300 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft size={20} />
          Back to Services
        </Link>

        <div className="max-w-4xl">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-white uppercase">
            {service.title}
          </h1>

          <div className="flex flex-wrap gap-4 text-lg mb-8">
            <p className="text-white font-semibold">{HOURLY_FROM_LABEL}</p>
            <p className="text-gray-300">{typicalDurationLabel(service)}</p>
          </div>

          <p className="text-xl text-gray-300 mb-12 leading-relaxed">
            {service.summary}
          </p>

          <div className="grid gap-8 md:grid-cols-2 mb-12">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">In scope</h2>
              <ul className="space-y-3">
                {service.inScope.map((item) => (
                  <li key={item} className="text-gray-300 text-base leading-relaxed">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Out of scope</h2>
              <ul className="space-y-3">
                {service.outOfScope.map((item) => (
                  <li key={item} className="text-gray-300 text-base leading-relaxed">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <Button asChild size="lg" className="bg-accent-purple hover:bg-accent-purple/90">
              <Link to="/contact">Request a Project Estimate</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/#services">View All Services</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetail;
