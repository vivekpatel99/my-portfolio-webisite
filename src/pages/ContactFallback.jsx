import React from 'react';
import ContactContent from '@/components/ContactContent';
import { DetectionLabel } from '@/components/DetectionFrame';
import { contactCopy } from '@/lib/contactCopy';
import { useLocale } from '@/lib/locale.js';

// Rendered only at build time. The client replaces this with the existing form.
export default function ContactFallback() {
  const copy = contactCopy[useLocale()];
  return (
    <ContactContent>
      <div className="detection-panel min-w-0 bg-gradient-to-b from-[rgba(139,92,246,0.035)] to-transparent bg-[length:100%_22%] bg-no-repeat p-7 px-[26px] pb-[26px]">
        <DetectionLabel aria-hidden="true">{copy.requestLabel}</DetectionLabel>
        <h2 className="text-[1.15rem] font-bold uppercase tracking-[-0.01em] mb-[18px]">
          {copy.fallbackTitle}
        </h2>
        <p className="text-base leading-[1.55] text-[#9ca3af]">
          {copy.fallbackBody}
        </p>
      </div>
    </ContactContent>
  );
}
