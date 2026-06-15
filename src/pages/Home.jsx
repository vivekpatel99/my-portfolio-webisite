import React from 'react';
import Hero from '@/components/Hero';
import TechStack from '@/components/TechStack';
import Services from '@/components/Services';
import About from '@/components/About';
import Experience from '@/components/Experience';
import Portfolio from '@/components/Portfolio';
import Testimonials from '@/components/Testimonials';
import Stats from '@/components/Stats';
import Connect from '@/components/Connect';
import CTA from '@/components/CTA';
import SectionAnimator from '@/components/SectionAnimator';
import { Seo, defaultSeo } from '@/lib/seo';

const Home = () => {
  return (
    <>
      <Seo {...defaultSeo} />
      <Hero />
      <SectionAnimator><TechStack /></SectionAnimator>
      <SectionAnimator><Services /></SectionAnimator>
      <About />
      <SectionAnimator><Experience /></SectionAnimator>
      <SectionAnimator><Portfolio /></SectionAnimator>
      <SectionAnimator><Testimonials /></SectionAnimator>
      <SectionAnimator><Stats /></SectionAnimator>
      <SectionAnimator><Connect /></SectionAnimator>
      <SectionAnimator><CTA /></SectionAnimator>
    </>
  );
};

export default Home;
