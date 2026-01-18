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
        <meta
          name="description"
          content="Hire Vivek Patel - Freelance AI & Computer Vision Engineer in Europe. Expert in web scraping, n8n automation, YOLO, PyTorch, and LangChain. 94% performance improvements. €80/hour."
        />
        <meta
          name="keywords"
          content="Vivek Patel, AI Engineer Europe, Computer Vision Freelancer, n8n Automation, Web Scraping Expert, YOLO, PyTorch, LangChain, Data Extraction, Python Developer Europe"
        />
        <link rel="canonical" href="https://www.vivekapatel.com/" />
      </Helmet>
      <Hero />
      <SectionAnimator>
        <TechStack />
      </SectionAnimator>
      <SectionAnimator>
        <Services />
      </SectionAnimator>
      <About />
      <SectionAnimator>
        <Experience />
      </SectionAnimator>
      <SectionAnimator>
        <Portfolio />
      </SectionAnimator>
      <SectionAnimator>
        <Testimonials />
      </SectionAnimator>
      <SectionAnimator>
        <Stats />
      </SectionAnimator>
      <SectionAnimator>
        <Connect />
      </SectionAnimator>
      <SectionAnimator>
        <CTA />
      </SectionAnimator>
    </>
  );
};

export default Home;
