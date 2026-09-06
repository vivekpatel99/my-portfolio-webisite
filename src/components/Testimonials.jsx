import React from 'react';
import { ArrowUpRight, MessageSquare } from 'lucide-react';
import { approvedProof } from '@/data/positioning';

const Testimonials = () => (
  <section id="testimonials" className="bg-[#0C0D0D] py-24" aria-labelledby="feedback-heading">
    <div className="container mx-auto max-w-4xl px-6 text-center">
      <MessageSquare className="mx-auto h-8 w-8 text-accent-purple" aria-hidden="true" />
      <h2 id="feedback-heading" className="mt-5 text-3xl font-bold uppercase text-white md:text-5xl">CLIENT <span className="text-accent-purple">FEEDBACK</span></h2>
      <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-400">Read client feedback and engagement history on my Upwork profile.</p>
      <a href={approvedProof.upwork.href} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex items-center gap-2 rounded-full border border-accent-purple/40 px-6 py-3 font-semibold text-white transition-colors hover:bg-accent-purple/10">View feedback on Upwork <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></a>
    </div>
  </section>
);

export default Testimonials;
