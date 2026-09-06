import React from 'react';
import { motion } from 'framer-motion';
import { profileImages } from '@/config/links';
import { positioning } from '@/data/positioning';

const steps = [
  ['1', 'Understand the input', 'Review the source material, required fields, destination, and exception path before agreeing scope.'],
  ['2', 'Build the workflow', 'Implement extraction, validation, and handoff steps that make the important decisions inspectable.'],
  ['3', 'Review exceptions', 'Keep a human review path where input quality or a business decision needs judgement.'],
  ['4', 'Agree the handoff', 'Document the delivered scope and next steps together; timing and support are set in the agreement.'],
];

const About = () => <section id="about" className="overflow-hidden bg-[#0C0D0D] py-24">
  <div className="container mx-auto px-6">
    <div className="grid items-center gap-16 lg:grid-cols-2">
      <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.8, ease: 'easeOut' }}><div className="aspect-[4/3] overflow-hidden rounded-2xl"><img className="h-full w-full object-cover object-[center_28%]" alt="Vivek Patel, AI Automation Engineer" src={profileImages.aboutPhoto} loading="lazy" /></div></motion.div>
      <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.8, ease: 'easeOut' }}>
        <h2 className="mb-6 text-3xl font-bold uppercase leading-tight text-white md:text-4xl lg:text-5xl">WHO I <span className="text-accent-purple">AM</span></h2>
        <h3 className="mb-3 text-2xl font-bold text-white">Vivek Patel — {positioning.role}</h3>
        <p className="text-lg text-gray-400">{positioning.primaryFocus}</p>
        <p className="mt-6 text-lg text-gray-400">Computer vision is a supporting specialty when image inputs or an existing pipeline call for it. The work is a fit when inputs, fields, destinations, and exception review can be made explicit.</p>
      </motion.div>
    </div>
    <div className="mt-24 grid gap-10 lg:grid-cols-[1fr_1.4fr]">
      <div><h2 className="mb-6 text-3xl font-bold uppercase text-white md:text-4xl lg:text-5xl">WORKING <span className="text-accent-purple">PROCESS</span></h2><p className="text-lg text-gray-400">{positioning.scope}</p></div>
      <div className="grid gap-6 sm:grid-cols-2">{steps.map(([number, title, detail]) => <motion.div key={number} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} className="relative h-full rounded-lg border border-white/10 bg-white/5 p-6"><div className="absolute -top-4 left-6 flex h-8 w-8 items-center justify-center rounded-full bg-accent-purple text-sm font-bold text-white">{number}</div><h3 className="mb-3 mt-4 text-xl font-bold text-white">{title}</h3><p className="text-sm text-gray-400">{detail}</p></motion.div>)}</div>
    </div>
  </div>
</section>;

export default About;
