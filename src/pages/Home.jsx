import React from 'react';
import Hero from '@/components/Hero';
import ProofStrip from '@/components/ProofStrip';
import Services from '@/components/Services';
import ProjectFitDiagnostic from '@/components/ProjectFitDiagnostic';
import About from '@/components/About';
import Portfolio from '@/components/Portfolio';
import Testimonials from '@/components/Testimonials';
import CTA from '@/components/CTA';
import SectionAnimator from '@/components/SectionAnimator';
import { Seo, defaultSeo } from '@/lib/seo';

const Home = () => {
  return (
    <>
      <Seo {...defaultSeo} />
      <Hero />
      <SectionAnimator><ProofStrip /></SectionAnimator>
      <SectionAnimator><Portfolio /></SectionAnimator>
      <SectionAnimator><Services /></SectionAnimator>
      <ProjectFitDiagnostic />
      <SectionAnimator><Testimonials /></SectionAnimator>
      <About />
      <SectionAnimator><CTA /></SectionAnimator>
    </>
  );
};

export default Home;
