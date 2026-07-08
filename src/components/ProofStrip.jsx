import React, { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
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
    count: { value: 100, suffix: '%', rest: ' Job Success' },
  },
  {
    label: '11+ Projects',
    detail: 'AI and automation work',
    icon: Sparkles,
    count: { value: 11, suffix: '+', rest: ' Projects' },
  },
  {
    label: '300+ Hours',
    detail: 'Solutions delivered',
    icon: Clock3,
    count: { value: 300, suffix: '+', rest: ' Hours' },
  },
  {
    label: '94% Faster',
    detail: 'Inference improvement',
    icon: Gauge,
    count: { value: 94, suffix: '%', rest: ' Faster' },
  },
];

const ProofStatLabel = ({ item, isInView }) => {
  const countValue = useCountUp(item.count?.value ?? 0, {
    enabled: Boolean(item.count) && isInView,
  });

  if (!item.count) {
    return item.label;
  }

  if (!isInView) {
    return item.label;
  }

  return (
    <>
      {countValue}
      {item.count.suffix}
      {item.count.rest}
    </>
  );
};

const ProofCard = ({ item, index }) => {
  const { icon: Icon } = item;
  const shouldReduceMotion = useReducedMotion();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.4 });

  return (
    <motion.li
      ref={ref}
      initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
      animate={isInView || shouldReduceMotion ? { opacity: 1, y: 0 } : undefined}
      transition={{
        duration: 0.55,
        delay: shouldReduceMotion ? 0 : index * 0.08,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={shouldReduceMotion ? undefined : { y: -4 }}
      className="group flex min-h-[112px] flex-col justify-between rounded-lg border border-white/10 bg-white/[0.04] p-4 transition-shadow duration-300 hover:border-accent-purple/30 hover:shadow-[0_12px_40px_-12px_rgba(124,58,237,0.45)]"
    >
      <Icon className="h-5 w-5 text-accent-purple transition-transform duration-300 group-hover:scale-110" aria-hidden="true" />
      <div>
        <p className="text-base font-bold text-white sm:text-lg">
          <ProofStatLabel item={item} isInView={isInView} />
        </p>
        <p className="mt-1 text-xs uppercase tracking-wide text-gray-500">{item.detail}</p>
      </div>
    </motion.li>
  );
};

const ProofStrip = () => (
  <section className="bg-[#0C0D0D] border-y border-white/10" aria-labelledby="proof-heading">
    <div className="container mx-auto px-6 py-8">
      <h2 id="proof-heading" className="sr-only">Professional Credentials and Achievements</h2>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {proofItems.map((item, index) => (
          <ProofCard key={item.label} item={item} index={index} />
        ))}
      </ul>
    </div>
  </section>
);

export default ProofStrip;
