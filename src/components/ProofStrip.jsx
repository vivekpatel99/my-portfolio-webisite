import React from 'react';
import { Award, CheckCircle2, Clock3, Gauge, Sparkles } from 'lucide-react';
import useCountUp from '@/hooks/useCountUp';

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

// Splits "94% Faster" into { target: 94, suffix: '% Faster' } for count-up.
const parseLabel = (label) => {
  const match = /^(\d+)(.*)$/.exec(label);
  if (!match) return null;
  return { target: Number(match[1]), suffix: match[2] };
};

const ProofItem = ({ label, detail, icon: Icon }) => {
  const parsed = parseLabel(label);
  const [countRef, value] = useCountUp(parsed ? parsed.target : 0);
  const displayLabel = parsed ? `${value}${parsed.suffix}` : label;

  return (
    <li className="flex min-h-[112px] flex-col justify-between rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <Icon className="h-5 w-5 text-accent-purple" aria-hidden="true" />
      <div>
        <p
          ref={countRef}
          className="font-mono text-base font-bold tabular-nums text-white sm:text-lg"
        >
          {displayLabel}
        </p>
        <p className="mt-1 text-xs uppercase tracking-wide text-gray-500">{detail}</p>
      </div>
    </li>
  );
};

const ProofStrip = () => (
  <section className="bg-[#0C0D0D] border-y border-white/10" aria-labelledby="proof-heading">
    <div className="container mx-auto px-6 py-8">
      <h2 id="proof-heading" className="sr-only">Professional Credentials and Achievements</h2>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {proofItems.map((item) => (
          <ProofItem key={item.label} {...item} />
        ))}
      </ul>
    </div>
  </section>
);

export default ProofStrip;
