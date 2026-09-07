import React from 'react';

const CaseStudyVisual = ({ visual, className = '' }) => {
  if (visual.kind === 'image') {
    return <img className={className} alt={visual.alt} src={visual.src} loading="lazy" />;
  }

  return (
    <figure className={`flex h-full min-h-48 flex-col justify-center bg-gradient-to-br from-accent-purple/20 via-[#17152a] to-[#0C0D0D] p-6 text-center ${className}`}>
      <div className="mx-auto flex max-w-md flex-wrap items-center justify-center gap-x-2 gap-y-3 text-sm font-semibold uppercase tracking-wide text-[#d8caff]">
        {visual.label.split(' → ').map((step, index, steps) => (
          <span key={step} className="inline-flex items-center gap-2 whitespace-nowrap">
            <span>{step}</span>
            {index < steps.length - 1 ? <span aria-hidden="true">→</span> : null}
          </span>
        ))}
      </div>
      <figcaption className="mt-5 text-sm text-gray-300">Illustrative process schematic — not client source material.</figcaption>
    </figure>
  );
};

export default CaseStudyVisual;
