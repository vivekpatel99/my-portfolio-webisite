import React from 'react';
import { Award, CheckCircle2, Clock3, Gauge, Sparkles } from 'lucide-react';

const proofItems = [
  {
    label: 'Top Rated Plus',
    detail: 'Upwork freelancer',
    icon: Award,
  },
  {
    label: '100% Job Success',
    detail: 'Client delivery record',
    icon: CheckCircle2,
  },
  {
    label: '11+ Projects',
    detail: 'AI and automation work',
    icon: Sparkles,
  },
  {
    label: '300+ Hours',
    detail: 'Solutions delivered',
    icon: Clock3,
  },
  {
    label: '94% Faster',
    detail: 'Inference improvement',
    icon: Gauge,
  },
];

const ProofStrip = () => (
  <section className="bg-[#0C0D0D] border-y border-white/10">
    <div className="container mx-auto px-6 py-8">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {proofItems.map(({ label, detail, icon: Icon }) => (
          <div
            key={label}
            className="flex min-h-[112px] flex-col justify-between rounded-lg border border-white/10 bg-white/[0.04] p-4"
          >
            <Icon className="h-5 w-5 text-accent-purple" aria-hidden="true" />
            <div>
              <p className="text-base font-bold text-white sm:text-lg">{label}</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-gray-500">{detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default ProofStrip;
