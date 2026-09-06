import React from 'react';
import { Award, CheckCircle2, Workflow } from 'lucide-react';
import { proofItems } from '@/data/positioning';

const icons = [Award, Workflow, CheckCircle2];

const ProofStrip = () => (
  <section className="border-y border-white/10 bg-[#0C0D0D]" aria-labelledby="proof-heading">
    <div className="container mx-auto px-6 py-8">
      <h2 id="proof-heading" className="sr-only">Evidence and working focus</h2>
      <ul className="grid gap-3 md:grid-cols-3">
        {proofItems.map(({ claimId, label, detail, href }, index) => {
          const Icon = icons[index];
          const content = <><p className="text-base font-bold text-white sm:text-lg">{label}</p><p className="mt-1 text-xs uppercase tracking-wide text-gray-500">{detail}</p></>;
          return (
            <li key={claimId + label} className="flex min-h-[112px] flex-col justify-between rounded-lg border border-white/10 bg-white/[0.04] p-4">
              <Icon className="h-5 w-5 text-accent-purple" aria-hidden="true" />
              {href ? <a href={href} target="_blank" rel="noopener noreferrer" className="hover:text-accent-purple">{content}</a> : <div>{content}</div>}
            </li>
          );
        })}
      </ul>
    </div>
  </section>
);

export default ProofStrip;
