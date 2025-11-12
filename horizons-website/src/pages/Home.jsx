import React from 'react';
import { Helmet } from 'react-helmet';
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

const Home = () => {
  return (
    <>
      <Helmet>
        <title>Vivek Patel - Expert AI & Computer Vision Engineer</title>
        <meta name="description" content="Portfolio of Vivek Patel, a freelance AI and Computer Vision Engineer specializing in production-grade deep learning, real-time processing, and intelligent automation workflows. Hire for results." />
        <meta name="keywords" content="Vivek Patel, AI Engineer, Computer Vision, Freelance AI Developer, Deep Learning, Python, PyTorch, ONNX Optimization, Web Scraping, AI Automation" />
      </Helmet>
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