import React, { useEffect, useState } from 'react';

const schematicCaption = 'Illustrative process schematic — not client source material.';

const CaseStudyVisual = ({ visual, className = '' }) => {
  const [imageUnavailable, setImageUnavailable] = useState(false);
  const isImage = visual?.kind === 'image' && Boolean(visual?.src);

  useEffect(() => {
    setImageUnavailable(false);
  }, [visual?.src]);

  const caption = visual?.caption || visual?.provenance || schematicCaption;

  if (isImage && !imageUnavailable) {
    return (
      <figure className={`flex h-full min-h-48 flex-col overflow-hidden bg-[#17152a] ${className}`}>
        <img
          className="min-h-0 flex-1 object-cover"
          alt={visual.alt || 'Case study visual.'}
          src={visual.src}
          loading="lazy"
          onError={() => setImageUnavailable(true)}
        />
        <figcaption className="border-t border-white/10 bg-[#121316] px-4 py-3 text-sm text-gray-300">
          {caption}
        </figcaption>
      </figure>
    );
  }

  const label = visual?.label || 'Visual unavailable';

  return (
    <figure className={`flex h-full min-h-48 flex-col justify-center bg-gradient-to-br from-accent-purple/20 via-[#17152a] to-[#0C0D0D] p-6 text-center ${className}`}>
      <div
        className="mx-auto flex max-w-md flex-wrap items-center justify-center gap-x-2 gap-y-3 text-sm font-semibold uppercase tracking-wide text-[#d8caff]"
        role="img"
        aria-label={visual?.alt || label}
      >
        {label.split(' → ').map((step, index, steps) => (
          <span key={`${step}-${index}`} className="inline-flex items-center gap-2 whitespace-nowrap">
            <span>{step}</span>
            {index < steps.length - 1 ? <span aria-hidden="true">→</span> : null}
          </span>
        ))}
      </div>
      {imageUnavailable && (
        <p className="mt-5 text-sm text-gray-300">Visual unavailable. This schematic is an illustrative fallback, not project evidence.</p>
      )}
      <figcaption className="mt-5 text-sm text-gray-300">{isImage && imageUnavailable ? 'Illustrative fallback schematic — not client source material.' : caption}</figcaption>
    </figure>
  );
};

export default CaseStudyVisual;
