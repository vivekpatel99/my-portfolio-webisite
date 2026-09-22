import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { serviceOffers, HOURLY_FROM_LABEL, typicalDurationLabel } from '@/data/serviceOffers';

const ServiceDetail = () => {
  const { serviceId } = useParams();
  const service = serviceOffers.find(s => s.id === serviceId);

  if (!service) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-[#0C0D0D] py-24">
      <div className="container mx-auto px-6">
        <Link
          to="/#services"
          className="inline-flex items-center gap-2 text-accent-purple hover:text-accent-purple/80 transition-colors mb-8"
        >
          <ArrowLeft size={20} />
          Back to Services
        </Link>

        <div className="max-w-4xl">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-6 uppercase leading-tight">
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
            <div className="bg-[#1E1E2A] p-6 rounded-2xl border border-white/10">
              <h2 className="text-white text-2xl font-bold mb-4">In scope</h2>
              <ul className="space-y-3">
                {service.inScope.map((item) => (
                  <li key={item} className="text-gray-300 flex items-start gap-2">
                    <span className="text-accent-purple mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-[#1E1E2A] p-6 rounded-2xl border border-white/10">
              <h2 className="text-white text-2xl font-bold mb-4">Out of scope</h2>
              <ul className="space-y-3">
                {service.outOfScope.map((item) => (
                  <li key={item} className="text-gray-400 flex items-start gap-2">
                    <span className="text-gray-600 mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 bg-accent-purple hover:bg-accent-purple/90 text-white font-semibold px-8 py-4 rounded-lg transition-colors text-lg"
            >
              Request a Project Estimate
              <ArrowRight size={20} />
            </Link>
            <Link
              to="/#services"
              className="inline-flex items-center justify-center gap-2 border border-white/20 hover:border-accent-purple/50 text-white font-semibold px-8 py-4 rounded-lg transition-colors text-lg"
            >
              View All Services
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetail;
